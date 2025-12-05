import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Calendar, Clock, User, Package } from "lucide-react";

const ManageBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();

        // Real-time subscription for bookings
        const channel = supabase
            .channel('bookings-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    // For inserts, we might need to fetch the user details, so simpler to just refetch or optimistically add
                    fetchBookings();
                } else if (payload.eventType === 'UPDATE') {
                    setBookings((prev) => prev.map(b => b.id === payload.new.id ? { ...b, ...payload.new } : b));
                } else if (payload.eventType === 'DELETE') {
                    setBookings((prev) => prev.filter(b => b.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchBookings = async () => {
        try {
            // We join with profiles/users if possible, but since user_roles is separate, we might need a join or just show user_id
            // For now, let's just show the booking details.
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBookings(data);
        } catch (error) {
            toast.error("Error fetching bookings: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const updates = { status };
            if (status === 'confirmed') {
                updates.approved_at = new Date().toISOString();
            } else if (status === 'completed') {
                updates.completed_at = new Date().toISOString(); // Optional: track completion time
            }

            const { error } = await supabase
                .from('bookings')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            toast.success(`Booking ${status} successfully`);
        } catch (error) {
            toast.error("Error updating booking: " + error.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
            case 'completed': return 'bg-green-500/20 text-green-600 hover:bg-green-500/30';
            default: return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
        }
    };

    const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
    const deliveredBookings = bookings.filter(b => b.status === 'completed');

    return (
        <div className="space-y-8">
            {/* Active / Freshly Ordered Section */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Clock className="h-6 w-6 text-blue-500" />
                    Freshly Ordered & Approved
                </h2>
                <div className="grid gap-4">
                    {activeBookings.length === 0 && !loading && (
                        <p className="text-muted-foreground">No active bookings.</p>
                    )}
                    {activeBookings.map((booking) => (
                        <Card key={booking.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize">
                                            {booking.booking_type?.replace('_', ' ') || 'Booking'}
                                        </Badge>
                                        <Badge className={getStatusColor(booking.status)} variant="secondary">
                                            {booking.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {booking.booking_date}
                                        </div>
                                        {booking.start_time && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {booking.start_time}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <User className="h-4 w-4" />
                                            {booking.user_id.slice(0, 8)}...
                                        </div>
                                    </div>
                                    <div className="mt-2 text-sm">
                                        Details: {JSON.stringify(booking.details)}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {booking.status === 'pending' && (
                                        <>
                                            <Button size="sm" variant="outline" className="text-green-500 hover:text-green-600 hover:bg-green-50" onClick={() => updateStatus(booking.id, 'confirmed')}>
                                                <Check className="h-4 w-4 mr-1" /> Confirm
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => updateStatus(booking.id, 'cancelled')}>
                                                <X className="h-4 w-4 mr-1" /> Cancel
                                            </Button>
                                        </>
                                    )}
                                    {booking.status === 'confirmed' && (
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(booking.id, 'completed')}>
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
                    {deliveredBookings.length === 0 && !loading && (
                        <p className="text-muted-foreground">No delivered bookings yet.</p>
                    )}
                    {deliveredBookings.map((booking) => (
                        <Card key={booking.id} className="bg-secondary/10">
                            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize">
                                            {booking.booking_type?.replace('_', ' ') || 'Booking'}
                                        </Badge>
                                        <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30" variant="secondary">
                                            Delivered
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                        <span>{booking.booking_date}</span>
                                        {booking.total_amount && <span>Total: ${booking.total_amount}</span>}
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        Details: {JSON.stringify(booking.details)}
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

export default ManageBookings;
