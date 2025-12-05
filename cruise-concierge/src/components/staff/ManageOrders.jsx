import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Clock, Truck, X, Calendar, User, Package } from "lucide-react";
import { format } from "date-fns";

const ManageOrders = ({ type }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();

        const channel = supabase
            .channel(type ? `orders-${type}-changes` : 'all-orders-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: type ? `type=eq.${type}` : undefined
            }, (payload) => {
                console.log('Real-time order update received:', payload);
                // Refetching is safer to ensure we have the latest joined data (if we add joins later) and consistent state
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [type]);

    const fetchOrders = async () => {
        try {
            let query = supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (type) {
                query = query.eq('type', type);
            }

            const { data, error } = await query;

            if (error) throw error;
            setOrders(data);
        } catch (error) {
            toast.error("Error fetching orders: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            // Optimistic update
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

            const updates = { status };
            if (status === 'approved') {
                updates.approved_at = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from('orders')
                .update(updates)
                .eq('id', id)
                .select(); // Return updated data

            if (error) {
                // Revert optimistic update if error
                fetchOrders();
                throw error;
            }

            // Update with server data to be precise
            if (data && data.length > 0) {
                setOrders(prev => prev.map(o => o.id === id ? data[0] : o));
            }

            toast.success(`Order marked as ${status}`);
        } catch (error) {
            toast.error("Error updating order: " + error.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-blue-500/10 text-blue-500';
            case 'preparing': return 'bg-yellow-500/10 text-yellow-500';
            case 'delivered': return 'bg-green-500/10 text-green-500';
            case 'cancelled': return 'bg-red-500/10 text-red-500';
            case 'completed': return 'bg-green-500/20 text-green-600';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'approved' || o.status === 'preparing');
    const deliveredOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered');

    return (
        <div className="space-y-8">
            {/* Active / Freshly Ordered Section */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Clock className="h-6 w-6 text-blue-500" />
                    Freshly Ordered & Approved
                </h2>
                <div className="grid gap-4">
                    {activeOrders.length === 0 && !loading && (
                        <p className="text-muted-foreground">No active orders.</p>
                    )}
                    {activeOrders.map((order) => (
                        <Card key={order.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize">
                                            {order.type} Order
                                        </Badge>
                                        <Badge className={getStatusColor(order.status)} variant="secondary">
                                            {order.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {format(new Date(order.created_at), "PPP")}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {format(new Date(order.created_at), "p")}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="h-4 w-4" />
                                            {order.user_id.slice(0, 8)}...
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        {order.items?.map((item, index) => (
                                            <div key={index} className="text-sm">
                                                {item.quantity}x {item.name}
                                            </div>
                                        ))}
                                        <p className="font-bold mt-1">Total: ${order.total_amount}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {order.status === 'pending' && (
                                        <>
                                            <Button size="sm" variant="outline" className="text-green-500 hover:text-green-600 hover:bg-green-50" onClick={() => updateStatus(order.id, 'approved')}>
                                                <Check className="h-4 w-4 mr-1" /> Approve
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => updateStatus(order.id, 'cancelled')}>
                                                <X className="h-4 w-4 mr-1" /> Cancel
                                            </Button>
                                        </>
                                    )}
                                    {order.status === 'approved' && (
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(order.id, 'completed')}>
                                            <Package className="h-4 w-4 mr-1" /> Mark Delivered
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Delivered Section */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-muted-foreground">
                    <Package className="h-6 w-6" />
                    Delivered History
                </h2>
                <div className="grid gap-4 opacity-80">
                    {deliveredOrders.length === 0 && !loading && (
                        <p className="text-muted-foreground">No delivered orders yet.</p>
                    )}
                    {deliveredOrders.map((order) => (
                        <Card key={order.id} className="bg-secondary/10">
                            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize">
                                            {order.type} Order
                                        </Badge>
                                        <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30" variant="secondary">
                                            Delivered
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                        <span>{format(new Date(order.created_at), "MMM dd, HH:mm")}</span>
                                        <span>Total: ${order.total_amount}</span>
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        {order.items?.map((item, index) => (
                                            <span key={index} className="mr-2">{item.quantity}x {item.name}</span>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManageOrders;
