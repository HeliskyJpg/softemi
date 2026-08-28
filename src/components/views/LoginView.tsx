import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, User, Lock, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginView: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setErrorMsg('Credenciales inválidas. Revise su usuario o contraseña.');
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
      login(user, pass);
      setIsSubmitting(false);
    }, 250);
  };

  return (
    <div
      id="login-page-container"
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FFF7FA] via-[#FBDAE3]/30 to-[#FFF7FA]"
    >
      <div className="max-w-md w-full">
        {/* Brand Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#FBDAE3] relative overflow-hidden"
        >
          {/* Logo & Header */}
          <div className="text-center mb-8 relative flex flex-col items-center">
            <div className="relative mb-2">
              <img
                src="/emila-logo.png"
                alt="EMILA Floristería - Logo Oficial"
                className="w-28 h-28 sm:w-32 sm:h-32 object-contain mx-auto rounded-full shadow-md transition-transform hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-xs text-[#6D5C64] font-medium mt-2">
              Sistema de Gestión de Pedidos Personalizados
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-[#FBDAE3]/60 text-[#8E315E] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Prototipo de Validación
            </div>
          </div>

          {/* Error feedback banner */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              id="login-error-alert"
              className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#9B2C2C] text-xs font-medium flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-[#9B2C2C] shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative">
            <div>
              <label
                htmlFor="input-login-username"
                className="block text-xs font-bold text-[#3A2D33] uppercase tracking-wider mb-1.5"
              >
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6D5C64]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="input-login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej. empleado o admin"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#FBDAE3] bg-[#FFF7FA]/50 focus:bg-white text-sm text-[#3A2D33] placeholder-[#6D5C64]/60 focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30 focus:border-[#8E315E] transition-all"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-login-password"
                className="block text-xs font-bold text-[#3A2D33] uppercase tracking-wider mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6D5C64]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#FBDAE3] bg-[#FFF7FA]/50 focus:bg-white text-sm text-[#3A2D33] placeholder-[#6D5C64]/60 focus:outline-none focus:ring-2 focus:ring-[#8E315E]/30 focus:border-[#8E315E] transition-all"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#8E315E] hover:bg-[#7A294F] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
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
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-[11px] font-semibold text-[#6D5C64] uppercase tracking-wider mb-3">
              Acceso Rápido para Demostración:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                id="btn-quick-login-colaborador"
                type="button"
                onClick={() => handleQuickLogin('empleado', 'demo123')}
                className="p-3 rounded-xl border border-[#65733D]/30 bg-[#EBF1DE]/40 hover:bg-[#EBF1DE] text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#4F5B2F]">Colaborador</span>
                  <span className="text-[10px] bg-[#65733D] text-white px-1.5 py-0.2 rounded font-bold">
                    Demo Principal
                  </span>
                </div>
                <p className="text-[11px] text-[#6D5C64]">
                  user: <strong className="text-[#3A2D33]">empleado</strong>
                </p>
                <p className="text-[11px] text-[#6D5C64]">
                  pass: <strong className="text-[#3A2D33]">demo123</strong>
                </p>
              </button>

              <button
                id="btn-quick-login-admin"
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-3 rounded-xl border border-[#8E315E]/30 bg-[#FBDAE3]/30 hover:bg-[#FBDAE3]/60 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#8E315E]">Administrador</span>
                  <Shield className="w-3.5 h-3.5 text-[#8E315E]" />
                </div>
                <p className="text-[11px] text-[#6D5C64]">
                  user: <strong className="text-[#3A2D33]">admin</strong>
                </p>
                <p className="text-[11px] text-[#6D5C64]">
                  pass: <strong className="text-[#3A2D33]">admin123</strong>
                </p>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Footer info */}
        <p className="text-center text-xs text-[#6D5C64] mt-6">
          EMILA &bull; Prototipo funcional navegable para validación académica
        </p>
      </div>
    </div>
  );
};
