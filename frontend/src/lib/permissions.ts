export type RoleType = 'ADMIN' | 'VIEWER' | 'SALES' | 'PRODUCT' | 'MANUFACTURING' | 'INTELLIGENCE' | 'INVENTORY';
export type AccessLevel = 'full' | 'read' | 'own' | 'limited' | 'none';
export type ModuleType = 'dashboard' | 'inventory' | 'sales' | 'purchase' | 'manufacturing' | 'audit_log' | 'user_management' | 'blockchain';

export const PERMISSION_MATRIX: Record<RoleType, Record<ModuleType, AccessLevel>> = {
  'ADMIN':         {'dashboard': 'full', 'inventory': 'full', 'sales': 'full', 'purchase': 'full', 'manufacturing': 'full', 'audit_log': 'full', 'user_management': 'full', 'blockchain': 'full'},
  'VIEWER':        {'dashboard': 'read', 'inventory': 'read', 'sales': 'read', 'purchase': 'read', 'manufacturing': 'read', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read'},
  'SALES':         {'dashboard': 'full', 'inventory': 'read', 'sales': 'full', 'purchase': 'none', 'manufacturing': 'none', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read'},
  'PRODUCT':       {'dashboard': 'full', 'inventory': 'full', 'sales': 'read', 'purchase': 'full', 'manufacturing': 'read', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read'},
  'MANUFACTURING': {'dashboard': 'full', 'inventory': 'read', 'sales': 'none', 'purchase': 'read', 'manufacturing': 'full', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read'},
  'INTELLIGENCE':  {'dashboard': 'full', 'inventory': 'read', 'sales': 'read', 'purchase': 'read', 'manufacturing': 'read', 'audit_log': 'read', 'user_management': 'none', 'blockchain': 'full'},
  'INVENTORY':     {'dashboard': 'full', 'inventory': 'full', 'sales': 'none', 'purchase': 'read', 'manufacturing': 'none', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read'},
};

export const getAccessLevel = (role: string | undefined, module: ModuleType): AccessLevel => {
  if (!role) return 'none';
  const normalizedRole = role.toUpperCase() as RoleType;
  return PERMISSION_MATRIX[normalizedRole]?.[module] || 'none';
};

export const hasModuleAccess = (role: string | undefined, module: ModuleType, panels?: string | string[] | null): boolean => {
  if (panels) {
    try {
      const parsedPanels = typeof panels === 'string' ? JSON.parse(panels) : panels;
      if (Array.isArray(parsedPanels) && parsedPanels.includes(module)) return true;
    } catch(e) {}
  }
  return getAccessLevel(role, module) !== 'none';
};

export const canWrite = (role: string | undefined, module: ModuleType, panels?: string | string[] | null): boolean => {
  if (panels) {
    try {
      const parsedPanels = typeof panels === 'string' ? JSON.parse(panels) : panels;
      if (Array.isArray(parsedPanels) && parsedPanels.includes(module)) return true;
    } catch(e) {}
  }
  const level = getAccessLevel(role, module);
  return level === 'full' || level === 'own';
};
