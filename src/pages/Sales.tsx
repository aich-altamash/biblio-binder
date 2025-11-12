import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Eye, Trash2, DollarSign, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface SalesInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  campus_id: string;
  subtotal: number;
  discount_percentage: number | null;
  discount_amount: number | null;
  total_amount: number;
  paid_amount: number | null;
  status: string;
  campuses: { name: string } | null;
}

interface Product {
  id: string;
  title: string;
  sku: string | null;
}

interface Campus {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  batch_number: string;
  quantity: number;
  cost_price: number;
  product_id: string;
}

interface SalesItem {
  product_id: string;
  batch_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  total_price: number;
  profit: number;
  product?: Product;
}

const Sales = () => {
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [batches, setBatches] = useState<Record<string, Batch[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<SalesItem[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    campus_id: "",
    invoice_date: new Date().toISOString().split("T")[0],
    discount_percentage: 0,
    notes: "",
    paid_amount: 0,
  });

  const [items, setItems] = useState<SalesItem[]>([
    {
      product_id: "",
      batch_id: "",
      quantity: 1,
      unit_price: 0,
      unit_cost: 0,
      total_price: 0,
      profit: 0,
    },
  ]);

  useEffect(() => {
    fetchSalesInvoices();
    fetchProducts();
    fetchCampuses();
  }, []);

  const fetchSalesInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("sales_invoices")
        .select("*, campuses(name)")
        .order("invoice_date", { ascending: false });

      if (error) throw error;
      setSalesInvoices(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("id, title, sku").order("title");
    setProducts(data || []);
  };

  const fetchCampuses = async () => {
    const { data } = await supabase.from("campuses").select("id, name").order("name");
    setCampuses(data || []);
  };

  const fetchBatchesForProduct = async (productId: string) => {
    const { data } = await supabase
      .from("batches")
      .select("*")
      .eq("product_id", productId)
      .gt("quantity", 0)
      .order("received_date");

    if (data) {
      setBatches((prev) => ({ ...prev, [productId]: data }));
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        product_id: "",
        batch_id: "",
        quantity: 1,
        unit_price: 0,
        unit_cost: 0,
        total_price: 0,
        profit: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = async (index: number, field: keyof SalesItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "product_id" && value) {
      await fetchBatchesForProduct(value);
      newItems[index].batch_id = "";
      newItems[index].unit_cost = 0;
    }

    if (field === "batch_id" && value) {
      const productBatches = batches[newItems[index].product_id];
      const selectedBatch = productBatches?.find((b) => b.id === value);
      if (selectedBatch) {
        newItems[index].unit_cost = selectedBatch.cost_price;
      }
    }

    if (field === "quantity" || field === "unit_price" || field === "batch_id") {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
      newItems[index].profit =
        (newItems[index].unit_price - newItems[index].unit_cost) * newItems[index].quantity;
    }

    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0 || items.some((item) => !item.product_id || !item.batch_id)) {
      toast({
        title: "Error",
        description: "Please add at least one product with batch",
        variant: "destructive",
      });
      return;
    }

    try {
      const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
      const discountAmount = (subtotal * formData.discount_percentage) / 100;
      const totalAmount = subtotal - discountAmount;
      const invoiceNumber = `INV-${Date.now()}`;

      const { data: invoice, error: invoiceError } = await supabase
        .from("sales_invoices")
        .insert({
          invoice_number: invoiceNumber,
          campus_id: formData.campus_id,
          invoice_date: formData.invoice_date,
          subtotal,
          discount_percentage: formData.discount_percentage,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          paid_amount: formData.paid_amount,
          status: formData.paid_amount >= totalAmount ? "paid" : "pending",
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const salesItems = items.map((item) => ({
        sales_invoice_id: invoice.id,
        product_id: item.product_id,
        batch_id: item.batch_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost,
        total_price: item.total_price,
        profit: item.profit,
      }));

      const { error: itemsError } = await supabase.from("sales_items").insert(salesItems);

      if (itemsError) throw itemsError;

      for (const item of items) {
        // Update batch quantity
        const { data: currentBatch } = await supabase
          .from("batches")
          .select("quantity")
          .eq("id", item.batch_id)
          .single();

        if (currentBatch) {
          const { error: batchError } = await supabase
            .from("batches")
            .update({ quantity: currentBatch.quantity - item.quantity })
            .eq("id", item.batch_id);

          if (batchError) throw batchError;
        }

        // Log inventory movement
        const { error: logError } = await supabase.from("inventory_logs").insert({
          product_id: item.product_id,
          batch_id: item.batch_id,
          quantity: -item.quantity,
          type: "stock_out",
          reference_type: "sales_invoice",
          reference_id: invoice.id,
          notes: `Sold to ${campuses.find((c) => c.id === formData.campus_id)?.name}`,
        });

        if (logError) console.error("Log error:", logError);
      }

      toast({
        title: "Success",
        description: "Sales invoice created successfully",
      });

      setDialogOpen(false);
      resetForm();
      fetchSalesInvoices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const viewInvoiceItems = async (invoice: SalesInvoice) => {
    try {
      const { data, error } = await supabase
        .from("sales_items")
        .select("*, products(title, sku)")
        .eq("sales_invoice_id", invoice.id);

      if (error) throw error;

      setInvoiceItems(data || []);
      setSelectedInvoice(invoice);
      setViewDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedInvoice) return;

    try {
      // Fetch settings for company info
      const { data: settings } = await supabase
        .from("system_settings" as any)
        .select("*")
        .single();

      const settingsData = settings as any;

      const pdfData = {
        invoice_number: selectedInvoice.invoice_number,
        invoice_date: selectedInvoice.invoice_date,
        campus_name: selectedInvoice.campuses?.name || "",
        items: invoiceItems.map((item) => ({
          product_title: item.product?.title || "",
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
        subtotal: selectedInvoice.subtotal,
        discount_percentage: selectedInvoice.discount_percentage || 0,
        discount_amount: selectedInvoice.discount_amount || 0,
        total_amount: selectedInvoice.total_amount,
        company_name: settingsData?.company_name || "",
        company_address: settingsData?.company_address || "",
        company_phone: settingsData?.company_phone || "",
        company_email: settingsData?.company_email || "",
      };

      generateInvoicePDF(pdfData);

      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      campus_id: "",
      invoice_date: new Date().toISOString().split("T")[0],
      discount_percentage: 0,
      notes: "",
      paid_amount: 0,
    });
    setItems([
      {
        product_id: "",
        batch_id: "",
        quantity: 1,
        unit_price: 0,
        unit_cost: 0,
        total_price: 0,
        profit: 0,
      },
    ]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success">Paid</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "partial":
        return <Badge className="bg-warning">Partial</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const calculateSubtotal = () => items.reduce((sum, item) => sum + item.total_price, 0);
  const calculateDiscount = () => (calculateSubtotal() * formData.discount_percentage) / 100;
  const calculateTotal = () => calculateSubtotal() - calculateDiscount();
  const calculateTotalProfit = () => items.reduce((sum, item) => sum + item.profit, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground">Manage sales invoices and campus orders</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Sales Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="campus">Campus *</Label>
                  <Select
                    value={formData.campus_id}
                    onValueChange={(value) => setFormData({ ...formData, campus_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {campuses.map((campus) => (
                        <SelectItem key={campus.id} value={campus.id}>
                          {campus.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice_date">Invoice Date *</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {items.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Product *</Label>
                          <Select
                            value={item.product_id}
                            onValueChange={(value) => updateItem(index, "product_id", value)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.title} {product.sku ? `(${product.sku})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Batch *</Label>
                          <Select
                            value={item.batch_id}
                            onValueChange={(value) => updateItem(index, "batch_id", value)}
                            required
                            disabled={!item.product_id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                            <SelectContent>
                              {batches[item.product_id]?.map((batch) => (
                                <SelectItem key={batch.id} value={batch.id}>
                                  {batch.batch_number} (Qty: {batch.quantity}, Cost: PKR{" "}
                                  {batch.cost_price.toFixed(2)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", parseInt(e.target.value) || 0)
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unit Price (PKR) *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unit Cost (PKR)</Label>
                          <Input type="number" value={item.unit_cost.toFixed(2)} disabled />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">
                            Total: PKR {item.total_price.toFixed(2)}
                          </div>
                          <div
                            className={`text-sm ${
                              item.profit >= 0 ? "text-success" : "text-destructive"
                            }`}
                          >
                            Profit: PKR {item.profit.toFixed(2)} (
                            {item.unit_price > 0
                              ? (
                                  ((item.unit_price - item.unit_cost) / item.unit_price) *
                                  100
                                ).toFixed(1)
                              : 0}
                            %)
                          </div>
                        </div>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discount_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_percentage: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paid_amount">Paid Amount (PKR)</Label>
                  <Input
                    id="paid_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.paid_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>PKR {calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discount ({formData.discount_percentage}%):</span>
                  <span>- PKR {calculateDiscount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>PKR {calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-success">
                  <span>Expected Profit:</span>
                  <span>PKR {calculateTotalProfit().toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Invoice</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : salesInvoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No sales invoices found. Create your first invoice to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.campuses?.name || "-"}</TableCell>
                    <TableCell>{format(new Date(invoice.invoice_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>PKR {invoice.total_amount.toFixed(2)}</TableCell>
                    <TableCell>PKR {(invoice.paid_amount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      PKR {(invoice.total_amount - (invoice.paid_amount || 0)).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => viewInvoiceItems(invoice)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Invoice Details - {selectedInvoice?.invoice_number}</DialogTitle>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Campus</Label>
                <p className="font-medium">{selectedInvoice?.campuses?.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Invoice Date</Label>
                <p className="font-medium">
                  {selectedInvoice && format(new Date(selectedInvoice.invoice_date), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.product?.title}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>PKR {item.unit_price.toFixed(2)}</TableCell>
                    <TableCell>PKR {item.total_price.toFixed(2)}</TableCell>
                    <TableCell className="text-success">PKR {item.profit.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>PKR {selectedInvoice?.subtotal.toFixed(2)}</span>
              </div>
              {selectedInvoice?.discount_amount && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>- PKR {selectedInvoice.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>PKR {selectedInvoice?.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
