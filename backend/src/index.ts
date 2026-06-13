import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import productsRoutes from './routes/products.routes';
import inventoryRoutes from './routes/inventory.routes';
import salesRoutes from './routes/sales.routes';
import purchaseRoutes from './routes/purchase.routes';
import manufacturingRoutes from './routes/manufacturing.routes';
import systemRoutes from './routes/system.routes';
import procurementRoutes from './routes/procurement.routes';
import reportsRoutes from './routes/reports.routes';
import entitiesRoutes from './routes/entities.routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './lib/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Syncra ERP API is running', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api', entitiesRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Syncra ERP Backend running on port ${PORT}`);
});

export default app;
