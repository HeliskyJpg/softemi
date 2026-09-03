import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, User, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { EmilaLogo } from '../common/EmilaLogo';
import { SystemAlert } from '../common/SystemAlert';

export const LoginView: React.FC = () => {
  const { login, users } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const empleadoUser = users.find((u) => u.username === 'empleado');
  const adminUser = users.find((u) => u.username === 'admin');

  const empleadoPass = empleadoUser?.password || 'demo123';
  const adminPass = adminUser?.password || 'admin123';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Por favor ingrese su nombre de usuario.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Por favor ingrese su contraseña.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const ok = login(username, password);
      if (!ok) {
        const target = users.find((x) => x.username.toLowerCase() === username.trim().toLowerCase());
        if (target && !target.active) {
          setErrorMsg(`La cuenta de "${target.name}" está desactivada. Ya no puede iniciar sesión hasta que un administrador la vuelva a activar.`);
        } else {
          setErrorMsg('Credenciales inválidas. Revise su usuario o contraseña.');
        }
      }
      setIsSubmitting(false);
    }, 350);
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg('');
    setIsSubmitting(true);
    setTimeout(() => {
      const ok = login(user, pass);
      if (!ok) {
        const target = users.find((x) => x.username.toLowerCase() === user.toLowerCase());
        if (target && !target.active) {
          setErrorMsg(`La cuenta de "${target.name}" está desactivada. Ya no puede iniciar sesión hasta que un administrador la vuelva a activar.`);
        } else {
          setErrorMsg('Credenciales inválidas. Revise su usuario o contraseña.');
        }
      }
      setIsSubmitting(false);
    }, 250);
  };

  return (
    <div
      id="login-page-container"
      className="min-h-screen flex items-center justify-center p-4 bg-[#FBECEF]"
    >
      <div className="max-w-md w-full">
        {/* Brand Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-[#F2D6DE]/60 relative overflow-hidden"
        >
          {/* Logo & Header */}
          <div className="text-center mb-8 relative">
            <div className="flex justify-center mb-3">
              <EmilaLogo size={88} variant="circle" className="shadow-md hover:scale-105 transition-transform" />
            </div>
            <h1 className="text-2xl font-bold text-[#681B2B] tracking-tight">EMILA FLORISTERÍA</h1>
            <p className="text-xs text-[#7D6871] font-medium mt-1">
              Sistema de Gestión de Pedidos Personalizados
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-0.5 rounded-full bg-[#FBECEF] text-[#681B2B] text-[11px] font-medium border border-[#F2D6DE]/60">
              <Sparkles className="w-3 h-3" />
              Prototipo de Validación
            </div>
          </div>

          {/* Error feedback banner */}
          {errorMsg && (
            <div className="mb-5 animate-in fade-in">
              <SystemAlert
                id="login-error-alert"
                type="error"
                title="No se pudo iniciar sesión"
                message={errorMsg}
                onClose={() => setErrorMsg('')}
              />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative">
            <div>
              <label
                htmlFor="input-login-username"
                className="block text-xs font-bold text-[#2C1E23] uppercase tracking-wider mb-1.5"
              >
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7D6871]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="input-login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej. empleado o admin"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#F2D6DE]/60 bg-[#FBECEF]/10 focus:bg-white text-sm text-[#2C1E23] placeholder-[#7D6871]/50 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 focus:border-[#681B2B] transition-all"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-login-password"
                className="block text-xs font-bold text-[#2C1E23] uppercase tracking-wider mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7D6871]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#F2D6DE]/60 bg-[#FBECEF]/10 focus:bg-white text-sm text-[#2C1E23] placeholder-[#7D6871]/50 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 focus:border-[#681B2B] transition-all"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#681B2B] hover:bg-[#531422] text-white font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Ingresar al Sistema
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-8 pt-6 border-t border-[#F2D6DE]/40">
            <p className="text-center text-[11px] font-semibold text-[#7D6871] uppercase tracking-wider mb-3">
              Acceso Rápido para Demostración:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                id="btn-quick-login-colaborador"
                type="button"
                onClick={() => handleQuickLogin('empleado', empleadoPass)}
                className={`p-3 rounded-xl border transition-colors cursor-pointer text-left ${
                  empleadoUser?.active === false
                    ? 'border-rose-200 bg-rose-50/50 hover:bg-rose-50 opacity-85'
                    : 'border-[#F2D6DE]/60 bg-[#FBECEF]/20 hover:bg-[#FBECEF]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#681B2B]">Colaborador</span>
                  {empleadoUser?.active === false ? (
                    <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-bold">
                      Inactivo
                    </span>
                  ) : empleadoUser?.mustChangePassword ? (
                    <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.2 rounded font-medium">
                      Clave Temporal
                    </span>
                  ) : (
                    <span className="text-[10px] bg-[#681B2B] text-white px-1.5 py-0.2 rounded font-medium">
                      Demo Principal
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#7D6871]">
                  user: <strong className="text-[#2C1E23]">empleado</strong>
                </p>
                <p className="text-[11px] text-[#7D6871]">
                  pass: <strong className="text-[#2C1E23]">{empleadoUser?.mustChangePassword ? '(temporal asignada)' : empleadoPass}</strong>
                </p>
              </button>

              <button
                id="btn-quick-login-admin"
                type="button"
                onClick={() => handleQuickLogin('admin', adminPass)}
                className={`p-3 rounded-xl border transition-colors cursor-pointer text-left ${
                  adminUser?.active === false
                    ? 'border-rose-200 bg-rose-50/50 hover:bg-rose-50 opacity-85'
                    : 'border-[#F2D6DE]/60 bg-[#FBECEF]/20 hover:bg-[#FBECEF]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#681B2B]">Administrador</span>
                  {adminUser?.active === false ? (
                    <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-bold">
                      Inactivo
                    </span>
                  ) : adminUser?.mustChangePassword ? (
                    <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.2 rounded font-medium">
                      Clave Temporal
                    </span>
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-[#681B2B]" />
                  )}
                </div>
                <p className="text-[11px] text-[#7D6871]">
                  user: <strong className="text-[#2C1E23]">admin</strong>
                </p>
                <p className="text-[11px] text-[#7D6871]">
                  pass: <strong className="text-[#2C1E23]">{adminUser?.mustChangePassword ? '(temporal asignada)' : adminPass}</strong>
                </p>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Footer info */}
        <p className="text-center text-xs text-[#7D6871] mt-6">
          EMILA &bull; Prototipo funcional navegable para validación académica
        </p>
      </div>
    </div>
  );
};

