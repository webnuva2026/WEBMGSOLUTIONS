import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert, LogOut, Clock } from 'lucide-react';

interface SessionTimeoutGuardProps {
  /** Milisegundos de inactividad antes de mostrar el aviso (por defecto 5 minutos). */
  idleMs?: number;
  /** Segundos de cuenta regresiva antes de cerrar la sesión (por defecto 60). */
  warningSeconds?: number;
  onTimeout: () => void;
}

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'wheel',
];

/**
 * Cierra la sesión por seguridad tras un periodo de inactividad.
 * Muestra un aviso con cuenta regresiva y exige confirmar para continuar.
 */
export const SessionTimeoutGuard: React.FC<SessionTimeoutGuardProps> = ({
  idleMs = 5 * 60 * 1000,
  warningSeconds = 60,
  onTimeout,
}) => {
  const lastActivityRef = useRef<number>(Date.now());
  const warningStartRef = useRef<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    const markActivity = () => {
      // Una vez mostrado el aviso, solo el botón "Continuar" lo cancela
      if (warningStartRef.current === null) {
        lastActivityRef.current = Date.now();
      }
    };
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, markActivity, { passive: true }));

    const timer = setInterval(() => {
      const now = Date.now();
      if (warningStartRef.current === null) {
        if (now - lastActivityRef.current >= idleMs) {
          warningStartRef.current = now;
          setSecondsLeft(warningSeconds);
        }
      } else {
        const elapsed = Math.floor((now - warningStartRef.current) / 1000);
        const left = warningSeconds - elapsed;
        if (left <= 0) {
          clearInterval(timer);
          warningStartRef.current = null;
          setSecondsLeft(null);
          onTimeoutRef.current();
        } else {
          setSecondsLeft(left);
        }
      }
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, markActivity));
      clearInterval(timer);
    };
  }, [idleMs, warningSeconds]);

  const handleContinue = () => {
    lastActivityRef.current = Date.now();
    warningStartRef.current = null;
    setSecondsLeft(null);
  };

  if (secondsLeft === null) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-md overflow-hidden">
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-white">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-amber-950">Sesión inactiva por seguridad</h3>
            <p className="text-[11px] text-amber-800">No se detectó actividad en los últimos 5 minutos.</p>
          </div>
        </div>
        <div className="p-5 text-center space-y-3">
          <p className="text-xs text-slate-600">
            Por seguridad, la sesión se cerrará automáticamente en
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-50 border border-red-200 text-red-700">
            <Clock className="w-5 h-5" />
            <span className="text-3xl font-black font-mono tabular-nums">{secondsLeft}</span>
            <span className="text-xs font-bold">segundos</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Si desea continuar trabajando, presione el botón. De lo contrario deberá volver a ingresar su contraseña.
          </p>
        </div>
        <div className="p-4 border-t border-slate-100 flex gap-2 justify-end bg-slate-50">
          <button
            type="button"
            onClick={() => onTimeoutRef.current()}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión ahora
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-[#00346F] hover:bg-[#004A99] text-white cursor-pointer"
          >
            Continuar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

