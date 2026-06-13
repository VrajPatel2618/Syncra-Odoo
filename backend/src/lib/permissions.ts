export type RoleType = 'ADMIN' | 'SALES_MANAGER' | 'SALES_EXECUTIVE' | 'PURCHASE_MANAGER' | 'WAREHOUSE_MANAGER' | 'PRODUCTION_MANAGER' | 'VIEWER';
export type AccessLevel = 'full' | 'read' | 'own' | 'limited' | 'none';
export type ModuleType = 'dashboard' | 'inventory' | 'sales' | 'purchase' | 'manufacturing' | 'audit_log' | 'user_management' | 'blockchain';

export const PERMISSION_MATRIX: Record<RoleType, Record<ModuleType, AccessLevel>> = {
  'ADMIN':              {'dashboard': 'full', 'inventory': 'full', 'sales': 'full', 'purchase': 'full', 'manufacturing': 'full', 'audit_log': 'full', 'user_management': 'full', 'blockchain': 'full'},
  'SALES_MANAGER':      {'dashboard': 'full', 'inventory': 'read', 'sales': 'full', 'purchase': 'read', 'manufacturing': 'none', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read'},
  'SALES_EXECUTIVE':    {'dashboard': 'limited', 'inventory': 'none', 'sales': 'own', 'purchase': 'none', 'manufacturing': 'none', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'none'},
  'PURCHASE_MANAGER':   {'dashboard': 'full', 'inventory': 'read', 'sales': 'read', 'purchase': 'full', 'manufacturing': 'read', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read'},
  'WAREHOUSE_MANAGER':  {'dashboard': 'full', 'inventory': 'full', 'sales': 'none', 'purchase': 'read', 'manufacturing': 'read', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read'},
  'PRODUCTION_MANAGER': {'dashboard': 'full', 'inventory': 'read', 'sales': 'none', 'purchase': 'read', 'manufacturing': 'full', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read'},
  'VIEWER':             {'dashboard': 'read', 'inventory': 'read', 'sales': 'read', 'purchase': 'read', 'manufacturing': 'read', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read'},
};

export const getAccessLevel = (role: string, module: ModuleType): AccessLevel => {
  const normalizedRole = role.toUpperCase() as RoleType;
  return PERMISSION_MATRIX[normalizedRole]?.[module] || 'none';
};

export const hasModuleAccess = (role: string, module: ModuleType): boolean => {
  return getAccessLevel(role, module) !== 'none';
};

export const canWrite = (role: string, module: ModuleType): boolean => {
  const level = getAccessLevel(role, module);
  return level === 'full' || level === 'own';
};

export const canViewAllRecords = (role: string, module: ModuleType): boolean => {
  const level = getAccessLevel(role, module);
  return level === 'full' || level === 'read' || level === 'limited';
};
