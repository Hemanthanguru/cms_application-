import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
    Utensils,
    ShoppingBag,
    Film,
    Scissors,
    Dumbbell,
    PartyPopper,
    Waves,
    Clock,
    Package,
    Calendar
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { format } from "date-fns";

const VoyagerHome = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchOrders();

            // Real-time subscription for orders
            const orderChannel = supabase
                .channel('voyager-orders')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload) => {
                    if (payload.new.status === 'approved') {
                        toast.success("Order Approved! Wait for 15 minutes and collect it near the store.", {
                            duration: 8000, // Show for 8 seconds
                            action: {
                                label: "Dismiss",
                                onClick: () => console.log("Dismissed"),
                            },
                        });
                    }
                    fetchOrders();
                })
                .subscribe();

            // Real-time subscription for bookings
            const bookingChannel = supabase
                .channel('voyager-bookings')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `user_id=eq.${user.id}` }, (payload) => {
                    if (payload.new.status === 'confirmed') {
                        toast.success("Booking Confirmed! Please arrive in 15 minutes.", {
                            duration: 8000,
                        });
                    }
                    fetchOrders();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(orderChannel);
                supabase.removeChannel(bookingChannel);
            };
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (ordersError) throw ordersError;

            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (bookingsError) throw bookingsError;

            // Combine and sort
            const combined = [
                ...(ordersData || []).map(o => ({ ...o, type: 'order' })),
                ...(bookingsData || []).map(b => ({ ...b, type: 'booking' }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

            setOrders(combined);
        } catch (error) {
            console.error("Error fetching activity:", error);
        } finally {
            setLoading(false);
        }
    };

    const services = [
        {
            icon: Utensils,
            title: "Catering Services",
            description: "Order delicious meals, snacks, and beverages",
            href: "/dashboard/catering",
            color: "from-orange-500 to-red-500",
        },
        {
            icon: ShoppingBag,
            title: "Stationery Shop",
            description: "Browse gifts, chocolates, and souvenirs",
            href: "/dashboard/stationery",
            color: "from-purple-500 to-pink-500",
        },
        {
            icon: Film,
            title: "Resort Movies",
            description: "Book tickets for exclusive screenings",
            href: "/dashboard/movies",
            color: "from-blue-500 to-cyan-500",
        },
        {
            icon: Scissors,
            title: "Beauty Salon",
            description: "Premium spa and beauty treatments",
            href: "/dashboard/salon",
            color: "from-pink-500 to-rose-500",
        },
        {
            icon: Dumbbell,
            title: "Fitness Center",
            description: "State-of-the-art equipment and training",
            href: "/dashboard/fitness",
            color: "from-green-500 to-emerald-500",
        },
        {
            icon: PartyPopper,
            title: "Party Hall",
            description: "Celebrate special occasions at sea",
            href: "/dashboard/party-hall",
            color: "from-yellow-500 to-orange-500",
        },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-8">
            {/* Welcome Section */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <Waves className="h-8 w-8 text-secondary" />
                    <h1 className="text-3xl font-bold font-serif">
                        Welcome Aboard, {user?.user_metadata?.full_name?.split(' ')[0] || 'Voyager'}!
                    </h1>
                </div>
                <p className="text-muted-foreground">
                    Explore our premium services and make the most of your voyage
                </p>
            </div>

            {/* My Activity Section */}
            <Card className="border-secondary/20 bg-secondary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-secondary" />
                        Your Recent Activity
                    </CardTitle>
                    <CardDescription>
                        Track your current orders and bookings.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Loading activity...</div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No active orders or bookings. Start exploring services below!</div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-background rounded-lg border shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                            (item.status === 'approved' || item.status === 'confirmed') ? 'bg-blue-100 text-blue-600' :
                                                item.status === 'completed' ? 'bg-green-100 text-green-600' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {item.type === 'booking' ? <Calendar className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium capitalize">
                                                {item.type === 'booking' ?
                                                    ((item.booking_type || 'Service').replace(/_/g, ' ') + ' Booking') :
                                                    ((item.type || 'Order') + ' Order')
                                                }
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.type === 'booking' ?
                                                    (item.details?.item_name || 'Service Booking') :
                                                    (item.items && item.items[0] ? `${item.items[0].quantity}x ${item.items[0].name}` : 'Items')
                                                }
                                                {item.type !== 'booking' && item.items && item.items.length > 1 && ` +${item.items.length - 1} more`}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.created_at ? format(new Date(item.created_at), "MMM dd, HH:mm") : "Just now"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={
                                            item.status === 'pending' ? 'outline' :
                                                (item.status === 'approved' || item.status === 'confirmed') ? 'secondary' :
                                                    item.status === 'completed' ? 'default' : 'destructive'
                                        } className="mb-1 capitalize">
                                            {item.status || 'Unknown'}
                                        </Badge>
                                        <p className="font-bold">${item.total_amount || 0}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Services Grid */}
            <div>
                <h2 className="text-2xl font-bold font-serif mb-6">Our Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <Link key={service.href} to={service.href}>
                            <Card variant="elevated" className="h-full group cursor-pointer overflow-hidden">
                                <CardHeader className="relative">
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${service.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <service.icon className="h-7 w-7 text-primary-foreground" />
                                    </div>
                                    <CardTitle className="text-xl">{service.title}</CardTitle>
                                    <CardDescription>{service.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="ghost" className="p-0 h-auto font-semibold text-secondary hover:text-secondary/80">
                                        Explore →
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VoyagerHome;
