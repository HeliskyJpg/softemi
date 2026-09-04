import { User, UserRole } from '../types';
import {
  PermissionCode,
  PermissionDefinition,
  PermissionModule,
  EffectivePermissionInfo,
  PermissionOverrideState,
} from '../types/permissions';

/**
 * Catálogo maestro de permisos del sistema EMILA.
 * Cada permiso cuenta con un código estable e inmutable para autorización.
 */
export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Pedidos
  {
    code: 'orders.view',
    name: 'Ver pedidos',
    module: 'Pedidos',
    description: 'Permite consultar el listado general de pedidos, fichas de detalle y notas históricas.',
    riskLevel: 'básico',
  },
  {
    code: 'orders.create',
    name: 'Crear pedidos',
    module: 'Pedidos',
    description: 'Permite registrar nuevos pedidos de arreglos florales y reservar insumos en taller.',
    riskLevel: 'operativo',
  },
  {
    code: 'orders.edit',
    name: 'Editar pedidos',
    module: 'Pedidos',
    description: 'Permite modificar insumos, fecha y hora de entrega, cliente y observaciones de pedidos activos.',
    riskLevel: 'operativo',
  },
  {
    code: 'orders.change_status',
    name: 'Cambiar estado de pedidos',
    module: 'Pedidos',
    description: 'Permite avanzar pedidos entre En preparación, Listo, Entregado y registrar cancelaciones.',
    riskLevel: 'operativo',
  },
  {
    code: 'payments.register',
    name: 'Registrar cobros y pagos',
    module: 'Pedidos',
    description: 'Permite registrar anticipos, abonos parciales y liquidaciones de saldo en pedidos.',
    riskLevel: 'sensible',
  },

  // Clientes
  {
    code: 'clients.view',
    name: 'Ver clientes',
    module: 'Clientes',
    description: 'Permite buscar y consultar la información de contacto y preferencias de clientes.',
    riskLevel: 'básico',
  },
  {
    code: 'clients.edit',
    name: 'Crear y editar clientes',
    module: 'Clientes',
    description: 'Permite agregar nuevos clientes o actualizar teléfonos y notas especiales de clientes.',
    riskLevel: 'operativo',
  },

  // Inventario / Stock
  {
    code: 'stock.view',
    name: 'Ver catálogo y stock',
    module: 'Inventario',
    description: 'Permite consultar el catálogo de componentes florales, stock físico, reservado y disponible.',
    riskLevel: 'básico',
  },
  {
    code: 'stock.adjust',
    name: 'Ajustar existencias e inventario',
    module: 'Inventario',
    description: 'Permite registrar entradas directas de stock físico y salidas por merma, marchitez o daño.',
    riskLevel: 'sensible',
  },

  // Agenda
  {
    code: 'calendar.view',
    name: 'Ver agenda de entregas',
    module: 'Agenda',
    description: 'Permite visualizar el calendario mensual/semanal de compromisos y entregas de pedidos.',
    riskLevel: 'básico',
  },

  // Reportes
  {
    code: 'reports.view',
    name: 'Ver reportes y métricas',
    module: 'Reportes',
    description: 'Permite consultar indicadores de ventas, ingresos, balance pendiente y productos más demandados.',
    riskLevel: 'sensible',
  },
  {
    code: 'reports.export',
    name: 'Exportar reportes',
    module: 'Reportes',
    description: 'Permite descargar hojas de cálculo (CSV/Excel) y resúmenes ejecutivos de desempeño.',
    riskLevel: 'sensible',
  },

  // Usuarios y Accesos
  {
    code: 'users.view',
    name: 'Ver usuarios y roles',
    module: 'Usuarios',
    description: 'Permite consultar el listado de colaboradores, cuentas y estados de acceso.',
    riskLevel: 'sensible',
  },
  {
    code: 'users.manage',
    name: 'Administrar usuarios y permisos',
    module: 'Usuarios',
    description: 'Permite crear colaboradores, cambiar roles, desactivar accesos, asignar permisos y resetear contraseñas.',
    riskLevel: 'administrativo',
  },

  // Configuración
  {
    code: 'settings.manage',
    name: 'Administrar configuración del taller',
    module: 'Configuración',
    description: 'Permite modificar catálogos maestros (canales, categorías, unidades) y políticas operativas.',
    riskLevel: 'administrativo',
  },

  // Auditoría
  {
    code: 'audit.view',
    name: 'Ver bitácora de auditoría',
    module: 'Auditoría',
    description: 'Permite consultar el historial inmutable de acciones, cambios de stock y eventos de seguridad.',
    riskLevel: 'administrativo',
  },
];

export const PERMISSION_BY_CODE: Record<PermissionCode, PermissionDefinition> =
  PERMISSION_DEFINITIONS.reduce((acc, p) => {
    acc[p.code] = p;
    return acc;
  }, {} as Record<PermissionCode, PermissionDefinition>);

/**
 * Matriz de Permisos por Defecto para cada Rol base (RolePermission).
 * - Administrador: Acceso completo a todas las funciones.
 * - Colaborador: Operación de taller (pedidos, clientes, stock visual), sin acceso a reportes,
 *   administración de usuarios, configuraciones ni auditoría por defecto.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, Record<PermissionCode, boolean>> = {
  Administrador: {
    'orders.view': true,
    'orders.create': true,
    'orders.edit': true,
    'orders.change_status': true,
    'payments.register': true,
    'clients.view': true,
    'clients.edit': true,
    'stock.view': true,
    'stock.adjust': true,
    'calendar.view': true,
    'reports.view': true,
    'reports.export': true,
    'users.view': true,
    'users.manage': true,
    'settings.manage': true,
    'audit.view': true,
  },
  Colaborador: {
    'orders.view': true,
    'orders.create': true,
    'orders.edit': true,
    'orders.change_status': true,
    'payments.register': true,
    'clients.view': true,
    'clients.edit': true,
    'stock.view': true,
    'stock.adjust': false, // Requiere permiso granular explícito o rol de Administrador
    'calendar.view': true,
    'reports.view': false,
    'reports.export': false,
    'users.view': false,
    'users.manage': false,
    'settings.manage': false,
    'audit.view': false,
  },
};

/**
 * Evalúa si un usuario tiene un permiso específico.
 *
 * Algoritmo de resolución (idéntico al decorador @require_permission en Flask):
 * 1. Si no hay usuario o está inactivo -> FALSO.
 * 2. Si el usuario tiene un ajuste específico para este código (UserPermission override):
 *    - true  -> CONCEDIDO (anula rol)
 *    - false -> DENEGADO (anula rol)
 * 3. Si no hay ajuste específico (inherited):
 *    - Retorna el valor por defecto del Rol (RolePermission).
 */
export const hasPermission = (
  user: User | null | undefined,
  permissionCode: PermissionCode
): boolean => {
  if (!user || user.active === false) {
    return false;
  }

  // 1. Verificar override explícito en el usuario (UserPermission)
  if (user.permissions && Object.prototype.hasOwnProperty.call(user.permissions, permissionCode)) {
    const override = user.permissions[permissionCode];
    if (typeof override === 'boolean') {
      return override;
    }
  }

  // 2. Si no hay override, tomar valor por defecto del rol (RolePermission)
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[user.role];
  if (roleDefaults && Object.prototype.hasOwnProperty.call(roleDefaults, permissionCode)) {
    return roleDefaults[permissionCode];
  }

  return false;
};

/**
 * Obtiene el desglose completo de todos los permisos para un usuario,
 * indicando el estado efectivo, origen (rol vs ajuste de usuario) y estado de anulación.
 */
export const getUserEffectivePermissions = (
  user: User | null | undefined
): EffectivePermissionInfo[] => {
  if (!user) return [];

  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[user.role] || {};

  return PERMISSION_DEFINITIONS.map((def) => {
    const roleDefault = roleDefaults[def.code] ?? false;
    let overrideState: PermissionOverrideState = 'inherited';
    let effective = roleDefault;
    let source: 'role' | 'override' = 'role';

    if (user.permissions && Object.prototype.hasOwnProperty.call(user.permissions, def.code)) {
      const val = user.permissions[def.code];
      if (val === true) {
        overrideState = 'granted';
        effective = true;
        source = 'override';
      } else if (val === false) {
        overrideState = 'denied';
        effective = false;
        source = 'override';
      }
    }

    return {
      code: def.code,
      definition: def,
      effective,
      source,
      overrideState,
      roleDefault,
    };
  });
};

/**
 * Genera una descripción legible para el registro de auditoría
 * comparando los overrides anteriores y los nuevos.
 */
export const describePermissionChanges = (
  previousOverrides: Partial<Record<PermissionCode, boolean>> | undefined,
  newOverrides: Partial<Record<PermissionCode, boolean>> | undefined,
  userRole: UserRole
): string => {
  const prev = previousOverrides || {};
  const next = newOverrides || {};

  const changes: string[] = [];

  PERMISSION_DEFINITIONS.forEach((def) => {
    const prevVal = prev[def.code];
    const nextVal = next[def.code];

    if (prevVal !== nextVal) {
      const prevText =
        prevVal === true
          ? 'Concedido explícito'
          : prevVal === false
          ? 'Denegado explícito'
          : `Heredado (${ROLE_DEFAULT_PERMISSIONS[userRole]?.[def.code] ? 'Permitido por rol' : 'No permitido por rol'})`;

      const nextText =
        nextVal === true
          ? 'Concedido explícito'
          : nextVal === false
          ? 'Denegado explícito'
          : `Heredado (${ROLE_DEFAULT_PERMISSIONS[userRole]?.[def.code] ? 'Permitido por rol' : 'No permitido por rol'})`;

      changes.push(`${def.code} (${prevText} ➔ ${nextText})`);
    }
  });

  if (changes.length === 0) {
    return 'Sin cambios en la configuración de permisos granulares.';
  }

  return `Modificación de permisos granulares (${changes.length} cambios): ${changes.join(', ')}`;
};

/**
 * Agrupa los permisos por módulo para su presentación ordenada en la interfaz.
 */
export const getPermissionsGroupedByModule = (): Record<PermissionModule, PermissionDefinition[]> => {
  const grouped: Record<PermissionModule, PermissionDefinition[]> = {
    Pedidos: [],
    Clientes: [],
    Inventario: [],
    Agenda: [],
    Reportes: [],
    Usuarios: [],
    Configuración: [],
    Auditoría: [],
  };

  PERMISSION_DEFINITIONS.forEach((p) => {
    if (grouped[p.module]) {
      grouped[p.module].push(p);
    }
  });

  return grouped;
};

/**
 * Retorna el permiso requerido para acceder a una vista específica,
 * o null si la vista no requiere un permiso granular restrictivo.
 */
export const getViewRequiredPermission = (view: string): PermissionCode | null => {
  switch (view) {
    case 'orders':
    case 'order-detail':
    case 'order-receipt':
      return 'orders.view';
    case 'order-new':
      return 'orders.create';
    case 'order-edit':
      return 'orders.edit';
    case 'components':
      return 'stock.view';
    case 'clients':
    case 'client-detail':
      return 'clients.view';
    case 'calendar':
      return 'calendar.view';
    case 'reports':
      return 'reports.view';
    case 'users':
      return 'users.view';
    case 'audit':
      return 'audit.view';
    case 'settings':
      return 'settings.manage';
    default:
      return null;
  }
};

/**
 * Documentación y Esquema Relacional Flask / SQLAlchemy
 * Proporciona el mapeo de datos exacto requerido para la persistencia backend en Python/Flask.
 */
export const FLASK_SQLALCHEMY_SCHEMA_CODE = `
# ==============================================================================
# MAPEO RELACIONAL RBAC GRANULAR PARA FLASK / SQLALCHEMY (EMILA FLORISTERÍA)
# ==============================================================================
from flask_sqlalchemy import SQLAlchemy
from functools import wraps
from flask import abort, g

db = SQLAlchemy()

# 1. Tabla de Roles (Base: Administrador, Colaborador)
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) # 'Administrador', 'Colaborador'
    description = db.Column(db.String(255), nullable=True)

    role_permissions = db.relationship('RolePermission', backref='role', lazy=True, cascade='all, delete-orphan')

# 2. Tabla de Permisos (Códigos estables)
class Permission(db.Model):
    __tablename__ = 'permissions'
    id = db.Column(db.String(36), primary_key=True)
    code = db.Column(db.String(100), unique=True, nullable=False) # ej. 'orders.create', 'stock.adjust'
    name = db.Column(db.String(100), nullable=False)
    module = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)

# 3. Tabla Intermedia RolePermission (Permisos por defecto de cada rol)
class RolePermission(db.Model):
    __tablename__ = 'role_permissions'
    id = db.Column(db.String(36), primary_key=True)
    role_id = db.Column(db.String(36), db.ForeignKey('roles.id'), nullable=False)
    permission_id = db.Column(db.String(36), db.ForeignKey('permissions.id'), nullable=False)
    granted = db.Column(db.Boolean, default=True, nullable=False)

    permission = db.relationship('Permission')

# 4. Tabla Intermedia UserPermission (Ajustes específicos / overrides por usuario)
class UserPermission(db.Model):
    __tablename__ = 'user_permissions'
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    permission_id = db.Column(db.String(36), db.ForeignKey('permissions.id'), nullable=False)
    granted = db.Column(db.Boolean, nullable=False) # True = Concedido explícito, False = Denegado explícito

    permission = db.relationship('Permission')

# 5. Función de Verificación y Decorador de Endpoints en Flask
def user_has_permission(user, permission_code: str) -> bool:
    if not user or not user.active:
        return False

    # A. Buscar override específico en UserPermission
    override = UserPermission.query.join(Permission).filter(
        UserPermission.user_id == user.id,
        Permission.code == permission_code
    ).first()
    if override is not None:
        return override.granted

    # B. Si no hay override, verificar en RolePermission según el rol del usuario
    role_perm = RolePermission.query.join(Permission).filter(
        RolePermission.role_id == user.role_id,
        Permission.code == permission_code
    ).first()
    if role_perm is not None:
        return role_perm.granted

    return False

def require_permission(permission_code: str):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user = getattr(g, 'current_user', None)
            if not user_has_permission(current_user, permission_code):
                abort(403, description=f"Permiso insuficiente: se requiere '{permission_code}'.")
            return f(*args, **kwargs)
        return decorated_function
    return decorator
`.trim();
