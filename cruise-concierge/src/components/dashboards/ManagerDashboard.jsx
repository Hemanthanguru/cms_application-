import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManageItems from "@/components/admin/ManageItems";
import ManageBookings from "@/components/admin/ManageBookings";
import ManageOrders from "@/components/staff/ManageOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users, Calendar, DollarSign } from "lucide-react";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ManagerDashboard = () => {
    const [stats, setStats] = useState({
        users: 0,
        activeBookings: 0,
        revenue: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch users count
                const { count: userCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                // Fetch bookings
                const { data: bookings } = await supabase
                    .from('bookings')
                    .select('status, total_amount');

                // Fetch orders
                const { data: orders } = await supabase
                    .from('orders')
                    .select('status, total_amount');

                const validOrderStatuses = ['approved', 'preparing', 'delivered', 'completed'];
                const validBookingStatuses = ['confirmed', 'completed'];
                const activeBookingStatuses = ['pending', 'confirmed'];

                const activeBookingsCount = bookings?.filter(b => activeBookingStatuses.includes(b.status)).length || 0;

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
                    activeBookings: activeBookingsCount,
                    revenue: orderRevenue + bookingRevenue
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();

        // Subscribe to changes
        const channels = [
            supabase.channel('mgr-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchStats),
            supabase.channel('mgr-bookings').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchStats),
            supabase.channel('mgr-profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
        ];

        channels.forEach(channel => channel.subscribe());

        return () => {
            channels.forEach(channel => supabase.removeChannel(channel));
        };
    }, []);

    return (
        <div className="p-6 lg:p-8 space-y-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <Eye className="h-8 w-8 text-secondary" />
                    <h1 className="text-3xl font-bold font-serif">Manager Dashboard</h1>
                </div>
                <p className="text-muted-foreground">Manage services, items, orders, and bookings.</p>
            </div>

            <Tabs defaultValue="orders" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-4">
                    <ManageOrders />
                </TabsContent>

                <TabsContent value="bookings" className="space-y-4">
                    <ManageBookings />
                </TabsContent>

                <TabsContent value="services" className="space-y-4">
                    <ManageItems />
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
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.activeBookings}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ManagerDashboard;
