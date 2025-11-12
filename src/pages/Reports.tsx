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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Package, Users, Building2, DollarSign, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  exportInventoryReport,
  exportSupplierReport,
  exportCampusReport,
} from "@/utils/csvExporter";

interface InventoryReport {
  product_title: string;
  total_quantity: number;
  total_value: number;
  batches_count: number;
}

interface SupplierReport {
  supplier_name: string;
  total_orders: number;
  total_spent: number;
  pending_orders: number;
}

interface CampusReport {
  campus_name: string;
  total_invoices: number;
  total_sales: number;
  total_profit: number;
  pending_amount: number;
}

interface ProfitLoss {
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  margin_percentage: number;
}

const Reports = () => {
  const [inventoryReport, setInventoryReport] = useState<InventoryReport[]>([]);
  const [supplierReport, setSupplierReport] = useState<SupplierReport[]>([]);
  const [campusReport, setCampusReport] = useState<CampusReport[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLoss | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      await Promise.all([
        fetchInventoryReport(),
        fetchSupplierReport(),
        fetchCampusReport(),
        fetchProfitLoss(),
      ]);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryReport = async () => {
    const { data: products } = await supabase.from("products").select("id, title");

    if (!products) return;

    const report: InventoryReport[] = [];

    for (const product of products) {
      const { data: batches } = await supabase
        .from("batches")
        .select("quantity, cost_price")
        .eq("product_id", product.id);

      if (batches && batches.length > 0) {
        const totalQuantity = batches.reduce((sum, b) => sum + b.quantity, 0);
        const totalValue = batches.reduce((sum, b) => sum + b.quantity * Number(b.cost_price), 0);

        report.push({
          product_title: product.title,
          total_quantity: totalQuantity,
          total_value: totalValue,
          batches_count: batches.length,
        });
      }
    }

    setInventoryReport(report.sort((a, b) => b.total_value - a.total_value));
  };

  const fetchSupplierReport = async () => {
    const { data: suppliers } = await supabase.from("suppliers").select("id, name");

    if (!suppliers) return;

    const report: SupplierReport[] = [];

    for (const supplier of suppliers) {
      const { data: orders } = await supabase
        .from("purchase_orders")
        .select("status, total_amount")
        .eq("supplier_id", supplier.id);

      if (orders) {
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        const pendingOrders = orders.filter((o) => o.status === "pending").length;

        report.push({
          supplier_name: supplier.name,
          total_orders: totalOrders,
          total_spent: totalSpent,
          pending_orders: pendingOrders,
        });
      }
    }

    setSupplierReport(report.sort((a, b) => b.total_spent - a.total_spent));
  };

  const fetchCampusReport = async () => {
    const { data: campuses } = await supabase.from("campuses").select("id, name");

    if (!campuses) return;

    const report: CampusReport[] = [];

    for (const campus of campuses) {
      const { data: invoices } = await supabase
        .from("sales_invoices")
        .select("total_amount, paid_amount")
        .eq("campus_id", campus.id);

      const { data: items } = await supabase
        .from("sales_items")
        .select("profit, sales_invoices!inner(campus_id)")
        .eq("sales_invoices.campus_id", campus.id);

      if (invoices) {
        const totalInvoices = invoices.length;
        const totalSales = invoices.reduce((sum, i) => sum + Number(i.total_amount), 0);
        const totalPaid = invoices.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0);
        const totalProfit = items?.reduce((sum, i) => sum + Number(i.profit), 0) || 0;

        report.push({
          campus_name: campus.name,
          total_invoices: totalInvoices,
          total_sales: totalSales,
          total_profit: totalProfit,
          pending_amount: totalSales - totalPaid,
        });
      }
    }

    setCampusReport(report.sort((a, b) => b.total_sales - a.total_sales));
  };

  const fetchProfitLoss = async () => {
    const { data: salesItems } = await supabase.from("sales_items").select("total_price, profit");

    if (salesItems) {
      const totalRevenue = salesItems.reduce((sum, i) => sum + Number(i.total_price), 0);
      const totalProfit = salesItems.reduce((sum, i) => sum + Number(i.profit), 0);
      const totalCost = totalRevenue - totalProfit;
      const marginPercentage = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      setProfitLoss({
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_profit: totalProfit,
        margin_percentage: marginPercentage,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Comprehensive reports and business insights</p>
      </div>

      {profitLoss && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {profitLoss.total_revenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {profitLoss.total_cost.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                PKR {profitLoss.total_profit.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {profitLoss.margin_percentage.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            <Users className="h-4 w-4 mr-2" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="campuses">
            <Building2 className="h-4 w-4 mr-2" />
            Campuses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inventory Valuation Report</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportInventoryReport(inventoryReport)}
                disabled={inventoryReport.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : inventoryReport.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No inventory data available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Total Quantity</TableHead>
                      <TableHead>Batches</TableHead>
                      <TableHead>Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryReport.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.product_title}</TableCell>
                        <TableCell>{item.total_quantity}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.batches_count}</Badge>
                        </TableCell>
                        <TableCell>PKR {item.total_value.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell colSpan={3}>Total Inventory Value</TableCell>
                      <TableCell>
                        PKR{" "}
                        {inventoryReport
                          .reduce((sum, item) => sum + item.total_value, 0)
                          .toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Supplier Performance Report</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportSupplierReport(supplierReport)}
                disabled={supplierReport.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : supplierReport.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No supplier data available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>Pending Orders</TableHead>
                      <TableHead>Total Spent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierReport.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.supplier_name}</TableCell>
                        <TableCell>{item.total_orders}</TableCell>
                        <TableCell>
                          {item.pending_orders > 0 ? (
                            <Badge variant="outline">{item.pending_orders}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>PKR {item.total_spent.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell colSpan={3}>Total Procurement Spend</TableCell>
                      <TableCell>
                        PKR{" "}
                        {supplierReport
                          .reduce((sum, item) => sum + item.total_spent, 0)
                          .toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campuses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Campus Sales Report</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCampusReport(campusReport)}
                disabled={campusReport.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : campusReport.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No campus data available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campus</TableHead>
                      <TableHead>Invoices</TableHead>
                      <TableHead>Total Sales</TableHead>
                      <TableHead>Total Profit</TableHead>
                      <TableHead>Pending Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campusReport.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.campus_name}</TableCell>
                        <TableCell>{item.total_invoices}</TableCell>
                        <TableCell>PKR {item.total_sales.toFixed(2)}</TableCell>
                        <TableCell className="text-success">
                          PKR {item.total_profit.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {item.pending_amount > 0 ? (
                            <span className="text-warning">
                              PKR {item.pending_amount.toFixed(2)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell colSpan={2}>Totals</TableCell>
                      <TableCell>
                        PKR {campusReport.reduce((sum, item) => sum + item.total_sales, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-success">
                        PKR{" "}
                        {campusReport.reduce((sum, item) => sum + item.total_profit, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-warning">
                        PKR{" "}
                        {campusReport
                          .reduce((sum, item) => sum + item.pending_amount, 0)
                          .toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
