import React, { useState } from 'react';
import { FileText, User, Lock, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Usuario } from '../types';

interface LoginScreenProps {
  usuarios: Usuario[];
  onLoginSuccess: (user: Usuario) => void;
  onBackToClient: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ usuarios, onLoginSuccess, onBackToClient }) => {
  const [username, setUsername] = useState('tmilagros');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const cleanUser = username.trim().toLowerCase();
      const foundUser = usuarios.find(
        (u) => u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser
      );

      if (!foundUser) {
        setErrorMsg('Usuario o contraseña incorrectos. Verifique sus credenciales.');
        return;
      }

      if (foundUser.password && password !== foundUser.password) {
        setErrorMsg('Usuario o contraseña incorrectos. Verifique sus credenciales.');
        return;
      }

      // Validar Estado ACTIVO / INACTIVO
      if (foundUser.estado !== 'ACTIVO') {
        setErrorMsg(
          `Acceso denegado: El usuario '${foundUser.nombreCompleto}' tiene estado INACTIVO. Para evitar errores operativos, el acceso está bloqueado.`
        );
        return;
      }

      onLoginSuccess(foundUser);
    }, 400);
  };

  const handleQuickFill = (user: Usuario) => {
    setUsername(user.username);
    setPassword(user.password || 'password123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center p-4">
      <button
        type="button"
        onClick={onBackToClient}
        className="mb-4 text-xs font-semibold text-[#004A99] hover:underline"
      >
        ← Volver a consulta de clientes
      </button>
      {/* Login Card */}
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-[440px] overflow-hidden flex flex-col relative z-10">
        {/* Header / Logo Area matching Screenshot */}
        <div className="pt-9 pb-6 px-8 flex flex-col items-center border-b border-slate-100 bg-[#F8F9FF]">
          <div className="w-14 h-14 bg-[#00346F] rounded-xl flex items-center justify-center mb-3 shadow-md">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#0B1C30] text-center tracking-tight">
            MG SOLUTIONS GROUP
          </h1>
          <p className="text-xs font-semibold text-slate-500 text-center uppercase tracking-widest mt-1">
            Portal de trabajadores
          </p>
        </div>

        {/* Form Area */}
        <div className="p-8">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Control de Seguridad de Estados:</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="username">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingrese su usuario"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00346F] focus:border-[#00346F] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00346F] focus:border-[#00346F] transition-all"
                />
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => alert('Para restablecer su contraseña, comuníquese con el Administrador del Sistema MG SOLUTIONS GROUP.')}
                className="text-xs font-medium text-[#004A99] hover:underline"
              >
                ¿Olvidé mi contraseña?
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg shadow font-semibold text-sm text-white bg-[#004A99] hover:bg-[#00346F] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <span>Ingresar</span>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Acceso Rápido / Probar Validación de Estados
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill(usuarios[0])}
                className="p-2 text-left bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs text-emerald-900 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-bold block truncate">tmilagros</span>
                  <span className="text-[10px] text-emerald-700">Admin (ACTIVO)</span>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill(usuarios[3])}
                className="p-2 text-left bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs text-red-900 transition-colors flex items-center justify-between"
                title="Probar usuario inactivo"
              >
                <div>
                  <span className="font-bold block truncate">ex_cajero_luis</span>
                  <span className="text-[10px] text-red-700">Cajero (INACTIVO)</span>
                </div>
                <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note matching Screenshot */}
        <div className="bg-[#EFF4FF] px-8 py-3.5 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600 font-medium">
            © 2024 MG SOLUTIONS GROUP S.A.C.
          </p>
        </div>
      </div>
    </div>
  );
};
