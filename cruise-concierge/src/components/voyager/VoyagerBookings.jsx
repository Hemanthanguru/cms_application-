import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth";

const VoyagerBookings = ({ category: propCategory }) => {
    const { category: paramCategory } = useParams();
    const category = propCategory || paramCategory;
    const navigate = useNavigate();
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [bookingDate, setBookingDate] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        fetchItems();

        // Real-time subscription for new services
        const channel = supabase
            .channel('public:items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `category=eq.${category}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setItems((prev) => [...prev, payload.new]);
                } else if (payload.eventType === 'DELETE') {
                    setItems((prev) => prev.filter(item => item.id !== payload.old.id));
                } else if (payload.eventType === 'UPDATE') {
                    setItems((prev) => prev.map(item => item.id === payload.new.id ? payload.new : item));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [category]);

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('category', category)
                .eq('available', true);

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            toast.error("Error fetching services: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if (!bookingDate) {
            toast.error("Please select a date");
            return;
        }

        try {
            const { error } = await supabase
                .from('bookings')
                .insert([{
                    user_id: user.id,
                    booking_type: category,
                    booking_date: bookingDate,
                    start_time: null, // Time is optional/removed
                    status: 'pending',
                    total_amount: selectedItem.price,
                    details: { item_id: selectedItem.id, item_name: selectedItem.name }
                }]);

            if (error) throw error;
            toast.success("Booking request sent successfully!");
            setDialogOpen(false);
            setBookingDate("");
        } catch (error) {
            toast.error("Failed to book: " + error.message);
        }
    };

    const openBookingDialog = (item) => {
        setSelectedItem(item);
        setDialogOpen(true);
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>

            <div>
                <h1 className="text-3xl font-serif font-bold capitalize">{category.replace('_', ' ')}</h1>
                <p className="text-muted-foreground">Book your experience</p>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No services available in this category yet.
                    <br />
                    <span className="text-sm">Admins need to add items via "Manage Services".</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <Card key={item.id} className="overflow-hidden flex flex-col">
                            {item.image_url && (
                                <div className="h-48 w-full overflow-hidden">
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform hover:scale-105" />
                                </div>
                            )}
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{item.name}</CardTitle>
                                        <CardDescription className="mt-1">{item.description}</CardDescription>
                                    </div>
                                    <span className="font-bold text-lg text-primary">${item.price}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="mt-auto">
                                <Button className="w-full" onClick={() => openBookingDialog(item)}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Book Now
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Book {selectedItem?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="pt-4 flex justify-between items-center border-t">
                            <span className="font-medium">Total Price:</span>
                            <span className="text-xl font-bold text-primary">${selectedItem?.price}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleBook}>Confirm Booking</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VoyagerBookings;
