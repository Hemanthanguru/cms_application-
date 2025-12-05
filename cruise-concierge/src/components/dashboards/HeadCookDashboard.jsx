import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManageOrders from "@/components/staff/ManageOrders";
import ManageItems from "@/components/admin/ManageItems";
import { ChefHat } from "lucide-react";

const HeadCookDashboard = () => {
    return (
        <div className="p-6 lg:p-8 space-y-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <ChefHat className="h-8 w-8 text-secondary" />
                    <h1 className="text-3xl font-bold font-serif">Head Cook Dashboard</h1>
                </div>
                <p className="text-muted-foreground">Manage catering orders and menu items</p>
            </div>

            <Tabs defaultValue="orders" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="orders">Active Orders</TabsTrigger>
                    <TabsTrigger value="menu">Manage Menu</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-4">
                    <ManageOrders type="catering" />
                </TabsContent>

                <TabsContent value="menu" className="space-y-4">
                    <ManageItems type="catering" />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default HeadCookDashboard;
