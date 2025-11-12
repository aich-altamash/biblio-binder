import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

const Purchasing = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Purchasing</h1>
        <p className="text-muted-foreground">Manage purchase orders and inventory receiving</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Purchase order management coming soon. You'll be able to create POs, track deliveries, and receive inventory.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Purchasing;
