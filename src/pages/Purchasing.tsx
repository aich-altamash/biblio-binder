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
import { Plus, Eye, CheckCircle, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PurchaseOrder {
  id: string;
  po_number: string;
  order_date: string;
  expected_delivery: string | null;
  status: string;
  total_amount: number | null;
  suppliers: { name: string } | null;
  notes: string | null;
}

interface Product {
  id: string;
  title: string;
  sku: string | null;
}

interface Supplier {
  id: string;
  name: string;
}

interface PurchaseItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

const Purchasing = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [poItems, setPoItems] = useState<PurchaseItem[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    supplier_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_delivery: "",
    notes: "",
  });

  const [items, setItems] = useState<PurchaseItem[]>([
    { product_id: "", quantity: 1, unit_price: 0, total_price: 0 },
  ]);

  const [receiveData, setReceiveData] = useState({
    batch_number: "",
    expiry_date: "",
  });

  useEffect(() => {
    fetchPurchaseOrders();
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, suppliers(name)")
        .order("order_date", { ascending: false });

      if (error) throw error;
      setPurchaseOrders(data || []);
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

  const fetchSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("id, name").order("name");
    setSuppliers(data || []);
  };

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "unit_price") {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }

    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0 || items.some((item) => !item.product_id)) {
      toast({
        title: "Error",
        description: "Please add at least one product",
        variant: "destructive",
      });
      return;
    }

    try {
      const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
      const poNumber = `PO-${Date.now()}`;

      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          po_number: poNumber,
          supplier_id: formData.supplier_id,
          order_date: formData.order_date,
          expected_delivery: formData.expected_delivery || null,
          notes: formData.notes || null,
          status: "pending",
          total_amount: totalAmount,
        })
        .select()
        .single();

      if (poError) throw poError;

      const purchaseItems = items.map((item) => ({
        purchase_order_id: po.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase.from("purchase_items").insert(purchaseItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });

      setDialogOpen(false);
      resetForm();
      fetchPurchaseOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReceivePO = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPO) return;

    try {
      const { data: purchaseItems, error: itemsError } = await supabase
        .from("purchase_items")
        .select("*, products(title)")
        .eq("purchase_order_id", selectedPO.id);

      if (itemsError) throw itemsError;

      for (const item of purchaseItems) {
        const { error: batchError } = await supabase.from("batches").insert({
          product_id: item.product_id,
          batch_number: receiveData.batch_number,
          quantity: item.quantity,
          cost_price: item.unit_price,
          received_date: new Date().toISOString().split("T")[0],
          expiry_date: receiveData.expiry_date || null,
          supplier_id: selectedPO.suppliers ? null : null,
        });

        if (batchError) throw batchError;

        const { error: logError } = await supabase.from("inventory_logs").insert({
          product_id: item.product_id,
          quantity: item.quantity,
          type: "stock_in",
          reference_type: "purchase_order",
          reference_id: selectedPO.id,
          notes: `Received from PO ${selectedPO.po_number}`,
        });

        if (logError) throw logError;
      }

      const { error: updateError } = await supabase
        .from("purchase_orders")
        .update({
          status: "received",
          received_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", selectedPO.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Purchase order received and inventory updated",
      });

      setReceiveDialogOpen(false);
      setSelectedPO(null);
      setReceiveData({ batch_number: "", expiry_date: "" });
      fetchPurchaseOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const viewPOItems = async (po: PurchaseOrder) => {
    try {
      const { data, error } = await supabase
        .from("purchase_items")
        .select("*, products(title, sku)")
        .eq("purchase_order_id", po.id);

      if (error) throw error;

      setPoItems(data || []);
      setSelectedPO(po);
      setViewDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery: "",
      notes: "",
    });
    setItems([{ product_id: "", quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "received":
        return <Badge className="bg-success">Received</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchasing</h1>
          <p className="text-muted-foreground">Manage purchase orders and inventory receiving</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order_date">Order Date *</Label>
                  <Input
                    id="order_date"
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_delivery">Expected Delivery</Label>
                <Input
                  id="expected_delivery"
                  type="date"
                  value={formData.expected_delivery}
                  onChange={(e) =>
                    setFormData({ ...formData, expected_delivery: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
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
                    <CardContent className="pt-6">
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="md:col-span-2 space-y-2">
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
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Total: PKR {item.total_price.toFixed(2)}
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

                <div className="text-right">
                  <div className="text-lg font-semibold">
                    Total Amount: PKR{" "}
                    {items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Purchase Order</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : purchaseOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No purchase orders found. Create your first purchase order to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.po_number}</TableCell>
                    <TableCell>{po.suppliers?.name || "-"}</TableCell>
                    <TableCell>{format(new Date(po.order_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      {po.expected_delivery
                        ? format(new Date(po.expected_delivery), "MMM dd, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>PKR {po.total_amount?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => viewPOItems(po)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {po.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPO(po);
                              setReceiveDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 text-success" />
                          </Button>
                        )}
                      </div>
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
            <DialogTitle>Purchase Order Details - {selectedPO?.po_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Supplier</Label>
                <p className="font-medium">{selectedPO?.suppliers?.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Order Date</Label>
                <p className="font-medium">
                  {selectedPO && format(new Date(selectedPO.order_date), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
            {selectedPO?.notes && (
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <p className="font-medium">{selectedPO.notes}</p>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.product?.title}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>PKR {item.unit_price.toFixed(2)}</TableCell>
                    <TableCell>PKR {item.total_price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive Purchase Order - {selectedPO?.po_number}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReceivePO} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch_number">Batch Number *</Label>
              <Input
                id="batch_number"
                value={receiveData.batch_number}
                onChange={(e) =>
                  setReceiveData({ ...receiveData, batch_number: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
              <Input
                id="expiry_date"
                type="date"
                value={receiveData.expiry_date}
                onChange={(e) =>
                  setReceiveData({ ...receiveData, expiry_date: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReceiveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Receive Order</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Purchasing;
