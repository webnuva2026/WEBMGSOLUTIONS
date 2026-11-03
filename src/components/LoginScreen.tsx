import React, { useState } from 'react';
import {
  FileText,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Wrench,
  Receipt,
  Boxes,
} from 'lucide-react';

import { Usuario } from '../types';
import { authService } from '../services/auth.service';
import { PasswordRecoveryModal } from './PasswordRecoveryModal';

interface LoginScreenProps {
  usuarios: Usuario[];
  onLoginSuccess: (user: Usuario) => void;
  onBackToClient: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  usuarios,
  onLoginSuccess,
  onBackToClient,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Por favor ingrese un correo electrónico válido (ejemplo: superadmin@mgsolutions.pe).');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.login(cleanEmail, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user as Usuario);
      } else {
        setErrorMsg(res.message || 'Correo o contraseña incorrectos. Verifique sus credenciales.');
      }
    } catch (err: any) {
      setErrorMsg('Error de conexión con el servidor. Verifique que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-between p-4 sm:p-6 lg:p-10">
      {/* Top Bar with Back Button */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <button
          type="button"
          onClick={onBackToClient}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#00346F] shadow-xs border border-slate-200 hover:bg-[#EFF4FF] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a consulta de clientes
        </button>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest hidden sm:inline-block">
          Portal Seguro • MG Solutions
        </span>
      </div>

      {/* Main Split Container */}
      <div className="my-auto max-w-6xl w-full mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid lg:grid-cols-12 min-h-[580px]">
        {/* Left Column: Brand Hero */}
        <div className="lg:col-span-5 bg-[#00346F] p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center mb-6 shadow-inner">
              <FileText className="w-9 h-9 text-blue-200" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              MG SOLUTIONS GROUP
            </h1>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-blue-200 mt-2">
              ERP System & Soporte Técnico
            </p>

            <div className="mt-10 space-y-4 text-sm text-blue-100/90">
              <div className="flex items-center gap-3.5 bg-white/5 p-3.5 rounded-xl border border-white/10">
                <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0" />
                <span>Control de accesos con Roles y Permisos (RBAC)</span>
              </div>
              <div className="flex items-center gap-3.5 bg-white/5 p-3.5 rounded-xl border border-white/10">
                <Wrench className="w-5 h-5 text-cyan-300 shrink-0" />
                <span>Gestión de órdenes de taller y bitácora en vivo</span>
              </div>
              <div className="flex items-center gap-3.5 bg-white/5 p-3.5 rounded-xl border border-white/10">
                <Receipt className="w-5 h-5 text-amber-300 shrink-0" />
                <span>Punto de venta, facturación e inventario multi-sede</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/15 text-xs text-blue-200 relative z-10 flex items-center justify-between">
            <span>Sede Principal Chiclayo</span>
            <span>Versión 2.0 (2026)</span>
          </div>

          {/* Decorative ambient background blur */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Right Column: Form Area */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1C30] tracking-tight">
                Iniciar Sesión
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Ingresa con tu cuenta de trabajador autorizada para acceder al sistema.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-in fade-in">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Control de Seguridad:</span>
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div>
                <label
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
                  htmlFor="email"
                >
                  Correo Electrónico Corporativo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo: superadmin@mgsolutions.pe"
                    required
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00346F] focus:border-[#00346F] transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                    htmlFor="password"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsRecoveryOpen(true)}
                    className="text-xs font-semibold text-[#004A99] hover:underline cursor-pointer"
                  >
                    ¿Olvidé mi contraseña?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00346F] focus:border-[#00346F] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer transition-colors"
                    tabIndex={-1}
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>


              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-xl shadow-lg font-bold text-base text-white bg-[#00346F] hover:bg-[#004A99] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verificando credenciales...</span>
                    </>
                  ) : (
                    <span>Ingresar al Sistema</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-3 text-xs text-slate-500">
        © 2026 MG SOLUTIONS GROUP S.A.C. • Todos los derechos reservados.
      </footer>

      {/* Password Recovery Modal */}
      <PasswordRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        onSuccessReset={(userOrEmail) => {
          setEmail(userOrEmail);
          setPassword('');
          setErrorMsg(null);
        }}
      />
    </div>
  );
};
