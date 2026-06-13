"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canViewAllRecords = exports.canWrite = exports.hasModuleAccess = exports.getAccessLevel = exports.PERMISSION_MATRIX = void 0;
exports.PERMISSION_MATRIX = {
    'ADMIN': { 'dashboard': 'full', 'inventory': 'full', 'sales': 'full', 'purchase': 'full', 'manufacturing': 'full', 'audit_log': 'full', 'user_management': 'full', 'blockchain': 'full' },
    'SALES_MANAGER': { 'dashboard': 'full', 'inventory': 'read', 'sales': 'full', 'purchase': 'read', 'manufacturing': 'none', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read' },
    'SALES_EXECUTIVE': { 'dashboard': 'limited', 'inventory': 'none', 'sales': 'own', 'purchase': 'none', 'manufacturing': 'none', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'none' },
    'PURCHASE_MANAGER': { 'dashboard': 'full', 'inventory': 'read', 'sales': 'read', 'purchase': 'full', 'manufacturing': 'read', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read' },
    'WAREHOUSE_MANAGER': { 'dashboard': 'full', 'inventory': 'full', 'sales': 'none', 'purchase': 'read', 'manufacturing': 'read', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read' },
    'PRODUCTION_MANAGER': { 'dashboard': 'full', 'inventory': 'read', 'sales': 'none', 'purchase': 'read', 'manufacturing': 'full', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read' },
    'VIEWER': { 'dashboard': 'read', 'inventory': 'read', 'sales': 'read', 'purchase': 'read', 'manufacturing': 'read', 'audit_log': 'none', 'user_management': 'none', 'blockchain': 'read' },
};
const getAccessLevel = (role, module) => {
    const normalizedRole = role.toUpperCase();
    return exports.PERMISSION_MATRIX[normalizedRole]?.[module] || 'none';
};
exports.getAccessLevel = getAccessLevel;
const hasModuleAccess = (role, module) => {
    return (0, exports.getAccessLevel)(role, module) !== 'none';
};
exports.hasModuleAccess = hasModuleAccess;
const canWrite = (role, module) => {
    const level = (0, exports.getAccessLevel)(role, module);
    return level === 'full' || level === 'own';
};
exports.canWrite = canWrite;
const canViewAllRecords = (role, module) => {
    const level = (0, exports.getAccessLevel)(role, module);
    return level === 'full' || level === 'read' || level === 'limited';
};
exports.canViewAllRecords = canViewAllRecords;
