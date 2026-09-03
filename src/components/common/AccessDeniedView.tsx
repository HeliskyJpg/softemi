import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, ArrowLeft, LayoutGrid, Key } from 'lucide-react';
import { PermissionCode } from '../../types/permissions';
import { PERMISSION_BY_CODE } from '../../services/permissionsService';

interface AccessDeniedViewProps {
  requiredPermission: PermissionCode;
  moduleName?: string;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  requiredPermission,
  moduleName,
}) => {
  const { currentUser, setActiveView, goBack, canGoBack } = useApp();
  const permDef = PERMISSION_BY_CODE[requiredPermission];

  return (
    <div
      id="access-denied-container"
      className="max-w-2xl mx-auto py-12 px-4 sm:px-6 text-center space-y-6"
    >
      <div className="bg-white rounded-3xl border border-[#F2D6DE] shadow-xs p-8 sm:p-10 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto shadow-2xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <Key className="w-3 h-3" />
            Permiso requerido: {requiredPermission}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C1E23] tracking-tight">
            Acceso no autorizado al módulo
          </h2>
          <p className="text-xs sm:text-sm text-[#7D6871] max-w-lg mx-auto leading-relaxed">
            Tu cuenta de usuario no cuenta con la autorización necesaria para acceder a{' '}
            <strong>{moduleName || permDef?.module || 'esta sección'}</strong>.
          </p>
        </div>

        {permDef && (
          <div className="p-4 bg-[#FAF6F4] rounded-2xl border border-[#F2D6DE]/80 text-left space-y-2 max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#2C1E23]">{permDef.name}</span>
              <span className="text-[10px] font-mono text-[#7D6871] bg-white px-2 py-0.5 rounded border border-[#F2D6DE]">
                {permDef.code}
              </span>
            </div>
            <p className="text-xs text-[#7D6871] leading-relaxed">
              {permDef.description}
            </p>
          </div>
        )}

        {currentUser && (
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-[#5C3B45] inline-flex items-center gap-2">
            <span>Usuario autenticado:</span>
            <strong className="text-[#2C1E23]">{currentUser.name}</strong>
            <span className="text-[11px] font-mono text-[#7D6871]">(@{currentUser.username})</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FBECEF] text-[#681B2B] font-bold border border-[#F2D6DE]">
              Rol: {currentUser.role}
            </span>
          </div>
        )}

        <div className="text-[11px] text-[#7D6871] max-w-md mx-auto">
          💡 El Administrador del sistema puede concederte este permiso específico desde el módulo de{' '}
          <strong>Usuarios y roles</strong> sin necesidad de cambiar tu rol base.
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {canGoBack && (
            <button
              id="btn-access-denied-back"
              type="button"
              onClick={() => goBack()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#F2D6DE] text-xs font-bold text-[#5C3B45] hover:bg-[#FBECEF]/60 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Regresar
            </button>
          )}

          <button
            id="btn-access-denied-dashboard"
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#681B2B] hover:bg-[#531422] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
