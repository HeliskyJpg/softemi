import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export const MandatoryPasswordChangeModal: React.FC = () => {
  const { currentUser, changePassword, logout } = useApp();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser || !currentUser.mustChangePassword) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.trim().length < 6) {
      setErrorMsg('La nueva contraseña debe contener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = changePassword(newPassword.trim(), currentUser.id);
      if (!res.success) {
        setErrorMsg(res.error || 'Ocurrió un error al actualizar la contraseña.');
        setIsSubmitting(false);
      }
    }, 300);
  };

  return (
    <div
      id="mandatory-password-change-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#F2D6DE] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#681B2B] text-white p-6 text-center relative">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-[#FBECEF]" />
          </div>
          <h2 className="text-xl font-serif font-bold tracking-tight text-white">
            Primer Inicio de Sesión
          </h2>
          <p className="text-xs text-[#FBECEF]/80 mt-1">
            Cambio obligatorio de contraseña requerido
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-5 bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold mb-1">
                Hola, {currentUser.name} (@{currentUser.username})
              </p>
              <p>
                Ha ingresado con una contraseña temporal. Por normativas de seguridad de EMILA,
                debe definir su propia contraseña personal antes de continuar en el sistema.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2C1E23] mb-1.5">
                Nueva Contraseña Personal <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#F2D6DE] text-sm text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 focus:border-[#681B2B]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D6871] hover:text-[#2C1E23]"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[#7D6871] mt-1">
                Debe tener al menos 6 caracteres y ser fácil de recordar para usted.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2C1E23] mb-1.5">
                Confirmar Nueva Contraseña <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita la nueva contraseña"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#F2D6DE] text-sm text-[#2C1E23] focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 focus:border-[#681B2B]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D6871] hover:text-[#2C1E23]"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row gap-2.5">
              <button
                id="btn-submit-password-change"
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#681B2B] hover:bg-[#531422] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Establecer Contraseña y Continuar
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={logout}
                className="py-2.5 px-4 rounded-xl border border-[#F2D6DE] hover:bg-stone-50 text-xs font-semibold text-[#7D6871] hover:text-[#2C1E23] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
