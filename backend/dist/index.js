"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const products_routes_1 = __importDefault(require("./routes/products.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const sales_routes_1 = __importDefault(require("./routes/sales.routes"));
const purchase_routes_1 = __importDefault(require("./routes/purchase.routes"));
const manufacturing_routes_1 = __importDefault(require("./routes/manufacturing.routes"));
const system_routes_1 = __importDefault(require("./routes/system.routes"));
const procurement_routes_1 = __importDefault(require("./routes/procurement.routes"));
const reports_routes_1 = __importDefault(require("./routes/reports.routes"));
const entities_routes_1 = __importDefault(require("./routes/entities.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./lib/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '0.0.0.0';
const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS,
]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...configuredOrigins,
]);
const localDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;
const corsOptions = {
    credentials: true,
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin) || (process.env.NODE_ENV !== 'production' && localDevOrigin.test(origin))) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
    },
};
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(corsOptions));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'Syncra ERP API is running', version: '1.0.0' });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/products', products_routes_1.default);
app.use('/api/inventory', inventory_routes_1.default);
app.use('/api/sales', sales_routes_1.default);
app.use('/api/purchases', purchase_routes_1.default);
app.use('/api/manufacturing', manufacturing_routes_1.default);
app.use('/api/system', system_routes_1.default);
app.use('/api/procurement', procurement_routes_1.default);
app.use('/api/reports', reports_routes_1.default);
app.use('/api', entities_routes_1.default);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, HOST, () => {
    logger_1.logger.info(`Syncra ERP Backend running at http://${HOST}:${PORT}`);
});
exports.default = app;
