import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const Sales = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales</h1>
        <p className="text-muted-foreground">Manage sales invoices and campus orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Sales management coming soon. You'll be able to create invoices, track payments, and manage campus orders.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;
