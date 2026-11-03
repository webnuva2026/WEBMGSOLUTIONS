import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, Eye, EyeOff, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/auth.service';

interface ForceChangePasswordModalProps {
  username: string;
  onSuccess: () => void;
  onLogout?: () => void;
}

export const ForceChangePasswordModal: React.FC<ForceChangePasswordModalProps> = ({
  username,
  onSuccess,
  onLogout,
}) => {
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!passwordActual) {
      setErrorMsg('Debe ingresar su contraseña actual o temporal.');
      return;
    }

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

    if (passwordActual === nuevaPassword) {
      setErrorMsg('La nueva contraseña no puede ser igual a su contraseña actual.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('Las contraseñas no coinciden. Verifique ambas casillas.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.changePassword(passwordActual, nuevaPassword);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.message || 'Error al cambiar la contraseña.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-[#00346F] to-[#001f42] text-white text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-xs shadow-inner">
            <KeyRound className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold">Cambio Obligatorio de Contraseña</h2>
          <p className="text-xs text-blue-200 mt-1">
            Hola <span className="font-semibold text-white">@{username}</span>, por motivos de seguridad debe establecer una nueva contraseña privada.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Security Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Esta es una medida de seguridad obligatoria antes de ingresar al sistema. Una vez cambiada, podrá acceder normalmente a todas sus funciones.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px]">{errorMsg}</p>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
              Contraseña Actual / Temporal *
            </label>
            <div className="relative">
              <input
                type={showActual ? 'text' : 'password'}
                required
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Ingrese su contraseña actual..."
                className="w-full py-2.5 pl-3 pr-10 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:border-[#00346F]"
              />
              <button
                type="button"
                onClick={() => setShowActual(!showActual)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
              Nueva Contraseña *
            </label>
            <div className="relative">
              <input
                type={showNueva ? 'text' : 'password'}
                required
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres..."
                className="w-full py-2.5 pl-3 pr-10 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:border-[#00346F]"
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

          {/* Confirm Password */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[10px]">
              Confirmar Nueva Contraseña *
            </label>
            <div className="relative">
              <input
                type={showConfirmar ? 'text' : 'password'}
                required
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repita la nueva contraseña..."
                className={`w-full py-2.5 pl-3 pr-10 bg-slate-50 border rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:border-[#00346F] ${
                  confirmarPassword && !passwordsMatch ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
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

          {/* Validation Checklist */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
            <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1">
              Requisitos de Seguridad Obligatorios:
            </p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <div className="flex items-center gap-1.5">
                {hasMinLength ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )}
                <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  Mínimo 8 caracteres
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasUppercase ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )}
                <span className={hasUppercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  1 mayúscula (A-Z)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasLowercase ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )}
                <span className={hasLowercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  1 minúscula (a-z)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasNumber ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )}
                <span className={hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  1 número (0-9)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasSpecial ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )}
                <span className={hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  1 símbolo (!@#$%^&*)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {passwordsMatch ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )}
                <span className={passwordsMatch ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
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

          {/* Actions */}
          <div className="pt-3 flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full py-3 bg-[#00346F] hover:bg-[#004A99] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loading ? 'Actualizando contraseña...' : 'Guardar y Continuar'}
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2 text-slate-400 hover:text-slate-600 text-center text-[11px] font-semibold"
              >
                Cerrar sesión y salir
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
