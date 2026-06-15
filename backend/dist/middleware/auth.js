"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireModuleAccess = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const prisma_1 = __importDefault(require("../lib/prisma"));
const permissions_1 = require("../lib/permissions");
const authenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new errorHandler_1.AppError('Authentication required', 401);
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, firstName: true, lastName: true, isActive: true, panels: true },
        });
        if (!user || !user.isActive) {
            throw new errorHandler_1.AppError('User not found or inactive', 401);
        }
        req.user = user;
        next();
    }
    catch {
        next(new errorHandler_1.AppError('Invalid or expired token', 401));
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        // Allow all roles for now as per user request to have the same data as admin
        // if (roles.length > 0 && !roles.includes(req.user.role)) {
        //   return next(new AppError('Insufficient permissions', 403));
        // }
        next();
    };
};
exports.authorize = authorize;
const requireModuleAccess = (module, write = false) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        if (!(0, permissions_1.hasModuleAccess)(req.user.role, module, req.user.panels)) {
            return next(new errorHandler_1.AppError('You do not have access to this module.', 403));
        }
        if (write && !(0, permissions_1.canWrite)(req.user.role, module, req.user.panels)) {
            return next(new errorHandler_1.AppError('You have read-only access to this module.', 403));
        }
        next();
    };
};
exports.requireModuleAccess = requireModuleAccess;
