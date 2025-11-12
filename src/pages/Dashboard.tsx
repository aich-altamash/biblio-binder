import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, FileText, TrendingUp, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalProducts: number;
  totalInventoryValue: number;
  lowStockProducts: number;
  pendingOrders: number;
  totalSales: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalInventoryValue: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    totalSales: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Fetch total products
        const { count: productsCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true });

        // Fetch low stock products
        const { data: products } = await supabase
          .from("products")
          .select("id, reorder_level");

        let lowStockCount = 0;
        let totalValue = 0;

        if (products) {
          for (const product of products) {
            const { data: batches } = await supabase
              .from("batches")
              .select("quantity, cost_price")
              .eq("product_id", product.id);

            if (batches) {
              const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
              const batchValue = batches.reduce(
                (sum, batch) => sum + batch.quantity * Number(batch.cost_price),
                0
              );
              totalValue += batchValue;

              if (totalQuantity <= product.reorder_level) {
                lowStockCount++;
              }
            }
          }
        }

        // Fetch pending orders
        const { count: pendingOrdersCount } = await supabase
          .from("purchase_orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Fetch total sales
        const { data: salesInvoices } = await supabase
          .from("sales_invoices")
          .select("total_amount");

        const totalSalesValue = salesInvoices?.reduce(
          (sum, invoice) => sum + Number(invoice.total_amount),
          0
        ) || 0;

        setStats({
          totalProducts: productsCount || 0,
          totalInventoryValue: totalValue,
          lowStockProducts: lowStockCount,
          pendingOrders: pendingOrdersCount || 0,
          totalSales: totalSalesValue,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "text-primary",
    },
    {
      title: "Inventory Value",
      value: `PKR ${stats.totalInventoryValue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-success",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockProducts,
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: ShoppingCart,
      color: "text-blue-500",
    },
    {
      title: "Total Sales",
      value: `PKR ${stats.totalSales.toLocaleString()}`,
      icon: FileText,
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your inventory management system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{card.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Recent inventory movements and transactions will appear here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use the sidebar to navigate to different modules and manage your inventory.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
