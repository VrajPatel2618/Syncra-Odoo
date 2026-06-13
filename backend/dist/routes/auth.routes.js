"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/register', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, firstName, lastName, role } = req.body;
    const existing = await prisma_1.default.user.findUnique({ where: { email } });
    if (existing)
        throw new errorHandler_1.AppError('Email already registered', 400);
    const hashed = await bcryptjs_1.default.hash(password, 12);
    const user = await prisma_1.default.user.create({
        data: { email, password: hashed, firstName, lastName, role: role || 'VIEWER' },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, data: { user, token } });
}));
router.post('/login', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
        throw new errorHandler_1.AppError('Invalid credentials', 401);
    }
    await prisma_1.default.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatar: user.avatar,
            },
            token,
        },
    });
}));
router.get('/me', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true, phone: true, lastLogin: true },
    });
    res.json({ success: true, data: user });
}));
router.post('/forgot-password', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user) {
        return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    }
    res.json({ success: true, message: 'Password reset link sent', data: { resetToken: 'demo-reset-token' } });
}));
router.post('/verify-otp', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { code } = req.body;
    if (!code || String(code).length < 6) {
        return res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }
    res.json({ success: true, message: 'OTP verified' });
}));
exports.default = router;
