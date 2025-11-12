export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.error("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values with commas or quotes
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        })
        .join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Specific exporters for different report types
export const exportInventoryReport = (data: any[]) => {
  const formattedData = data.map((item) => ({
    Product: item.product_title,
    "Total Quantity": item.total_quantity,
    Batches: item.batches_count,
    "Total Value (PKR)": item.total_value.toFixed(2),
  }));

  exportToCSV(formattedData, "inventory_report");
};

export const exportSupplierReport = (data: any[]) => {
  const formattedData = data.map((item) => ({
    Supplier: item.supplier_name,
    "Total Orders": item.total_orders,
    "Pending Orders": item.pending_orders,
    "Total Spent (PKR)": item.total_spent.toFixed(2),
  }));

  exportToCSV(formattedData, "supplier_report");
};

export const exportCampusReport = (data: any[]) => {
  const formattedData = data.map((item) => ({
    Campus: item.campus_name,
    Invoices: item.total_invoices,
    "Total Sales (PKR)": item.total_sales.toFixed(2),
    "Total Profit (PKR)": item.total_profit.toFixed(2),
    "Pending Amount (PKR)": item.pending_amount.toFixed(2),
  }));

  exportToCSV(formattedData, "campus_sales_report");
};
