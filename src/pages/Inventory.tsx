import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Package, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface Batch {
  id: string;
  batch_number: string;
  quantity: number;
  cost_price: number;
  received_date: string;
  expiry_date: string | null;
  products: {
    title: string;
    sku: string | null;
    reorder_level: number;
  } | null;
  suppliers: {
    name: string;
  } | null;
}

const Inventory = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from("batches")
        .select("*, products(title, sku, reorder_level), suppliers(name)")
        .order("received_date", { ascending: false });

      if (error) throw error;
      setBatches(data || []);
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

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiry = new Date(expiryDate);
    return expiry < thirtyDaysFromNow && expiry > new Date();
  };

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity === 0) return <Badge variant="outline" className="bg-destructive/10">Out of Stock</Badge>;
    if (quantity <= reorderLevel) return <Badge variant="outline" className="bg-warning/10">Low Stock</Badge>;
    return <Badge variant="outline" className="bg-success/10">In Stock</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">Track inventory batches and stock levels</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Inventory Batches</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No inventory batches found. Create a purchase order to add inventory.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">
                      {batch.products?.title}
                      {batch.products?.sku && (
                        <span className="text-muted-foreground text-sm ml-2">
                          ({batch.products.sku})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{batch.batch_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {batch.quantity}
                        {batch.quantity === 0 && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>PKR {batch.cost_price.toFixed(2)}</TableCell>
                    <TableCell>PKR {(batch.quantity * batch.cost_price).toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(batch.received_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      {batch.expiry_date ? (
                        <div className="flex items-center gap-2">
                          {format(new Date(batch.expiry_date), "MMM dd, yyyy")}
                          {isExpired(batch.expiry_date) && (
                            <Badge variant="outline" className="bg-destructive/10">
                              Expired
                            </Badge>
                          )}
                          {isExpiringSoon(batch.expiry_date) && (
                            <Badge variant="outline" className="bg-warning/10">
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{batch.suppliers?.name || "-"}</TableCell>
                    <TableCell>
                      {getStockStatus(batch.quantity, batch.products?.reorder_level || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
