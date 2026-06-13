"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const openai_1 = __importDefault(require("openai"));
const generative_ai_1 = require("@google/generative-ai");
const prisma_1 = __importDefault(require("../lib/prisma"));
const logger_1 = require("../lib/logger");
class AIService {
    constructor() {
        this.openai = null;
        this.gemini = null;
        if (process.env.OPENAI_API_KEY) {
            this.openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
        }
        if (process.env.GEMINI_API_KEY) {
            this.gemini = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        }
    }
    async getOperationalContext() {
        const [products, lowStock, salesOrders, manufacturingOrders] = await Promise.all([
            prisma_1.default.product.count({ where: { isActive: true } }),
            prisma_1.default.inventory.findMany({
                include: { product: true },
                take: 50,
            }),
            prisma_1.default.salesOrder.findMany({
                where: { status: { in: ['CONFIRMED', 'PARTIALLY_DELIVERED'] } },
                include: { customer: true, items: { include: { product: true } } },
                take: 20,
            }),
            prisma_1.default.manufacturingOrder.findMany({
                where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } },
                include: { bom: { include: { finishedProduct: true } } },
                take: 20,
            }),
        ]);
        const lowStockItems = lowStock
            .filter((i) => i.onHandQty - i.reservedQty <= (i.product.reorderPoint || 10))
            .map((i) => ({
            product: i.product.name,
            sku: i.product.sku,
            freeQty: i.onHandQty - i.reservedQty,
            reorderPoint: i.product.reorderPoint,
        }));
        return JSON.stringify({
            company: 'Shiv Furniture Works',
            platform: 'Syncra ERP',
            totalProducts: products,
            lowStockItems,
            pendingSalesOrders: salesOrders.length,
            activeManufacturing: manufacturingOrders.length,
            salesOrders: salesOrders.map((o) => ({
                orderNumber: o.orderNumber,
                customer: o.customer.name,
                status: o.status,
                total: Number(o.totalAmount),
            })),
            manufacturingOrders: manufacturingOrders.map((m) => ({
                orderNumber: m.orderNumber,
                product: m.bom.finishedProduct.name,
                status: m.status,
                quantity: m.quantity,
            })),
        });
    }
    async chat(message) {
        const context = await this.getOperationalContext();
        const systemPrompt = `You are Syncra AI Copilot for Shiv Furniture Works, a furniture manufacturing ERP.
Tagline: "Where Inventory Meets Intelligence"
You help with inventory forecasting, procurement, manufacturing optimization, and business analytics.
Current operational data: ${context}
Provide actionable, concise insights. Use bullet points when helpful.`;
        if (this.openai) {
            try {
                const completion = await this.openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message },
                    ],
                    max_tokens: 1000,
                });
                return {
                    response: completion.choices[0]?.message?.content || 'No response generated.',
                    provider: 'openai',
                };
            }
            catch (e) {
                logger_1.logger.warn('OpenAI failed, falling back', { error: e.message });
            }
        }
        if (this.gemini) {
            try {
                const model = this.gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const result = await model.generateContent(`${systemPrompt}\n\nUser: ${message}`);
                return { response: result.response.text(), provider: 'gemini' };
            }
            catch (e) {
                logger_1.logger.warn('Gemini failed', { error: e.message });
            }
        }
        return { response: this.getMockResponse(message, context), provider: 'mock' };
    }
    getMockResponse(message, context) {
        const data = JSON.parse(context);
        const lower = message.toLowerCase();
        if (lower.includes('low stock') || lower.includes('shortage')) {
            const items = data.lowStockItems.slice(0, 5);
            if (items.length === 0)
                return '✅ All inventory levels are healthy. No critical shortages detected.';
            return `⚠️ **Low Stock Alert**\n\n${items.map((i) => `- **${i.product}**: ${i.freeQty} units free (reorder at ${i.reorderPoint})`).join('\n')}\n\n**Recommendation**: Trigger procurement automation for items below reorder point.`;
        }
        if (lower.includes('delayed') || lower.includes('delivery')) {
            return `📦 **Delivery Status**\n\n- ${data.pendingSalesOrders} orders pending delivery\n- Review orders in CONFIRMED status for scheduling\n\n**AI Insight**: Prioritize orders with earliest delivery dates. Consider partial deliveries for large orders.`;
        }
        if (lower.includes('procurement') || lower.includes('purchase')) {
            return `🛒 **Procurement Recommendations**\n\nBased on current inventory:\n- Review ${data.lowStockItems.length} items below reorder point\n- Active manufacturing orders: ${data.activeManufacturing}\n\n**Suggested Actions**:\n1. Auto-generate POs for raw materials\n2. Schedule manufacturing for finished goods shortages\n3. Contact top-rated vendors for expedited delivery`;
        }
        if (lower.includes('manufacturing') || lower.includes('bottleneck')) {
            return `🏭 **Manufacturing Analysis**\n\n- Active MOs: ${data.activeManufacturing}\n- Work centers: Assembly Line, Paint Floor, Packaging Unit\n\n**Optimization Tips**:\n- Balance load across work centers\n- Pre-reserve components before MO start\n- Monitor Paint Floor utilization (typically highest bottleneck)`;
        }
        if (lower.includes('sales') || lower.includes('selling')) {
            return `📈 **Sales Intelligence**\n\n- Pending orders: ${data.pendingSalesOrders}\n- Total active products: ${data.totalProducts}\n\n**Top Actions**:\n- Focus on high-margin furniture lines\n- Cross-sell matching accessories\n- Review customer payment histories`;
        }
        return `🤖 **Syncra AI Copilot**\n\nI'm analyzing your Shiv Furniture Works operations.\n\n**Quick Stats**:\n- Products: ${data.totalProducts}\n- Low stock items: ${data.lowStockItems.length}\n- Pending sales: ${data.pendingSalesOrders}\n- Active manufacturing: ${data.activeManufacturing}\n\nTry asking:\n- "Why is stock low?"\n- "Predict next week shortages"\n- "Which orders are delayed?"\n- "Suggest procurement actions"`;
    }
    async getInsights() {
        const context = await this.getOperationalContext();
        const data = JSON.parse(context);
        return {
            inventoryForecast: {
                trend: data.lowStockItems.length > 3 ? 'declining' : 'stable',
                criticalItems: data.lowStockItems.length,
                recommendation: data.lowStockItems.length > 0
                    ? 'Trigger automated procurement for low stock items'
                    : 'Inventory levels are optimal',
            },
            salesForecast: {
                pendingOrders: data.pendingSalesOrders,
                trend: 'growing',
                projectedRevenue: data.salesOrders.reduce((s, o) => s + o.total, 0),
            },
            manufacturing: {
                activeOrders: data.activeManufacturing,
                bottleneck: 'Paint Floor',
                utilization: 78,
                recommendation: 'Schedule preventive maintenance on Paint Floor',
            },
            procurement: {
                urgentItems: data.lowStockItems.length,
                suggestedPOs: Math.min(data.lowStockItems.length, 5),
                estimatedCost: data.lowStockItems.length * 15000,
            },
            anomalies: data.lowStockItems.length > 5
                ? [{ type: 'INVENTORY', message: 'Multiple items below reorder point simultaneously' }]
                : [],
        };
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();
