import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceItem {
  product_title: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  campus_name: string;
  items: InvoiceItem[];
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  total_amount: number;
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
}

interface PurchaseOrderData {
  po_number: string;
  order_date: string;
  supplier_name: string;
  items: Array<{
    product_title: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
  }>;
  total_amount: number;
  company_name?: string;
  warehouse_address?: string;
}

export const generateInvoicePDF = (data: InvoiceData) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text(data.company_name || "Book Inventory System", 14, 20);
  doc.setFontSize(10);
  doc.text(data.company_address || "", 14, 27);
  doc.text(data.company_phone || "", 14, 32);
  doc.text(data.company_email || "", 14, 37);

  // Invoice Title
  doc.setFontSize(16);
  doc.text("SALES INVOICE", 14, 50);

  // Invoice Details
  doc.setFontSize(10);
  doc.text(`Invoice #: ${data.invoice_number}`, 14, 60);
  doc.text(`Date: ${new Date(data.invoice_date).toLocaleDateString()}`, 14, 65);
  doc.text(`Campus: ${data.campus_name}`, 14, 70);

  // Items Table
  const tableData = data.items.map((item) => [
    item.product_title,
    item.quantity.toString(),
    `PKR ${item.unit_price.toFixed(2)}`,
    `PKR ${item.total_price.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 80,
    head: [["Product", "Quantity", "Unit Price", "Total"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Calculate Y position after table
  const finalY = (doc as any).lastAutoTable.finalY || 80;

  // Totals
  doc.text(`Subtotal: PKR ${data.subtotal.toFixed(2)}`, 140, finalY + 10);
  doc.text(
    `Discount (${data.discount_percentage}%): PKR ${data.discount_amount.toFixed(2)}`,
    140,
    finalY + 15
  );
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text(`Total: PKR ${data.total_amount.toFixed(2)}`, 140, finalY + 22);

  // Footer
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text("Thank you for your business!", 14, doc.internal.pageSize.height - 10);

  // Save PDF
  doc.save(`invoice_${data.invoice_number}.pdf`);
};

export const generatePurchaseOrderPDF = (data: PurchaseOrderData) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text(data.company_name || "Book Inventory System", 14, 20);
  doc.setFontSize(10);
  doc.text(data.warehouse_address || "", 14, 27);

  // PO Title
  doc.setFontSize(16);
  doc.text("PURCHASE ORDER", 14, 45);

  // PO Details
  doc.setFontSize(10);
  doc.text(`PO #: ${data.po_number}`, 14, 55);
  doc.text(`Date: ${new Date(data.order_date).toLocaleDateString()}`, 14, 60);
  doc.text(`Supplier: ${data.supplier_name}`, 14, 65);

  // Items Table
  const tableData = data.items.map((item) => [
    item.product_title,
    item.quantity.toString(),
    `PKR ${item.unit_cost.toFixed(2)}`,
    `PKR ${item.total_cost.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 75,
    head: [["Product", "Quantity", "Unit Cost", "Total"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [34, 197, 94] },
  });

  // Calculate Y position after table
  const finalY = (doc as any).lastAutoTable.finalY || 75;

  // Total
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text(`Total Amount: PKR ${data.total_amount.toFixed(2)}`, 140, finalY + 10);

  // Footer
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text("Please confirm receipt of this order.", 14, doc.internal.pageSize.height - 10);

  // Save PDF
  doc.save(`purchase_order_${data.po_number}.pdf`);
};
