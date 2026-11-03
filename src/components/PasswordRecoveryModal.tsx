import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  KeyRound,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
} from 'lucide-react';
import { authService } from '../services/auth.service';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessReset?: (usernameOrEmail: string) => void;
}

export const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
  isOpen,
  onClose,
  onSuccessReset,
}) => {
  // Pasos: 1 = Identificación, 2 = Código OTP, 3 = Nueva Contraseña, 4 = Éxito
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [identificador, setIdentificador] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  // UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [emailEnmascarado, setEmailEnmascarado] = useState('');
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  // Timer para expiración de código (15 min = 900 s)
  const [timeLeft, setTimeLeft] = useState(900);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Reset all states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIdentificador('');
      setCodigoOtp('');
      setNuevaPassword('');
      setConfirmarPassword('');
      setErrorMsg(null);
      setInfoMsg(null);
      setEmailEnmascarado('');
      setTimerActive(false);
      setTimeLeft(900);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Validaciones de Contraseña Segura
  const hasMinLength = nuevaPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(nuevaPassword);
  const hasLowercase = /[a-z]/.test(nuevaPassword);
  const hasNumber = /[0-9]/.test(nuevaPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(nuevaPassword);
  const notDefault = nuevaPassword.toLowerCase() !== 'admin2026!';
  const passwordsMatch = nuevaPassword.length > 0 && nuevaPassword === confirmarPassword;

  const isPasswordValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    notDefault &&
    passwordsMatch;

  // Paso 1: Enviar código
  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim()) {
      setErrorMsg('Ingrese su nombre de usuario o correo electrónico.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const res = await authService.solicitarRecuperacion(identificador.trim());
      if (res.success) {
        setEmailEnmascarado(res.emailEnmascarado || identificador);
        setStep(2);
        setTimeLeft(900);
        setTimerActive(true);
        setInfoMsg(`Hemos enviado un código de 6 dígitos a ${res.emailEnmascarado || identificador}.`);
      } else {
        setErrorMsg(res.message || 'No se pudo enviar el código de recuperación.');
      }
    } catch (err: any) {
      setErrorMsg('Error de conexión con el servidor. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleReenviarCodigo = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authService.solicitarRecuperacion(identificador.trim());
      if (res.success) {
        setTimeLeft(900);
        setInfoMsg('Se ha reenviado un nuevo código a su correo.');
      } else {
        setErrorMsg(res.message || 'Error al reenviar el código.');
      }
    } catch {
      setErrorMsg('Error de conexión al reenviar el código.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Verificar código
  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = codigoOtp.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setErrorMsg('El código de verificación debe tener 6 dígitos numéricos.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const res = await authService.verificarCodigo(identificador.trim(), cleanCode);
      if (res.success) {
        setStep(3);
      } else {
        setErrorMsg(res.message || 'El código ingresado es incorrecto o ha vencido.');
      }
    } catch (err: any) {
      setErrorMsg('Error de conexión al verificar el código.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 3: Restablecer contraseña
  const handleRestablecerPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasMinLength) {
      setErrorMsg('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!hasUppercase) {
      setErrorMsg('La contraseña debe incluir al menos una letra mayúscula (A-Z).');
      return;
    }

    if (!hasLowercase) {
      setErrorMsg('La contraseña debe incluir al menos una letra minúscula (a-z).');
      return;
    }

    if (!hasNumber) {
      setErrorMsg('La contraseña debe incluir al menos un número (0-9).');
      return;
    }

    if (!hasSpecial) {
      setErrorMsg('La contraseña debe incluir al menos un carácter especial (@, $, !, %, *, ?, &, #, etc.).');
      return;
    }

    if (!notDefault) {
      setErrorMsg('Por seguridad, no puede utilizar la contraseña predeterminada (Admin2026!).');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('Las contraseñas no coinciden. Verifique ambas casillas.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await authService.restablecerPassword(
        identificador.trim(),
        codigoOtp.trim(),
        nuevaPassword
      );

      if (res.success) {
        setTimerActive(false);
        setStep(4);
      } else {
        setErrorMsg(res.message || 'Error al actualizar la contraseña.');
      }
    } catch {
      setErrorMsg('Error de conexión al restablecer contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSuccess = () => {
    if (onSuccessReset) {
      onSuccessReset(identificador.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002654] to-[#004A99] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Recuperar Contraseña</h3>
              <p className="text-xs text-blue-200">MG Solutions ERP Security</p>
            </div>
          </div>

          {/* Stepper visual */}
          {step !== 4 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/15 text-xs">
              <div className={`flex items-center gap-1.5 font-bold ${step === 1 ? 'text-white' : 'text-blue-300/70'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-white text-[#002654]' : 'bg-white/20'}`}>1</span>
                <span>Usuario</span>
              </div>
              <div className="h-0.5 w-6 bg-white/20" />
              <div className={`flex items-center gap-1.5 font-bold ${step === 2 ? 'text-white' : 'text-blue-300/70'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-white text-[#002654]' : 'bg-white/20'}`}>2</span>
                <span>Código OTP</span>
              </div>
              <div className="h-0.5 w-6 bg-white/20" />
              <div className={`flex items-center gap-1.5 font-bold ${step === 3 ? 'text-white' : 'text-blue-300/70'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-white text-[#002654]' : 'bg-white/20'}`}>3</span>
                <span>Contraseña</span>
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Info Message */}
          {infoMsg && !errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs flex items-start gap-2">
              <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* ===================== PASO 1: IDENTIFICADOR ===================== */}
          {step === 1 && (
            <form onSubmit={handleSolicitarCodigo} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingresa tu nombre de usuario o correo corporativo registrado. Te enviaremos un código de seguridad para verificar tu identidad.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Usuario o Correo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    placeholder="Ej. tmilagros o usuario@mgsolutions.pe"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00346F] focus:border-[#00346F]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-[#00346F] hover:bg-[#004A99] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Buscando usuario y enviando correo...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Código por Correo</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ===================== PASO 2: CÓDIGO OTP ===================== */}
          {step === 2 && (
            <form onSubmit={handleVerificarCodigo} className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-xs font-semibold mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Código expira en: {formatTimer(timeLeft)}</span>
                </div>
                <p className="text-xs text-slate-600">
                  Ingresa el código numérico de <strong>6 dígitos</strong> enviado a:
                </p>
                <p className="text-xs font-bold text-[#00346F] mt-0.5">{emailEnmascarado}</p>
              </div>

              <div>
                <label className="block text-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Código de Verificación (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={codigoOtp}
                  onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  autoFocus
                  className="w-full py-3.5 text-center text-2xl font-black tracking-[10px] bg-slate-50 border border-slate-300 rounded-xl font-mono text-[#00346F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00346F] focus:border-[#00346F]"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Cambiar usuario
                </button>

                <button
                  type="button"
                  onClick={handleReenviarCodigo}
                  disabled={loading || timeLeft > 840}
                  className="text-[#004A99] hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:text-slate-400 disabled:no-underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reenviar código
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || codigoOtp.length !== 6 || timeLeft === 0}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-[#00346F] hover:bg-[#004A99] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando código...</span>
                    </>
                  ) : (
                    <>
                      <span>Verificar Código</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ===================== PASO 3: NUEVA CONTRASEÑA ===================== */}
          {step === 3 && (
            <form onSubmit={handleRestablecerPassword} className="space-y-4 text-xs">
              <p className="text-xs text-slate-600">
                Código verificado con éxito. Define tu nueva contraseña de acceso:
              </p>

              {/* Nueva Contraseña */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNueva ? 'text' : 'password'}
                    required
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres..."
                    className="w-full py-2.5 pl-3 pr-10 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00346F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNueva(!showNueva)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmar ? 'text' : 'password'}
                    required
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Repita la nueva contraseña..."
                    className={`w-full py-2.5 pl-3 pr-10 bg-slate-50 border rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00346F] ${
                      confirmarPassword && !passwordsMatch ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmar(!showConfirmar)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checklist de Seguridad Obligatoria */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
                <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1">
                  Requisitos de Seguridad Obligatorios:
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    {hasMinLength ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className={hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                      Mínimo 8 caracteres
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasUppercase ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className={hasUppercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                      1 mayúscula (A-Z)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasLowercase ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className={hasLowercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                      1 minúscula (a-z)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasNumber ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className={hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                      1 número (0-9)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasSpecial ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className={hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                      1 símbolo (!@#$%^&*)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {passwordsMatch ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className={passwordsMatch ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                      Coinciden exactamente
                    </span>
                  </div>
                </div>

                {nuevaPassword.length > 0 && !notDefault && (
                  <div className="text-[10px] text-red-600 font-semibold pt-1">
                    ⚠️ No puede usar la contraseña inicial por defecto.
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !isPasswordValid}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-[#00346F] hover:bg-[#004A99] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Actualizando contraseña...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Guardar Nueva Contraseña</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ===================== PASO 4: ÉXITO ===================== */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">¡Contraseña Restablecida!</h4>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                  Tu contraseña ha sido actualizada con éxito en la base de datos de <strong>MG Solutions</strong>.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinishSuccess}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-[#00346F] hover:bg-[#004A99] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <span>Iniciar Sesión Ahora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
