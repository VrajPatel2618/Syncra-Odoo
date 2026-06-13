import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  salesApi,
  purchaseApi,
  inventoryApi,
  manufacturingApi,
  productsApi,
  systemApi,
} from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export type ReportType =
  | "sales"
  | "purchase"
  | "inventory"
  | "manufacturing"
  | "vendor"
  | "profit";

type TableData = { title: string; headers: string[]; rows: (string | number)[][] };

const COMPANY = "Universal Systems Inc.";
const TAGLINE = "Syncra ERP — Where Inventory Meets Intelligence";

const mockSales = [
  { orderNumber: "SO-DEMO001", customer: { name: "Modern Homes Pvt Ltd" }, status: "CONFIRMED", totalAmount: 106198, orderDate: new Date().toISOString() },
  { orderNumber: "SO-DEMO002", customer: { name: "Elite Interiors" }, status: "DRAFT", totalAmount: 54999, orderDate: new Date().toISOString() },
];

const mockPurchases = [
  { orderNumber: "PO-DEMO001", vendor: { name: "Gujarat Timber" }, status: "CONFIRMED", totalAmount: 590000 },
  { orderNumber: "PO-DEMO002", vendor: { name: "Premium Fabrics India" }, status: "RECEIVED", totalAmount: 125000 },
];

const mockInventory = [
  { product: { name: "Royal Teak Sofa Set", sku: "FG-SFA-001" }, warehouse: { name: "Main Warehouse" }, onHandQty: 12, reservedQty: 2 },
  { product: { name: "Ergonomic Office Chair", sku: "FG-CHR-001" }, warehouse: { name: "Main Warehouse" }, onHandQty: 8, reservedQty: 3 },
];

const mockManufacturing = [
  { orderNumber: "MO-DEMO001", bom: { finishedProduct: { name: "Royal Teak Sofa Set" } }, quantity: 5, producedQty: 2, status: "IN_PROGRESS", workCenter: { name: "Assembly Line" } },
  { orderNumber: "MO-DEMO002", bom: { finishedProduct: { name: "King Size Bed Frame" } }, quantity: 10, producedQty: 0, status: "PLANNED", workCenter: { name: "Paint Floor" } },
];

const mockVendors = [
  { name: "Gujarat Timber Suppliers", email: "sales@gujtimber.com", rating: 4.8, leadTimeDays: 5, isActive: true },
  { name: "Premium Fabrics India", email: "orders@premiumfabrics.com", rating: 4.5, leadTimeDays: 7, isActive: true },
];

const mockProducts = [
  { sku: "FG-SFA-001", name: "Royal Teak Sofa Set", category: { name: "Living Room" }, unitPrice: 89999, reorderPoint: 5 },
  { sku: "FG-CHR-001", name: "Ergonomic Office Chair", category: { name: "Office" }, unitPrice: 12999, reorderPoint: 15 },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function fileStamp() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchReportData(type: ReportType): Promise<TableData> {
  switch (type) {
    case "sales": {
      const orders = await salesApi.list().then((r) => r.data.data).catch(() => mockSales);
      return {
        title: "Sales Report",
        headers: ["Order #", "Customer", "Status", "Total", "Order Date"],
        rows: orders.map((o: Record<string, unknown>) => [
          String(o.orderNumber),
          (o.customer as { name?: string })?.name ?? "—",
          String(o.status),
          formatCurrency(Number(o.totalAmount)),
          o.orderDate ? formatDate(String(o.orderDate)) : "—",
        ]),
      };
    }
    case "purchase": {
      const orders = await purchaseApi.list().then((r) => r.data.data).catch(() => mockPurchases);
      return {
        title: "Purchase Report",
        headers: ["PO #", "Vendor", "Status", "Total"],
        rows: orders.map((o: Record<string, unknown>) => [
          String(o.orderNumber),
          (o.vendor as { name?: string })?.name ?? "—",
          String(o.status),
          formatCurrency(Number(o.totalAmount)),
        ]),
      };
    }
    case "inventory": {
      const items = await inventoryApi.list().then((r) => r.data.data).catch(() => mockInventory);
      return {
        title: "Inventory Report",
        headers: ["SKU", "Product", "Warehouse", "On Hand", "Reserved", "Free Qty"],
        rows: items.map((i: Record<string, unknown>) => {
          const onHand = Number(i.onHandQty);
          const reserved = Number(i.reservedQty);
          return [
            (i.product as { sku?: string })?.sku ?? "—",
            (i.product as { name?: string })?.name ?? "—",
            (i.warehouse as { name?: string })?.name ?? "—",
            onHand,
            reserved,
            onHand - reserved,
          ];
        }),
      };
    }
    case "manufacturing": {
      const orders = await manufacturingApi.orders().then((r) => r.data.data).catch(() => mockManufacturing);
      return {
        title: "Manufacturing Report",
        headers: ["MO #", "Product", "Work Center", "Qty", "Produced", "Status"],
        rows: orders.map((o: Record<string, unknown>) => [
          String(o.orderNumber),
          (o.bom as { finishedProduct?: { name?: string } })?.finishedProduct?.name ?? "—",
          (o.workCenter as { name?: string })?.name ?? "—",
          Number(o.quantity),
          Number(o.producedQty ?? 0),
          String(o.status),
        ]),
      };
    }
    case "vendor": {
      const vendors = await systemApi.vendors().then((r) => r.data.data).catch(() => mockVendors);
      return {
        title: "Vendor Report",
        headers: ["Vendor", "Email", "Rating", "Lead Time (days)", "Active"],
        rows: vendors.map((v: Record<string, unknown>) => [
          String(v.name),
          String(v.email ?? "—"),
          Number(v.rating ?? 0),
          Number(v.leadTimeDays ?? 0),
          v.isActive === false ? "No" : "Yes",
        ]),
      };
    }
    case "profit": {
      const orders = await salesApi.list().then((r) => r.data.data).catch(() => mockSales);
      const purchases = await purchaseApi.list().then((r) => r.data.data).catch(() => mockPurchases);
      const revenue = orders.reduce((s: number, o: { totalAmount?: number }) => s + Number(o.totalAmount ?? 0), 0);
      const spend = purchases.reduce((s: number, o: { totalAmount?: number }) => s + Number(o.totalAmount ?? 0), 0);
      const margin = revenue > 0 ? (((revenue - spend) / revenue) * 100).toFixed(1) : "0";
      return {
        title: "Profit Analytics",
        headers: ["Metric", "Value"],
        rows: [
          ["Total Revenue", formatCurrency(revenue)],
          ["Total Procurement Spend", formatCurrency(spend)],
          ["Gross Margin", `${margin}%`],
          ["Sales Orders", orders.length],
          ["Purchase Orders", purchases.length],
        ],
      };
    }
  }
}

export async function exportReportPdf(type: ReportType) {
  const { title, headers, rows } = await fetchReportData(type);
  const doc = new jsPDF({ orientation: headers.length > 5 ? "landscape" : "portrait" });

  doc.setFontSize(16);
  doc.setTextColor(154, 52, 18);
  doc.text(COMPANY, 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(title, 14, 26);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`${TAGLINE} · Generated ${formatDate(new Date())}`, 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [headers],
    body: rows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [154, 52, 18], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 247, 242] },
  });

  doc.save(`syncra-${type}-report-${fileStamp()}.pdf`);
}

export async function exportReportExcel(type: ReportType) {
  const { title, headers, rows } = await fetchReportData(type);
  const sheet = XLSX.utils.aoa_to_sheet([[COMPANY], [title], [`Generated ${formatDate(new Date())}`], [], headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, title.slice(0, 31));
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `syncra-${type}-report-${fileStamp()}.xlsx`);
}

export async function exportProductsCsv() {
  const products = await productsApi.list().then((r) => r.data.data).catch(() => mockProducts);
  const headers = ["SKU", "Name", "Category", "Unit Price", "Reorder Point"];
  const rows = products.map((p: Record<string, unknown>) => [
    String(p.sku),
    String(p.name),
    (p.category as { name?: string })?.name ?? "—",
    Number(p.unitPrice ?? 0),
    Number(p.reorderPoint ?? 0),
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `syncra-products-${fileStamp()}.csv`);
}
