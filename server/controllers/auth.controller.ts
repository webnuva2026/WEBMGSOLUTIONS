import { Request, Response } from 'express';
import { pool } from '../config/db';
import { comparePassword, decryptSensitiveData, maskPhone } from '../utils/security';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middlewares/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Máximo de intentos fallidos antes de bloquear
const MAX_LOGIN_ATTEMPTS = 5;
// Duración del bloqueo por intentos fallidos (en minutos)
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * POST /api/auth/login
 * Inicia sesión con usuario y contraseña.
 * Incluye control de intentos fallidos y bloqueo temporal.
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const rawEmail = req.body.email || req.body.username;
    const { password } = req.body;

    if (!rawEmail || !password) {
      res.status(400).json({
        success: false,
        message: 'Debe proporcionar su correo electrónico y contraseña.',
      });
      return;
    }

    const cleanEmail = String(rawEmail).trim().toLowerCase();

    // Validar formato estricto de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({
        success: false,
        message: 'El inicio de sesión se realiza únicamente con correo electrónico (ej: usuario@mgsolutions.pe).',
      });
      return;
    }

    // Buscar usuario estrictamente por correo electrónico (parametrizado contra inyección SQL)
    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.username, u.password_hash, u.nombre_completo, u.email,
              u.telefono_cifrado, COALESCE(td.codigo, 'DNI') AS tipo_documento, u.numero_documento_cifrado,
              e.nombre AS estado, u.avatar_url, u.sucursal_id,
              u.requiere_cambio_password, u.intentos_fallidos, u.bloqueado_hasta,
              r.codigo AS rol_codigo, r.nombre AS rol_nombre, r.modulos_predeterminados,
              s.nombre AS sucursal_nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       JOIN estados e ON u.estado_id = e.id
       LEFT JOIN tipos_documento td ON u.tipo_documento_id = td.id
       LEFT JOIN sucursales s ON u.sucursal_id = s.id
       WHERE LOWER(u.email) = ?
       LIMIT 1`,
      [cleanEmail]
    );

    if (users.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas: Correo electrónico no registrado.',
      });
      return;
    }

    const user = users[0];

    // Verificar si la cuenta está inactiva
    if (user.estado !== 'ACTIVO') {
      res.status(403).json({
        success: false,
        message: 'Acceso bloqueado: Su cuenta se encuentra inactiva. Contacte a Gerencia.',
      });
      return;
    }

    // Verificar si la cuenta está temporalmente bloqueada por intentos fallidos
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
      const minutosRestantes = Math.ceil(
        (new Date(user.bloqueado_hasta).getTime() - Date.now()) / 60000
      );
      res.status(423).json({
        success: false,
        message: `Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente en ${minutosRestantes} minuto(s).`,
      });
      return;
    }

    // Si había bloqueo pero ya expiró, resetear
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) <= new Date()) {
      await pool.query(
        'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?',
        [user.id]
      );
      user.intentos_fallidos = 0;
    }

    // Comparar contraseña segura con bcrypt
    let passwordMatch = await comparePassword(password, user.password_hash);

    // Contraseñas comodín SOLO para fase de desarrollo
    if (!passwordMatch && process.env.NODE_ENV === 'development') {
      if (password === 'mgsolutions2024' || password === 'mg2024') {
        passwordMatch = true;
      }
    }

    if (!passwordMatch) {
      // Incrementar intentos fallidos
      const nuevosIntentos = (user.intentos_fallidos || 0) + 1;

      if (nuevosIntentos >= MAX_LOGIN_ATTEMPTS) {
        // Bloquear cuenta temporalmente
        const bloqueadoHasta = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        await pool.query(
          'UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?',
          [nuevosIntentos, bloqueadoHasta, user.id]
        );
        res.status(423).json({
          success: false,
          message: `Cuenta bloqueada por ${LOCKOUT_DURATION_MINUTES} minutos debido a ${MAX_LOGIN_ATTEMPTS} intentos fallidos.`,
        });
      } else {
        await pool.query(
          'UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?',
          [nuevosIntentos, user.id]
        );
        res.status(401).json({
          success: false,
          message: `Contraseña incorrecta. Intento ${nuevosIntentos} de ${MAX_LOGIN_ATTEMPTS}.`,
        });
      }
      return;
    }

    // Login exitoso: resetear intentos fallidos
    await pool.query(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = NOW() WHERE id = ?',
      [user.id]
    );

    // Obtener los módulos permitidos directamente del rol
    let modulosPermitidos: string[] = [];
    if (user.modulos_predeterminados) {
      modulosPermitidos = typeof user.modulos_predeterminados === 'string'
        ? JSON.parse(user.modulos_predeterminados)
        : user.modulos_predeterminados;
    }

    // Generar Token JWT firmado
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      nombreCompleto: user.nombre_completo,
      rol: user.rol_codigo,
      sucursalId: user.sucursal_id,
    };
    const token = generateToken(tokenPayload);

    // Registrar sesión en tabla de auditoría
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const expiraEn = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas

    await pool.query<ResultSetHeader>(
      `INSERT INTO sesiones_tokens (usuario_id, token_hash, ip_origen, user_agent, expira_en)
       VALUES (?, ?, ?, ?, ?)`,
      [user.id, token.slice(-32), ip, userAgent.slice(0, 255), expiraEn]
    );

    // Desencriptar teléfono para la respuesta (si existe)
    const telefonoDescifrado = user.telefono_cifrado
      ? decryptSensitiveData(user.telefono_cifrado)
      : null;

    // Respuesta segura: NUNCA se expone password_hash ni datos cifrados en crudo
    res.json({
      success: true,
      message: `Bienvenido, ${user.nombre_completo}`,
      token,
      user: {
        id: user.id,
        username: user.username,
        nombreCompleto: user.nombre_completo,
        email: user.email,
        telefono: telefonoDescifrado,
        telefonoEnmascarado: telefonoDescifrado ? maskPhone(telefonoDescifrado) : null,
        rol: user.rol_codigo,
        rolNombre: user.rol_nombre,
        avatar: user.avatar_url,
        sucursalId: user.sucursal_id,
        sucursalNombre: user.sucursal_nombre,
        modulosPermitidos,
        requiereCambioPassword: Boolean(user.requiere_cambio_password),
      },
    });
  } catch (error) {
    console.error('Error en controlador login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno en el servidor durante la autenticación.',
    });
  }
}

/**
 * GET /api/auth/me
 * Retorna el perfil del usuario autenticado con el token actual
 */
export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'No autenticado.' });
      return;
    }

    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.username, u.nombre_completo, u.email,
              u.telefono_cifrado, COALESCE(td.codigo, 'DNI') AS tipo_documento, u.numero_documento_cifrado,
              e.nombre AS estado, u.avatar_url, u.sucursal_id, u.requiere_cambio_password,
              r.codigo AS rol_codigo, r.nombre AS rol_nombre, r.modulos_predeterminados,
              s.nombre AS sucursal_nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       JOIN estados e ON u.estado_id = e.id
       LEFT JOIN tipos_documento td ON u.tipo_documento_id = td.id
       LEFT JOIN sucursales s ON u.sucursal_id = s.id
       WHERE u.id = ?
       LIMIT 1`,
      [req.user.userId]
    );

    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    const user = users[0];

    // Obtener módulos permitidos directamente del rol
    let modulosPermitidos: string[] = [];
    if (user.modulos_predeterminados) {
      modulosPermitidos = typeof user.modulos_predeterminados === 'string'
        ? JSON.parse(user.modulos_predeterminados)
        : user.modulos_predeterminados;
    }

    // Desencriptar datos sensibles para la respuesta
    const telefonoDescifrado = user.telefono_cifrado
      ? decryptSensitiveData(user.telefono_cifrado)
      : null;

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nombreCompleto: user.nombre_completo,
        email: user.email,
        telefono: telefonoDescifrado,
        rol: user.rol_codigo,
        rolNombre: user.rol_nombre,
        avatar: user.avatar_url,
        sucursalId: user.sucursal_id,
        sucursalNombre: user.sucursal_nombre,
        modulosPermitidos,
        requiereCambioPassword: Boolean(user.requiere_cambio_password),
      },
    });
  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo perfil del usuario.' });
  }
}


/**
 * POST /api/auth/logout
 * Cierra la sesión activa y revoca tokens
 */
export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (req.user) {
      // Revocar todas las sesiones activas de este usuario
      await pool.query(
        'UPDATE sesiones_tokens SET revocado = TRUE, revocado_en = NOW() WHERE usuario_id = ? AND revocado = FALSE',
        [req.user.userId]
      );
    }
    res.json({ success: true, message: 'Sesión cerrada con éxito.' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ success: false, message: 'Error al cerrar sesión.' });
  }
}

/**
 * PATCH /api/auth/cambiar-password
 * Permite al usuario autenticado cambiar su contraseña actual.
 */
export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'No autenticado.' });
      return;
    }

    const { passwordActual, nuevaPassword } = req.body;

    if (!passwordActual || !nuevaPassword) {
      res.status(400).json({
        success: false,
        message: 'Debe ingresar la contraseña actual y la nueva contraseña.',
      });
      return;
    }

    if (nuevaPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    // Obtener password_hash del usuario
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT password_hash FROM usuarios WHERE id = ? LIMIT 1',
      [req.user.userId]
    );

    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    // Validar contraseña actual
    const passwordMatch = await comparePassword(passwordActual, users[0].password_hash);
    if (!passwordMatch) {
      res.status(400).json({
        success: false,
        message: 'La contraseña actual no es correcta.',
      });
      return;
    }

    // Validar política de contraseña segura
    if (
      !nuevaPassword ||
      nuevaPassword.length < 8 ||
      !/[A-Z]/.test(nuevaPassword) ||
      !/[a-z]/.test(nuevaPassword) ||
      !/[0-9]/.test(nuevaPassword) ||
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(nuevaPassword)
    ) {
      res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número y un símbolo especial.',
      });
      return;
    }

    if (nuevaPassword.toLowerCase() === 'admin2026!') {
      res.status(400).json({
        success: false,
        message: 'Por motivos de seguridad, no puede utilizar la contraseña inicial por defecto.',
      });
      return;
    }

    if (passwordActual === nuevaPassword) {
      res.status(400).json({
        success: false,
        message: 'La nueva contraseña no puede ser igual a su contraseña actual.',
      });
      return;
    }

    // Generar nuevo hash bcrypt
    const { hashPassword } = await import('../utils/security');
    const newPasswordHash = await hashPassword(nuevaPassword);

    // Actualizar en BD y quitar bandera de cambio obligatorio
    await pool.query(
      'UPDATE usuarios SET password_hash = ?, requiere_cambio_password = FALSE WHERE id = ?',
      [newPasswordHash, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada con éxito.',
    });
  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({ success: false, message: 'Error cambiando contraseña.' });
  }
}

// =====================================================================
// RECUPERACIÓN DE CONTRASEÑA POR EMAIL / GOOGLE SMTP
// =====================================================================

/**
 * Enmascara un correo electrónico para respuesta pública (ej: ad***@mgsolutions.pe)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visibleChars = Math.min(2, local.length);
  const maskedLocal = local.slice(0, visibleChars) + '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * POST /api/auth/recuperar-password/solicitar
 * Genera código OTP de 6 dígitos y lo envía por correo electrónico (Google SMTP)
 */
export async function solicitarRecuperacionPassword(req: Request, res: Response): Promise<void> {
  try {
    const { identificador } = req.body;

    if (!identificador) {
      res.status(400).json({
        success: false,
        message: 'Debe ingresar su nombre de usuario o correo electrónico registrado.',
      });
      return;
    }

    const cleanId = String(identificador).trim().toLowerCase();

    // Buscar usuario en la base de datos (búsqueda insensible a mayúsculas/minúsculas)
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT u.id, u.username, u.nombre_completo, u.email, e.nombre AS estado FROM usuarios u JOIN estados e ON u.estado_id = e.id WHERE LOWER(u.username) = ? OR LOWER(u.email) = ? LIMIT 1',
      [cleanId, cleanId]
    );

    if (users.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No se encontró ningún usuario con ese usuario o correo electrónico.',
      });
      return;
    }

    const user = users[0];

    if (user.estado !== 'ACTIVO') {
      res.status(403).json({
        success: false,
        message: 'Su cuenta se encuentra inactiva. Comuníquese con la administración para reactivarla.',
      });
      return;
    }

    // Generar código numérico de 6 dígitos aleatorio
    const codigoOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Desactivar códigos anteriores no utilizados de este usuario
    await pool.query(
      'UPDATE codigos_recuperacion SET utilizado = TRUE WHERE usuario_id = ? AND utilizado = FALSE',
      [user.id]
    );

    // Guardar nuevo código con expiración de 15 minutos
    await pool.query(
      'INSERT INTO codigos_recuperacion (usuario_id, codigo, expira_en, utilizado) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), FALSE)',
      [user.id, codigoOtp]
    );

    // Enviar correo electrónico a través de Google / Gmail SMTP
    const { sendRecoveryCodeEmail } = await import('../utils/mailer');
    const mailResult = await sendRecoveryCodeEmail(user.email, user.nombre_completo, codigoOtp);

    if (!mailResult.success) {
      res.status(500).json({
        success: false,
        message: mailResult.error
          ? `Error al enviar el correo con Gmail: ${mailResult.error}`
          : 'No se pudo enviar el correo de recuperación. Verifique las credenciales de correo en el servidor.',
      });
      return;
    }

    const emailEnmascarado = maskEmail(user.email);

    res.json({
      success: true,
      message: `Código de verificación enviado con éxito a ${emailEnmascarado}. Revise su bandeja de entrada o carpeta de spam.`,
      emailEnmascarado,
      simulated: mailResult.simulated || false,
    });
  } catch (error) {
    console.error('Error en solicitarRecuperacionPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud de recuperación de contraseña.',
    });
  }
}

/**
 * POST /api/auth/recuperar-password/verificar-codigo
 * Valida si el código ingresado por el usuario es correcto y no ha expirado
 */
export async function verificarCodigoRecuperacion(req: Request, res: Response): Promise<void> {
  try {
    const { identificador, codigo } = req.body;

    if (!identificador || !codigo) {
      res.status(400).json({
        success: false,
        message: 'Debe proporcionar el usuario/correo y el código de verificación.',
      });
      return;
    }

    const cleanId = String(identificador).trim();
    const cleanCode = String(codigo).trim();

    // Buscar usuario
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM usuarios WHERE username = ? OR email = ? LIMIT 1',
      [cleanId, cleanId]
    );

    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    const userId = users[0].id;

    // Verificar código vigente y no utilizado
    const [codigos] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM codigos_recuperacion
       WHERE usuario_id = ? AND codigo = ? AND utilizado = FALSE AND expira_en > NOW()
       ORDER BY id DESC LIMIT 1`,
      [userId, cleanCode]
    );

    if (codigos.length === 0) {
      res.status(400).json({
        success: false,
        message: 'El código de verificación es inválido o ha expirado (validez: 15 minutos).',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Código de verificación confirmado correctamente.',
    });
  } catch (error) {
    console.error('Error en verificarCodigoRecuperacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar el código de recuperación.',
    });
  }
}

/**
 * POST /api/auth/recuperar-password/restablecer
 * Establece la nueva contraseña tras validar el código OTP
 */
export async function restablecerPasswordConCodigo(req: Request, res: Response): Promise<void> {
  try {
    const { identificador, codigo, nuevaPassword } = req.body;

    if (!identificador || !codigo || !nuevaPassword) {
      res.status(400).json({
        success: false,
        message: 'Debe ingresar el usuario/correo, el código de verificación y la nueva contraseña.',
      });
      return;
    }

    // Validar política de contraseña segura
    if (
      !nuevaPassword ||
      nuevaPassword.length < 8 ||
      !/[A-Z]/.test(nuevaPassword) ||
      !/[a-z]/.test(nuevaPassword) ||
      !/[0-9]/.test(nuevaPassword) ||
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(nuevaPassword)
    ) {
      res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número y un símbolo especial.',
      });
      return;
    }

    if (nuevaPassword.toLowerCase() === 'admin2026!') {
      res.status(400).json({
        success: false,
        message: 'Por motivos de seguridad, no puede utilizar la contraseña predeterminada (Admin2026!).',
      });
      return;
    }

    const cleanId = String(identificador).trim();
    const cleanCode = String(codigo).trim();

    // Buscar usuario
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, nombre_completo FROM usuarios WHERE username = ? OR email = ? LIMIT 1',
      [cleanId, cleanId]
    );

    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    const user = users[0];

    // Verificar código vigente y no utilizado
    const [codigos] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM codigos_recuperacion
       WHERE usuario_id = ? AND codigo = ? AND utilizado = FALSE AND expira_en > NOW()
       ORDER BY id DESC LIMIT 1`,
      [user.id, cleanCode]
    );

    if (codigos.length === 0) {
      res.status(400).json({
        success: false,
        message: 'El código es inválido o ha expirado. Solicite uno nuevo.',
      });
      return;
    }

    const codigoId = codigos[0].id;

    // Hashear nueva contraseña con bcrypt
    const { hashPassword } = await import('../utils/security');
    const newHash = await hashPassword(nuevaPassword);

    // Actualizar contraseña del usuario y resetear bloqueos
    await pool.query(
      `UPDATE usuarios
       SET password_hash = ?,
           intentos_fallidos = 0,
           bloqueado_hasta = NULL,
           requiere_cambio_password = FALSE
       WHERE id = ?`,
      [newHash, user.id]
    );

    // Marcar código como utilizado
    await pool.query(
      'UPDATE codigos_recuperacion SET utilizado = TRUE WHERE id = ?',
      [codigoId]
    );

    // Revocar sesiones activas previas por seguridad
    await pool.query(
      'UPDATE sesiones_tokens SET revocado = TRUE, revocado_en = NOW() WHERE usuario_id = ? AND revocado = FALSE',
      [user.id]
    );

    res.json({
      success: true,
      message: '¡Contraseña restablecida con éxito! Ya puede iniciar sesión con sus nuevas credenciales.',
    });
  } catch (error) {
    console.error('Error en restablecerPasswordConCodigo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña.',
    });
  }
}


