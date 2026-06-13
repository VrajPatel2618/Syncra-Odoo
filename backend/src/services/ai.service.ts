import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

export class AIService {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  async getOperationalContext(): Promise<string> {
    const [products, lowStock, salesOrders, manufacturingOrders] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.inventory.findMany({
        include: { product: true },
        take: 50,
      }),
      prisma.salesOrder.findMany({
        where: { status: { in: ['CONFIRMED', 'PARTIALLY_DELIVERED'] } },
        include: { customer: true, items: { include: { product: true } } },
        take: 20,
      }),
      prisma.manufacturingOrder.findMany({
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
      company: 'Universal Systems Inc.',
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

  async chat(message: string): Promise<{ response: string; provider: string }> {
    const context = await this.getOperationalContext();
    const systemPrompt = `You are Syncra AI Copilot for Universal Systems Inc., a furniture manufacturing ERP.
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
      } catch (e) {
        logger.warn('OpenAI failed, falling back', { error: (e as Error).message });
      }
    }

    if (this.gemini) {
      try {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(`${systemPrompt}\n\nUser: ${message}`);
        return { response: result.response.text(), provider: 'gemini' };
      } catch (e) {
        logger.warn('Gemini failed', { error: (e as Error).message });
      }
    }

    return { response: this.getMockResponse(message, context), provider: 'mock' };
  }

  private getMockResponse(message: string, context: string): string {
    const data = JSON.parse(context);
    const lower = message.toLowerCase();

    if (lower.includes('low stock') || lower.includes('shortage')) {
      const items = data.lowStockItems.slice(0, 5);
      if (items.length === 0) return '✅ All inventory levels are healthy. No critical shortages detected.';
      return `⚠️ **Low Stock Alert**\n\n${items.map((i: { product: string; freeQty: number; reorderPoint: number }) => `- **${i.product}**: ${i.freeQty} units free (reorder at ${i.reorderPoint})`).join('\n')}\n\n**Recommendation**: Trigger procurement automation for items below reorder point.`;
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

    return `🤖 **Syncra AI Copilot**\n\nI'm analyzing your Universal Systems Inc. operations.\n\n**Quick Stats**:\n- Products: ${data.totalProducts}\n- Low stock items: ${data.lowStockItems.length}\n- Pending sales: ${data.pendingSalesOrders}\n- Active manufacturing: ${data.activeManufacturing}\n\nTry asking:\n- "Why is stock low?"\n- "Predict next week shortages"\n- "Which orders are delayed?"\n- "Suggest procurement actions"`;
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
        projectedRevenue: data.salesOrders.reduce((s: number, o: { total: number }) => s + o.total, 0),
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

export const aiService = new AIService();
