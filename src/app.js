"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middleware/error.middleware");
const notFound_middleware_1 = require("./middleware/notFound.middleware");
const app = (0, express_1.default)();
// Security Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.NODE_ENV === 'development' ? true : env_1.env.FRONTEND_URL,
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env_1.env.NODE_ENV === 'development' ? 10000 : 100, // Relax rate limiting in development for gateway polling
    message: 'Too many requests from this IP, please try again later',
});
app.use('/api', limiter);
// Built-in Middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health Check Endpoint
app.get('/health', (req, res) => {
    // In a real scenario, you'd check DB state here as well
    import('mongoose').then((mongoose) => {
        const isDbConnected = mongoose.connection.readyState === 1;
        res.json({
            success: true,
            status: 'healthy',
            database: isDbConnected ? 'connected' : 'disconnected',
        });
    });
});
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const farmer_routes_1 = __importDefault(require("./routes/farmer.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const supplier_routes_1 = __importDefault(require("./routes/supplier.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const purchase_routes_1 = __importDefault(require("./routes/purchase.routes"));
const sale_routes_1 = __importDefault(require("./routes/sale.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const credit_routes_1 = __importDefault(require("./routes/credit.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
// API Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/farmers', farmer_routes_1.default);
app.use('/api/v1/products', product_routes_1.default);
app.use('/api/v1/suppliers', supplier_routes_1.default);
app.use('/api/v1/inventory', inventory_routes_1.default);
app.use('/api/v1/purchases', purchase_routes_1.default);
app.use('/api/v1/sales', sale_routes_1.default);
app.use('/api/v1/payments', payment_routes_1.default);
app.use('/api/v1/credits', credit_routes_1.default);
app.use('/api/v1/dashboard', dashboard_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
app.use('/api/v1/admin', admin_routes_1.default);
// 404 Handler
app.use(notFound_middleware_1.notFoundHandler);
// Global Error Handler
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map