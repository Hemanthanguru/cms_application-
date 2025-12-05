import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManageItems from "@/components/admin/ManageItems";
import ManageOrders from "@/components/staff/ManageOrders";
import ManageBookings from "@/components/admin/ManageBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingBag, DollarSign } from "lucide-react";

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        users: 0,
        orders: 0,
        revenue: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch users count
                const { count: userCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                // Fetch orders
                const { data: orders } = await supabase
                    .from('orders')
                    .select('total_amount, status');

                // Fetch bookings
                const { data: bookings } = await supabase
                    .from('bookings')
                    .select('total_amount, status');

                const validOrderStatuses = ['approved', 'preparing', 'delivered', 'completed'];
                const validBookingStatuses = ['confirmed', 'completed'];

                const orderRevenue = orders?.reduce((sum, order) => {
                    if (validOrderStatuses.includes(order.status)) {
                        return sum + (Number(order.total_amount) || 0);
                    }
                    return sum;
                }, 0) || 0;

                const bookingRevenue = bookings?.reduce((sum, booking) => {
                    if (validBookingStatuses.includes(booking.status)) {
                        return sum + (Number(booking.total_amount) || 0);
                    }
                    return sum;
                }, 0) || 0;

                setStats({
                    users: userCount || 0,
                    orders: orders?.length || 0,
                    revenue: orderRevenue + bookingRevenue
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();

        // Subscribe to changes for real-time updates
        const ordersChannel = supabase
            .channel('dashboard-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchStats())
            .subscribe();

        const bookingsChannel = supabase
            .channel('dashboard-bookings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchStats())
            .subscribe();

        return () => {
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(bookingsChannel);
        };
    }, []);

    return (
        <div className="p-6 lg:p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold text-primary">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">Manage cruise services, items, and bookings.</p>
            </div>

            <Tabs defaultValue="services" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="services">Services & Items</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                </TabsList>

                <TabsContent value="services" className="space-y-4">
                    <ManageItems />
                </TabsContent>

                <TabsContent value="orders" className="space-y-4">
                    <ManageOrders />
                </TabsContent>

                <TabsContent value="bookings" className="space-y-4">
                    <ManageBookings />
                </TabsContent>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.users}</div>
                                <p className="text-xs text-muted-foreground">
                                    Registered profiles
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.orders}</div>
                                <p className="text-xs text-muted-foreground">
                                    All time orders
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total earnings from orders
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminDashboard;
