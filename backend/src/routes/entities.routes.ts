import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

const crud = (model: keyof typeof prisma, ...roles: string[]) => {
  const r = Router();
  const auth = roles.length ? [authenticate, authorize(...roles)] : [authenticate];

  r.get('/', ...auth, asyncHandler(async (_req, res) => {
    const data = await (prisma[model] as any).findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data });
  }));

  r.post('/', ...auth, asyncHandler(async (req, res) => {
    const data = await (prisma[model] as any).create({ data: req.body });
    res.status(201).json({ success: true, data });
  }));

  r.put('/:id', ...auth, asyncHandler(async (req, res) => {
    const data = await (prisma[model] as any).update({ where: { id: req.params.id as string }, data: req.body });
    res.json({ success: true, data });
  }));

  return r;
};

router.use('/customers', crud('customer', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES'));
router.use('/vendors', crud('vendor', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PURCHASE'));
router.use('/warehouses', crud('warehouse', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'WAREHOUSE'));

router.get('/deliveries', authenticate, asyncHandler(async (_req, res) => {
  const data = await prisma.delivery.findMany({ include: { salesOrder: { include: { customer: true } } }, orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data });
}));

router.get('/invoices', authenticate, asyncHandler(async (_req, res) => {
  const data = await prisma.invoice.findMany({ include: { salesOrder: { include: { customer: true } } }, orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data });
}));

router.get('/payments', authenticate, asyncHandler(async (_req, res) => {
  const data = await prisma.payment.findMany({ include: { customer: true, salesOrder: true }, orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data });
}));

router.get('/users', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, lastLogin: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: users });
}));

router.get('/settings', authenticate, asyncHandler(async (_req, res) => {
  let settings = await prisma.companySettings.findFirst();
  if (!settings) settings = await prisma.companySettings.create({ data: {} });
  res.json({ success: true, data: settings });
}));

router.put('/settings', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req, res) => {
  let settings = await prisma.companySettings.findFirst();
  if (!settings) settings = await prisma.companySettings.create({ data: req.body });
  else settings = await prisma.companySettings.update({ where: { id: settings.id }, data: req.body });
  res.json({ success: true, data: settings });
}));

export default router;
