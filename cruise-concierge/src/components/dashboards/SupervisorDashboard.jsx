import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManageOrders from "@/components/staff/ManageOrders";
import ManageItems from "@/components/admin/ManageItems";
import { ClipboardList } from "lucide-react";

const SupervisorDashboard = () => {
    return (
        <div className="p-6 lg:p-8 space-y-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <ClipboardList className="h-8 w-8 text-secondary" />
                    <h1 className="text-3xl font-bold font-serif">Supervisor Dashboard</h1>
                </div>
                <p className="text-muted-foreground">Manage stationery orders and full inventory</p>
            </div>

            <Tabs defaultValue="orders" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="orders">Active Orders</TabsTrigger>
                    <TabsTrigger value="inventory">Manage Inventory</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-4">
                    <ManageOrders type="stationery" />
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4">
                    <ManageItems />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SupervisorDashboard;
