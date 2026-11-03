import { Request, Response } from 'express';
import { pool } from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import {
  hashPassword,
  encryptSensitiveData,
  decryptSensitiveData,
  maskPhone,
  maskDocument,
} from '../utils/security';
import { sendWelcomeCredentialsEmail, getMailTransporter, dispatchEmail } from '../utils/mailer';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// =====================================================================
// HELPERS INTERNOS
// =====================================================================

/**
 * Parsea los módulos predeterminados de un rol (soporta string JSON o array)
 */
function parseModulos(modulosRaw: any): string[] {
  if (!modulosRaw) return [];
  if (typeof modulosRaw === 'string') {
    try {
      return JSON.parse(modulosRaw);
    } catch {
      return [];
    }
  }
  return Array.isArray(modulosRaw) ? modulosRaw : [];
}

/**
 * Formatea un usuario de la BD para la respuesta JSON
 */
function formatearUsuarioResponse(u: RowDataPacket) {
  const telefonoDescifrado = u.telefono_cifrado
    ? decryptSensitiveData(u.telefono_cifrado)
    : null;
  const documentoDescifrado = u.numero_documento_cifrado
    ? decryptSensitiveData(u.numero_documento_cifrado)
    : null;

  const modulosPermitidos = parseModulos(u.modulos_predeterminados);

  return {
    id: u.id,
    username: u.username,
    nombreCompleto: u.nombre_completo,
    email: u.email,
    telefono: telefonoDescifrado,
    telefonoEnmascarado: telefonoDescifrado ? maskPhone(telefonoDescifrado) : null,
    tipoDocumento: u.tipo_documento,
    numeroDocumento: documentoDescifrado,
    documentoEnmascarado: documentoDescifrado ? maskDocument(documentoDescifrado) : null,
    rol: u.rol_codigo,
    rolNombre: u.rol_nombre,
    estado: u.estado,
    avatar: u.avatar_url,
    ultimoAcceso: u.ultimo_acceso,
    sucursalId: u.sucursal_id,
    sucursalNombre: u.sucursal_nombre,
    modulosPermitidos,
    requiereCambioPassword: Boolean(u.requiere_cambio_password),
    intentosFallidos: u.intentos_fallidos || 0,
    bloqueadoHasta: u.bloqueado_hasta,
    createdAt: u.created_at,
  };
}

// =====================================================================
// ENDPOINTS DE USUARIOS
// =====================================================================

/**
 * GET /api/usuarios
 * Retorna todos los usuarios con roles y módulos permitidos derivados del rol.
 */
export async function getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.username, u.nombre_completo, u.email,
              u.telefono_cifrado, COALESCE(td.codigo, 'DNI') AS tipo_documento, u.numero_documento_cifrado,
              e.nombre AS estado, u.avatar_url, u.ultimo_acceso, u.created_at,
              u.requiere_cambio_password, u.intentos_fallidos, u.bloqueado_hasta,
              r.codigo AS rol_codigo, r.nombre AS rol_nombre, r.modulos_predeterminados,
              s.id AS sucursal_id, s.nombre AS sucursal_nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       JOIN estados e ON u.estado_id = e.id
       LEFT JOIN tipos_documento td ON u.tipo_documento_id = td.id
       LEFT JOIN sucursales s ON u.sucursal_id = s.id
       ORDER BY u.id ASC`
    );

    const usuarios = rows.map((u) => formatearUsuarioResponse(u));
    res.json({ success: true, usuarios });
  } catch (error) {
    console.error('Error en getUsers:', error);
    res.status(500).json({ success: false, message: 'Error consultando usuarios.' });
  }
}

/**
 * GET /api/usuarios/:id
 * Retorna un usuario específico por ID con sus módulos derivados del rol.
 */
export async function getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.username, u.nombre_completo, u.email,
              u.telefono_cifrado, COALESCE(td.codigo, 'DNI') AS tipo_documento, u.numero_documento_cifrado,
              e.nombre AS estado, u.avatar_url, u.ultimo_acceso, u.created_at,
              u.requiere_cambio_password, u.intentos_fallidos, u.bloqueado_hasta,
              r.codigo AS rol_codigo, r.nombre AS rol_nombre, r.modulos_predeterminados,
              s.id AS sucursal_id, s.nombre AS sucursal_nombre
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       JOIN estados e ON u.estado_id = e.id
       LEFT JOIN tipos_documento td ON u.tipo_documento_id = td.id
       LEFT JOIN sucursales s ON u.sucursal_id = s.id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    res.json({ success: true, usuario: formatearUsuarioResponse(rows[0]) });
  } catch (error) {
    console.error('Error en getUserById:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo usuario.' });
  }
}

/**
 * POST /api/usuarios
 * Crea un nuevo usuario.
 * Los permisos de módulos se derivan automáticamente del rol asignado.
 * Encripta teléfono y documento con AES-256.
 * Hashea la contraseña con bcrypt.
 */
export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      username,
      password,
      nombreCompleto,
      email,
      telefono,
      tipoDocumento,
      numeroDocumento,
      rolId,
      sucursalId,
    } = req.body;

    const rolTarget = rolId || req.body.rol;
    // Validaciones básicas
    if (!nombreCompleto || !email || !rolTarget) {
      res.status(400).json({
        success: false,
        message: 'Campos obligatorios: nombreCompleto, email, rol (o rolId).',
      });
      return;
    }

    // Autogenerar username MG-XXXXXX si no viene desde el cliente
    const finalUsername = (username && String(username).trim())
      ? String(username).trim().toUpperCase()
      : `MG-${Math.floor(100000 + Math.random() * 900000)}`;

    // Generar contraseña temporal segura aleatoria si no se proporciona una explícitamente
    const rawPassword =
      password && String(password).trim().length >= 6
        ? String(password).trim()
        : `Mg${Math.floor(100000 + Math.random() * 900000)}!`;

    // Verificar username y email único
    const [existingUser] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM usuarios WHERE username = ? OR email = ? LIMIT 1',
      [finalUsername, email.trim()]
    );
    if (existingUser.length > 0) {
      res.status(409).json({
        success: false,
        message: 'El nombre de usuario o correo electrónico ya está registrado en el sistema.',
      });
      return;
    }

    // Verificar que el rol exista (por ID o por Código)
    let rolQuery = 'SELECT r.id, r.codigo, r.nombre, r.modulos_predeterminados FROM roles r JOIN estados e ON r.estado_id = e.id WHERE ';
    let rolParam: any;
    if (rolId && !isNaN(Number(rolId))) {
      rolQuery += 'r.id = ? AND e.nombre = "ACTIVO" LIMIT 1';
      rolParam = Number(rolId);
    } else {
      rolQuery += 'r.codigo = ? AND e.nombre = "ACTIVO" LIMIT 1';
      rolParam = String(rolTarget).trim().toUpperCase();
    }

    const [rolRows] = await pool.query<RowDataPacket[]>(rolQuery, [rolParam]);
    if (rolRows.length === 0) {
      res.status(400).json({ success: false, message: 'Rol no encontrado o inactivo.' });
      return;
    }

    const rol = rolRows[0];
    const modulosPredeterminados = parseModulos(rol.modulos_predeterminados);

    // Hashear contraseña
    const passwordHash = await hashPassword(rawPassword);

    // Cifrar datos sensibles
    const telefonoCifrado = telefono ? encryptSensitiveData(telefono.trim()) : null;
    const documentoCifrado = numeroDocumento ? encryptSensitiveData(numeroDocumento.trim()) : null;
    const tipoDocId = tipoDocumento === 'RUC' ? 2 : (tipoDocumento === 'CE' ? 3 : 1);

    const adminId = req.user?.userId || null;

    // Insertar usuario
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO usuarios (
        username, password_hash, nombre_completo, email,
        telefono_cifrado, tipo_documento_id, numero_documento_cifrado,
        rol_id, sucursal_id, estado_id, requiere_cambio_password,
        intentos_fallidos, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, TRUE, 0, ?)`,
      [
        finalUsername,
        passwordHash,
        nombreCompleto.trim(),
        email.trim(),
        telefonoCifrado,
        tipoDocId,
        documentoCifrado,
        rol.id,
        sucursalId || null,
        adminId,
      ]
    );

    // Despachar correo de bienvenida formal con credenciales en segundo plano (no bloquea la respuesta HTTP)
    const frontendUrl = process.env.FRONTEND_URL || 'https://webmgsolutions.onrender.com';
    sendWelcomeCredentialsEmail({
      toEmail: email.trim(),
      nombreCompleto: nombreCompleto.trim(),
      username: finalUsername,
      passwordTemporal: rawPassword,
      rolNombre: rol.nombre,
      loginUrl: frontendUrl,
    }).then((emailResult) => {
      console.log('📧 Correo de bienvenida enviado a', email, emailResult);
    }).catch((mailErr: any) => {
      console.error('Error enviando correo de bienvenida en background:', mailErr);
    });

    res.status(201).json({
      success: true,
      message: `Usuario '${finalUsername}' creado con éxito y credenciales enviadas a ${email}.`,
      passwordTemporal: rawPassword,
      usuario: {
        id: result.insertId,
        username: finalUsername,
        nombreCompleto: nombreCompleto.trim(),
        email: email.trim(),
        rol: rol.codigo,
        rolNombre: rol.nombre,
        estado: 'ACTIVO',
        modulosPermitidos: modulosPredeterminados,
      },
    });
  } catch (error: any) {
    console.error('Error en createUser:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ success: false, message: 'Username o email duplicado.' });
    } else {
      res.status(500).json({ success: false, message: 'Error creando usuario.' });
    }
  }
}

/**
 * PUT /api/usuarios/:id
 * Actualiza datos de un usuario existente.
 */
export async function updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);
    const {
      nombreCompleto,
      email,
      telefono,
      tipoDocumento,
      numeroDocumento,
      rolId,
      sucursalId,
    } = req.body;

    // Verificar que el usuario exista y obtener datos actuales para detectar cambios
    const [existingRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, email, nombre_completo, username FROM usuarios WHERE id = ? LIMIT 1',
      [userId]
    );
    if (existingRows.length === 0) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    const currentUserData = existingRows[0];
    let emailChanged = false;
    let normalizedNewEmail = '';

    // Verificar email único (excluyendo al usuario actual)
    if (email) {
      normalizedNewEmail = email.trim().toLowerCase();
      if (currentUserData.email && currentUserData.email.toLowerCase() !== normalizedNewEmail) {
        emailChanged = true;
      }

      const [emailCheck] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM usuarios WHERE LOWER(email) = ? AND id != ? LIMIT 1',
        [normalizedNewEmail, userId]
      );
      if (emailCheck.length > 0) {
        res.status(409).json({ success: false, message: 'El email ya está en uso por otro usuario.' });
        return;
      }
    }

    // Cifrar datos sensibles si se enviaron
    const telefonoCifrado = telefono !== undefined
      ? (telefono ? encryptSensitiveData(telefono.trim()) : null)
      : undefined;
    const documentoCifrado = numeroDocumento !== undefined
      ? (numeroDocumento ? encryptSensitiveData(numeroDocumento.trim()) : null)
      : undefined;

    // Construir SET dinámico (solo campos enviados)
    const updates: string[] = [];
    const params: any[] = [];

    if (nombreCompleto !== undefined) { updates.push('nombre_completo = ?'); params.push(nombreCompleto.trim()); }
    if (email !== undefined) { updates.push('email = ?'); params.push(normalizedNewEmail); }
    if (telefonoCifrado !== undefined) { updates.push('telefono_cifrado = ?'); params.push(telefonoCifrado); }
    if (tipoDocumento !== undefined) {
      const tipoDocId = tipoDocumento === 'RUC' ? 2 : (tipoDocumento === 'CE' ? 3 : 1);
      updates.push('tipo_documento_id = ?');
      params.push(tipoDocId);
    }
    if (documentoCifrado !== undefined) { updates.push('numero_documento_cifrado = ?'); params.push(documentoCifrado); }
    if (rolId !== undefined) { updates.push('rol_id = ?'); params.push(rolId); }
    if (req.body.rol !== undefined && rolId === undefined) {
      const [rRows] = await pool.query<RowDataPacket[]>('SELECT id FROM roles WHERE codigo = ? LIMIT 1', [req.body.rol]);
      if (rRows.length > 0) {
        updates.push('rol_id = ?');
        params.push(rRows[0].id);
      }
    }
    if (sucursalId !== undefined) { updates.push('sucursal_id = ?'); params.push(sucursalId || null); }

    if (updates.length === 0) {
      res.status(400).json({ success: false, message: 'No se enviaron campos para actualizar.' });
      return;
    }

    params.push(userId);
    await pool.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, params);

    // Si el email fue modificado, despachar notificación al nuevo correo en segundo plano
    if (emailChanged && normalizedNewEmail) {
      const fromEmail = process.env.EMAIL_FROM || 'MG Solutions <mgsolutionsg@gmail.com>';
      dispatchEmail({
        from: fromEmail,
        to: normalizedNewEmail,
        subject: '✉️ Correo electrónico actualizado - MG Solutions ERP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #00346F; margin: 0;">MG SOLUTIONS GROUP S.A.C.</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Actualización de Cuenta de Acceso</p>
            </div>
            <p style="font-size: 14px; color: #334155;">Estimado(a) <strong>${currentUserData.nombre_completo || currentUserData.username}</strong>,</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.5;">
              Le confirmamos que el administrador del sistema ha actualizado su correo electrónico de acceso a:
            </p>
            <div style="background-color: #eff6ff; border-left: 4px solid #00346F; padding: 12px 16px; margin: 15px 0; border-radius: 4px;">
              <span style="font-size: 15px; font-weight: bold; color: #00346F;">${normalizedNewEmail}</span>
            </div>
            <p style="font-size: 13px; color: #475569; line-height: 1.5;">
              A partir de ahora, puede utilizar esta dirección de correo para iniciar sesión o para recibir sus códigos OTP en la opción <em>"¿Olvidé mi contraseña?"</em> de la pantalla de inicio.
            </p>
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
              Si usted no solicitó este cambio, por favor contacte de inmediato con la administración de MG Solutions.
            </div>
          </div>
        `,
      }).catch((mailErr: any) => {
        console.warn('Advertencia al enviar correo de actualización:', mailErr);
      });
    }

    res.json({ success: true, message: 'Usuario actualizado con éxito.' });
  } catch (error: any) {
    console.error('Error en updateUser:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ success: false, message: 'Email duplicado.' });
    } else {
      res.status(500).json({ success: false, message: 'Error actualizando usuario.' });
    }
  }
}

/**
 * PATCH /api/usuarios/:id/estado
 * Activa o desactiva un usuario.
 */
export async function toggleUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);
    const { estado } = req.body;

    if (!estado || !['ACTIVO', 'INACTIVO'].includes(estado)) {
      res.status(400).json({ success: false, message: 'Estado debe ser ACTIVO o INACTIVO.' });
      return;
    }

    // No permitir desactivarse a sí mismo
    if (req.user?.userId === userId && estado === 'INACTIVO') {
      res.status(400).json({ success: false, message: 'No puede desactivar su propia cuenta.' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE usuarios SET estado_id = (SELECT id FROM estados WHERE nombre = ? LIMIT 1) WHERE id = ?',
      [estado, userId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    // Si se desactiva, revocar todas sus sesiones activas
    if (estado === 'INACTIVO') {
      await pool.query(
        'UPDATE sesiones_tokens SET revocado = TRUE, revocado_en = NOW() WHERE usuario_id = ? AND revocado = FALSE',
        [userId]
      );
    }

    res.json({ success: true, message: `Usuario ${estado === 'ACTIVO' ? 'activado' : 'desactivado'} con éxito.` });
  } catch (error) {
    console.error('Error en toggleUserStatus:', error);
    res.status(500).json({ success: false, message: 'Error cambiando estado del usuario.' });
  }
}

/**
 * PATCH /api/usuarios/:id/reset-password
 * Resetea la contraseña de un usuario (Solo ADMIN).
 * Genera una contraseña temporal y fuerza cambio en próximo login.
 */
export async function resetUserPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);
    const { nuevaPassword } = req.body || {};

    let finalPassword = '';
    if (nuevaPassword && typeof nuevaPassword === 'string' && nuevaPassword.trim().length > 0) {
      if (nuevaPassword.trim().length < 6) {
        res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres.',
        });
        return;
      }
      finalPassword = nuevaPassword.trim();
    } else {
      // Autogenerar contraseña temporal segura
      finalPassword = `MG-Temp#${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const passwordHash = await hashPassword(finalPassword);

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE usuarios SET password_hash = ?, requiere_cambio_password = TRUE, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?',
      [passwordHash, userId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    // Revocar sesiones existentes para forzar re-login
    await pool.query(
      'UPDATE sesiones_tokens SET revocado = TRUE, revocado_en = NOW() WHERE usuario_id = ? AND revocado = FALSE',
      [userId]
    );

    // Obtener datos del usuario para notificación por email
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT u.username, u.nombre_completo, u.email, r.nombre AS rol_nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ? LIMIT 1',
      [userId]
    );

    let emailSent = false;
    if (userRows.length > 0 && userRows[0].email) {
      const u = userRows[0];
      sendWelcomeCredentialsEmail({
        toEmail: u.email,
        nombreCompleto: u.nombre_completo,
        username: u.username,
        passwordTemporal: finalPassword,
        rolNombre: u.rol_nombre || 'Colaborador',
        loginUrl: 'https://webmgsolutions.onrender.com',
      }).catch((e: any) => console.warn('Error enviando correo de credenciales temporales:', e));
      emailSent = true;
    }

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente. El usuario deberá cambiarla en su próximo inicio de sesión.',
      passwordTemporal: finalPassword,
      emailEnviado: emailSent,
    });
  } catch (error) {
    console.error('Error en resetUserPassword:', error);
    res.status(500).json({ success: false, message: 'Error reseteando contraseña.' });
  }
}

/**
 * PATCH /api/usuarios/:id/desbloquear
 * Desbloquea un usuario bloqueado por intentos fallidos (Solo ADMIN).
 */
export async function unlockUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    res.json({ success: true, message: 'Usuario desbloqueado con éxito.' });
  } catch (error) {
    console.error('Error en unlockUser:', error);
    res.status(500).json({ success: false, message: 'Error desbloqueando usuario.' });
  }
}

// =====================================================================
// ENDPOINTS DE EMPRESA, SUCURSALES Y ROLES
// =====================================================================

/**
 * GET /api/empresa
 * Retorna la información de la empresa
 */
export async function getCompany(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM empresas LIMIT 1');
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'No hay datos de empresa configurados.' });
      return;
    }
    const emp = rows[0];
    res.json({
      success: true,
      empresa: {
        ruc: emp.ruc,
        razonSocial: emp.razon_social,
        nombreComercial: emp.nombre_comercial,
        direccionFiscal: emp.direccion_fiscal,
        email: emp.email,
        telefono: emp.telefono,
        departamento: emp.departamento,
        provincia: emp.provincia,
        distrito: emp.distrito,
        ubigeo: emp.ubigeo,
        logoUrl: emp.logo_url,
      },
    });
  } catch (error) {
    console.error('Error en getCompany:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo datos de empresa.' });
  }
}

/**
 * GET /api/sucursales
 * Retorna las sedes y almacenes
 */
export async function getBranches(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT s.id, s.codigo, s.nombre, s.direccion, s.telefono, s.es_principal, e.nombre AS estado FROM sucursales s JOIN estados e ON s.estado_id = e.id ORDER BY s.id ASC'
    );
    res.json({
      success: true,
      sucursales: rows.map((r) => ({
        id: r.id,
        codigo: r.codigo,
        nombre: r.nombre,
        direccion: r.direccion,
        telefono: r.telefono,
        esPrincipal: Boolean(r.es_principal),
        estado: r.estado,
      })),
    });
  } catch (error) {
    console.error('Error en getBranches:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo sucursales.' });
  }
}

/**
 * GET /api/roles
 * Retorna todos los roles con sus módulos predeterminados
 */
export async function getRoles(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT r.id, r.codigo, r.nombre, r.descripcion, r.modulos_predeterminados, r.es_sistema, e.nombre AS estado FROM roles r JOIN estados e ON r.estado_id = e.id ORDER BY r.id ASC'
    );
    res.json({
      success: true,
      roles: rows.map((r) => ({
        id: r.id,
        codigo: r.codigo,
        nombre: r.nombre,
        descripcion: r.descripcion,
        modulosPredeterminados: parseModulos(r.modulos_predeterminados),
        esSistema: Boolean(r.es_sistema),
        estado: r.estado,
      })),
    });
  } catch (error) {
    console.error('Error en getRoles:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo roles.' });
  }
}

/**
 * POST /api/roles
 * Crea un nuevo rol dinámico con sus permisos de módulos.
 */
export async function createRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { codigo, nombre, descripcion, modulosPredeterminados = [] } = req.body;

    if (!codigo || !nombre) {
      res.status(400).json({ success: false, message: 'El código y nombre del rol son obligatorios.' });
      return;
    }

    const cleanCodigo = codigo.trim().toUpperCase().replace(/\s+/g, '_');
    const cleanNombre = nombre.trim();
    const cleanDesc = (descripcion || '').trim();

    // Validar duplicado
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM roles WHERE codigo = ? OR nombre = ? LIMIT 1',
      [cleanCodigo, cleanNombre]
    );

    if (existing.length > 0) {
      res.status(409).json({ success: false, message: 'Ya existe un rol con ese código o nombre.' });
      return;
    }

    // Insertar rol
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO roles (codigo, nombre, descripcion, modulos_predeterminados, es_sistema, estado_id)
       VALUES (?, ?, ?, ?, 0, 1)`,
      [cleanCodigo, cleanNombre, cleanDesc, JSON.stringify(modulosPredeterminados)]
    );

    const newRoleId = result.insertId;

    // Asignar permisos en rol_permisos si existen
    if (Array.isArray(modulosPredeterminados) && modulosPredeterminados.length > 0) {
      for (const modCode of modulosPredeterminados) {
        await pool.query(
          `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
           SELECT ?, id FROM permisos WHERE codigo = ?`,
          [newRoleId, modCode]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: `Rol '${cleanNombre}' creado exitosamente.`,
      role: {
        id: newRoleId,
        codigo: cleanCodigo,
        nombre: cleanNombre,
        descripcion: cleanDesc,
        modulosPredeterminados,
        esSistema: false,
        estado: 'ACTIVO',
      },
    });
  } catch (error: any) {
    console.error('Error en createRole:', error);
    res.status(500).json({ success: false, message: error.message || 'Error creando rol.' });
  }
}

/**
 * PUT /api/roles/:id
 * Actualiza un rol existente y sus módulos asignados.
 */
export async function updateRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const roleId = Number(req.params.id);
    const { nombre, descripcion, modulosPredeterminados } = req.body;

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id, codigo, es_sistema FROM roles WHERE id = ? LIMIT 1',
      [roleId]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Rol no encontrado.' });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (nombre !== undefined) {
      updates.push('nombre = ?');
      params.push(nombre.trim());
    }
    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      params.push(descripcion.trim());
    }
    if (modulosPredeterminados !== undefined) {
      updates.push('modulos_predeterminados = ?');
      params.push(JSON.stringify(modulosPredeterminados));
    }

    if (updates.length > 0) {
      params.push(roleId);
      await pool.query(`UPDATE roles SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Actualizar rol_permisos si se proporcionaron módulos
    if (modulosPredeterminados !== undefined && Array.isArray(modulosPredeterminados)) {
      await pool.query('DELETE FROM rol_permisos WHERE rol_id = ?', [roleId]);
      for (const modCode of modulosPredeterminados) {
        await pool.query(
          `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
           SELECT ?, id FROM permisos WHERE codigo = ?`,
          [roleId, modCode]
        );
      }
    }

    // Obtener rol actualizado
    const [updatedRows] = await pool.query<RowDataPacket[]>(
      'SELECT r.id, r.codigo, r.nombre, r.descripcion, r.modulos_predeterminados, r.es_sistema, e.nombre AS estado FROM roles r JOIN estados e ON r.estado_id = e.id WHERE r.id = ?',
      [roleId]
    );

    const r = updatedRows[0];
    res.json({
      success: true,
      message: 'Rol actualizado con éxito.',
      role: {
        id: r.id,
        codigo: r.codigo,
        nombre: r.nombre,
        descripcion: r.descripcion,
        modulosPredeterminados: parseModulos(r.modulos_predeterminados),
        esSistema: Boolean(r.es_sistema),
        estado: r.estado,
      },
    });
  } catch (error: any) {
    console.error('Error en updateRole:', error);
    res.status(500).json({ success: false, message: error.message || 'Error actualizando rol.' });
  }
}

/**
 * DELETE /api/roles/:id
 * Elimina un rol si no es de sistema y no tiene usuarios asignados.
 */
export async function deleteRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const roleId = Number(req.params.id);

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id, codigo, es_sistema FROM roles WHERE id = ? LIMIT 1',
      [roleId]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Rol no encontrado.' });
      return;
    }

    if (existing[0].es_sistema) {
      res.status(403).json({
        success: false,
        message: 'No es posible eliminar un rol base del sistema.',
      });
      return;
    }

    // Validar si tiene usuarios asignados
    const [userCount] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM usuarios WHERE rol_id = ?',
      [roleId]
    );

    if (userCount[0].total > 0) {
      res.status(400).json({
        success: false,
        message: `No se puede eliminar el rol porque tiene ${userCount[0].total} usuario(s) asignado(s). Reasígnelos primero.`,
      });
      return;
    }

    await pool.query('DELETE FROM rol_permisos WHERE rol_id = ?', [roleId]);
    await pool.query('DELETE FROM roles WHERE id = ?', [roleId]);

    res.json({ success: true, message: 'Rol eliminado con éxito.' });
  } catch (error: any) {
    console.error('Error en deleteRole:', error);
    res.status(500).json({ success: false, message: error.message || 'Error eliminando rol.' });
  }
}

/**
 * GET /api/permisos
 * Retorna todos los módulos y permisos del sistema.
 */
export async function getPermisos(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, codigo, nombre, descripcion, categoria, icono FROM permisos WHERE estado_id = 1 ORDER BY categoria, id'
    );
    res.json({
      success: true,
      permisos: rows,
    });
  } catch (error) {
    console.error('Error en getPermisos:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo permisos.' });
  }
}
