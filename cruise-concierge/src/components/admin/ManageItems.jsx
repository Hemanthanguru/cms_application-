import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";

const ManageItems = ({ type }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null);
    const [newItem, setNewItem] = useState({
        name: "",
        description: "",
        category: type || "catering",
        price: "",
        stock: "",
        image_url: ""
    });

    useEffect(() => {
        fetchItems();

        // Real-time subscription
        const channel = supabase
            .channel('items-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
                // We handle our own optimistic updates, but this helps sync with other users
                // or if our own update mechanism fails to be exact.
                // However, simplistic merging might cause jitter if not careful.
                // For now, these handlers might technically conflict with our manual updates if latency is high,
                // but usually it's fine. To be safe, we could check if we already have the data.
                if (payload.eventType === 'INSERT') {
                    setItems((prev) => {
                        if (prev.find(item => item.id === payload.new.id)) return prev;
                        return [payload.new, ...prev];
                    });
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
    }, []);

    const fetchItems = async () => {
        try {
            let query = supabase
                .from('items')
                .select('*')
                .order('created_at', { ascending: false });

            if (type) {
                query = query.eq('category', type);
            }

            const { data, error } = await query;

            if (error) throw error;
            setItems(data);
        } catch (error) {
            toast.error("Error fetching items: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                const { data, error } = await supabase
                    .from('items')
                    .update({
                        name: newItem.name,
                        description: newItem.description,
                        category: type || newItem.category,
                        price: parseFloat(newItem.price),
                        stock: parseInt(newItem.stock),
                        image_url: newItem.image_url
                    })
                    .eq('id', isEditing)
                    .select();

                if (error) throw error;

                // Manually update state
                if (data && data.length > 0) {
                    setItems((prev) => prev.map(item => item.id === isEditing ? data[0] : item));
                }

                toast.success("Item updated successfully!");
                setIsEditing(null);
            } else {
                const { data, error } = await supabase
                    .from('items')
                    .insert([{
                        ...newItem,
                        category: type || newItem.category,
                        price: parseFloat(newItem.price),
                        stock: parseInt(newItem.stock)
                    }])
                    .select();

                if (error) throw error;

                // Manually update state
                if (data && data.length > 0) {
                    setItems((prev) => [data[0], ...prev]);
                }

                toast.success("Item added successfully!");
            }
            setNewItem({ name: "", description: "", category: type || "catering", price: "", stock: "", image_url: "" });
        } catch (error) {
            toast.error(isEditing ? "Error updating item: " + error.message : "Error adding item: " + error.message);
        }
    };

    const handleEditItem = (item) => {
        setIsEditing(item.id);
        setNewItem({
            name: item.name,
            description: item.description || "",
            category: item.category,
            price: item.price,
            stock: item.stock,
            image_url: item.image_url || ""
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setIsEditing(null);
        setNewItem({ name: "", description: "", category: type || "catering", price: "", stock: "", image_url: "" });
    };

    const handleDeleteItem = async (id) => {
        if (!confirm("Are you sure you want to delete this item?")) return;

        try {
            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Manually update state
            setItems((prev) => prev.filter(item => item.id !== id));

            toast.success("Item deleted successfully");
        } catch (error) {
            toast.error("Error deleting item: " + error.message);
        }
    };

    return (
        <div className="space-y-8">
            {/* Add New Item Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        {isEditing ? `Edit ${type ? type : "Item"}` : `Add New ${type ? <span className="capitalize">{type} Item</span> : "Service/Item"}`}
                        {isEditing && (
                            <Button variant="outline" size="sm" onClick={handleCancelEdit} className="ml-auto">
                                <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Item Name</Label>
                            <Input
                                id="name"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                placeholder="e.g., Lobster Thermidor"
                                required
                            />
                        </div>
                        {!type && (
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={newItem.category}
                                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="catering">Catering</SelectItem>
                                        <SelectItem value="stationery">Stationery</SelectItem>
                                        <SelectItem value="movie">Resort Movie</SelectItem>
                                        <SelectItem value="salon">Beauty Salon Service</SelectItem>
                                        <SelectItem value="fitness">Fitness Center Class</SelectItem>
                                        <SelectItem value="party_hall">Party Hall Venue</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="price">Price ($)</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={newItem.price}
                                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock / Availability</Label>
                            <Input
                                id="stock"
                                type="number"
                                value={newItem.stock}
                                onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                                placeholder="100"
                                required
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                placeholder="Describe the item..."
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="image">Image URL</Label>
                            <Input
                                id="image"
                                value={newItem.image_url}
                                onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>
                        <Button type="submit" className="md:col-span-2">
                            {isEditing ? <><Save className="h-4 w-4 mr-2" /> Update Item</> : <><Plus className="h-4 w-4 mr-2" /> Add Item</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Items List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                        {item.image_url && (
                            <div className="h-48 w-full overflow-hidden">
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform hover:scale-105" />
                            </div>
                        )}
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{item.name}</CardTitle>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary/10 text-secondary capitalize">
                                        {item.category}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)} className="hover:bg-primary/10 text-primary">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.description}</p>
                            <div className="flex justify-between items-center font-medium">
                                <span className="text-primary">${item.price}</span>
                                <span className="text-muted-foreground text-sm">Stock: {item.stock}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ManageItems;
