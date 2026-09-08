import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ResetPasswordViewProps {
  token: string;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ token }) => {
  const { validateResetToken, completePasswordReset, clearResetToken, logout } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate token validity on mount and token change
  const [tokenStatus, setTokenStatus] = useState<{
    isValid: boolean;
    checked: boolean;
    error?: string;
  }>({
    isValid: false,
    checked: false,
  });

  useEffect(() => {
    const result = validateResetToken(token);
    setTokenStatus({
      isValid: result.valid,
      checked: true,
      error: result.error,
    });
  }, [token, validateResetToken]);

  const handleBackToLogin = () => {
    clearResetToken();
    logout();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPass = newPassword.trim();
    if (cleanPass.length < 4) {
      setErrorMsg('La nueva contraseña debe contener al menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    const res = completePasswordReset(token, newPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'El enlace no es válido o venció. Solicita uno nuevo al administrador.');
      return;
    }

    setIsSuccess(true);
  };

  if (!tokenStatus.checked) {
    return null;
  }

  return (
    <div
      id="reset-password-page-container"
      className="min-h-screen flex items-center justify-center p-4 bg-[#FBECEF]"
    >
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-[#F2D6DE]/60 relative overflow-hidden"
        >
          {/* Case 1: Invalid, expired, or already used token */}
          {!tokenStatus.isValid && !isSuccess && (
            <div id="reset-password-invalid-view" className="text-center py-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#2C1E23] mb-6">
                {tokenStatus.error || 'El enlace no es válido o venció. Solicita uno nuevo al administrador.'}
              </p>
              <button
                type="button"
                id="btn-back-to-login-invalid"
                onClick={handleBackToLogin}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-[#681B2B] hover:bg-[#531422] transition-colors cursor-pointer"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}

          {/* Case 2: Successfully saved new password */}
          {isSuccess && (
            <div id="reset-password-success-view" className="text-center py-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#2C1E23] mb-6">
                Contraseña actualizada correctamente
              </p>
              <button
                type="button"
                id="btn-back-to-login-success"
                onClick={handleBackToLogin}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-[#681B2B] hover:bg-[#531422] transition-colors cursor-pointer"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}

          {/* Case 3: Active form to create new password */}
          {tokenStatus.isValid && !isSuccess && (
            <div id="reset-password-form-view">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#681B2B] tracking-tight">
                  Crear nueva contraseña
                </h1>
              </div>

              {errorMsg && (
                <div
                  id="reset-password-error-alert"
                  className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="input-reset-new-password"
                    className="block text-xs font-bold text-[#2C1E23] uppercase tracking-wider mb-1.5"
                  >
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="input-reset-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-[#F2D6DE]/60 bg-[#FBECEF]/10 focus:bg-white text-sm text-[#2C1E23] placeholder-[#7D6871]/50 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 focus:border-[#681B2B] transition-all"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      id="btn-toggle-show-new-password"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D6871] hover:text-[#2C1E23] cursor-pointer"
                      tabIndex={-1}
                      aria-label={showNewPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="input-reset-confirm-password"
                    className="block text-xs font-bold text-[#2C1E23] uppercase tracking-wider mb-1.5"
                  >
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="input-reset-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-[#F2D6DE]/60 bg-[#FBECEF]/10 focus:bg-white text-sm text-[#2C1E23] placeholder-[#7D6871]/50 focus:outline-none focus:ring-2 focus:ring-[#681B2B]/20 focus:border-[#681B2B] transition-all"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      id="btn-toggle-show-confirm-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D6871] hover:text-[#2C1E23] cursor-pointer"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-save-new-password"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-[#681B2B] hover:bg-[#531422] disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  Guardar contraseña
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
