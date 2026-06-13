"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const crud = (model, ...roles) => {
    const r = (0, express_1.Router)();
    const auth = roles.length ? [auth_1.authenticate, (0, auth_1.authorize)(...roles)] : [auth_1.authenticate];
    r.get('/', ...auth, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
        const data = await prisma_1.default[model].findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ success: true, data });
    }));
    r.post('/', ...auth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const data = await prisma_1.default[model].create({ data: req.body });
        res.status(201).json({ success: true, data });
    }));
    r.put('/:id', ...auth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const data = await prisma_1.default[model].update({ where: { id: req.params.id }, data: req.body });
        res.json({ success: true, data });
    }));
    return r;
};
router.use('/customers', crud('customer', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES'));
router.use('/vendors', crud('vendor', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PURCHASE'));
router.use('/warehouses', crud('warehouse', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'WAREHOUSE'));
router.get('/deliveries', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const data = await prisma_1.default.delivery.findMany({ include: { salesOrder: { include: { customer: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data });
}));
router.get('/invoices', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const data = await prisma_1.default.invoice.findMany({ include: { salesOrder: { include: { customer: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data });
}));
router.get('/payments', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const data = await prisma_1.default.payment.findMany({ include: { customer: true, salesOrder: true }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data });
}));
router.get('/users', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN'), (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const users = await prisma_1.default.user.findMany({
        select: { id: true, email: true, firstName: true, lastName: true, role: true, panels: true, isActive: true, lastLogin: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
}));
router.post('/users', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, firstName, lastName, role, department, panels } = req.body;
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password || 'password123', 12);
    const user = await prisma_1.default.user.create({
        data: { email, password: hashedPassword, firstName, lastName, role, department, panels: panels ? JSON.stringify(panels) : null },
    });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
}));
router.delete('/users/:id', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await prisma_1.default.user.delete({
        where: { id: req.params.id }
    });
    res.json({ success: true, message: 'User deleted successfully' });
}));
router.get('/settings', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    let settings = await prisma_1.default.companySettings.findFirst();
    if (!settings)
        settings = await prisma_1.default.companySettings.create({ data: {} });
    res.json({ success: true, data: settings });
}));
router.put('/settings', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    let settings = await prisma_1.default.companySettings.findFirst();
    if (!settings)
        settings = await prisma_1.default.companySettings.create({ data: req.body });
    else
        settings = await prisma_1.default.companySettings.update({ where: { id: settings.id }, data: req.body });
    res.json({ success: true, data: settings });
}));
exports.default = router;
