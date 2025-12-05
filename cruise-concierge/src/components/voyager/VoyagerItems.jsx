import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, ShoppingCart, Plus, Minus } from "lucide-react";
import { useAuth } from "@/lib/auth";

const VoyagerItems = ({ category: propCategory }) => {
    const { category: paramCategory } = useParams();
    const category = propCategory || paramCategory;
    const navigate = useNavigate();
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState({});

    useEffect(() => {
        fetchItems();

        // Real-time subscription for new items
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
            toast.error("Error fetching items: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = (itemId, delta) => {
        setQuantities(prev => {
            const current = prev[itemId] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [itemId]: next };
        });
    };

    const handleOrder = async (item) => {
        const qty = quantities[item.id] || 1;
        if (qty <= 0) return;

        try {
            const totalAmount = item.price * qty;

            const { error } = await supabase.rpc('place_order', {
                p_item_id: item.id,
                p_qty: qty,
                p_user_id: user.id,
                p_category: category,
                p_total_amount: totalAmount,
                p_item_name: item.name,
                p_item_price: item.price
            });

            if (error) throw error;
            toast.success(`Ordered ${qty} x ${item.name} successfully!`);
            setQuantities(prev => ({ ...prev, [item.id]: 0 }));
        } catch (error) {
            toast.error("Failed to place order: " + error.message);
        }
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>

            <div>
                <h1 className="text-3xl font-serif font-bold capitalize">{category}</h1>
                <p className="text-muted-foreground">Browse and order items</p>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No items available in this category.</div>
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
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 border rounded-md p-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, -1)}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center font-medium">{quantities[item.id] || 0}</span>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, 1)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <Button
                                        className="flex-1"
                                        onClick={() => handleOrder(item)}
                                        disabled={!quantities[item.id]}
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Order
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VoyagerItems;
