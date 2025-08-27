import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Package {
  id: string;
  name: string;
  description: string | null;
  price_amount: number;
  currency: string;
  interval: string;
  features: any; // Json from database
  is_active: boolean;
  order_index: number;
  image_url: string | null;
  created_at: string;
}

export function PackageManager() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_amount: "",
    currency: "usd",
    interval: "month",
    features: "",
    image_url: "",
    is_active: true,
    order_index: 0,
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const packageData = {
        name: formData.name,
        description: formData.description || null,
        price_amount: Math.round(parseFloat(formData.price_amount) * 100), // Convert dollars to cents
        currency: formData.currency,
        interval: formData.interval,
        features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : [],
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        order_index: formData.order_index,
      };

      if (editingPackage) {
        const { error } = await supabase
          .from("packages")
          .update(packageData)
          .eq("id", editingPackage.id);

        if (error) throw error;
        toast.success("Package updated successfully");
      } else {
        const { error } = await supabase
          .from("packages")
          .insert([packageData]);

        if (error) throw error;
        toast.success("Package created successfully");
      }

      fetchPackages();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Failed to save package");
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      price_amount: (pkg.price_amount / 100).toFixed(2), // Convert cents to dollars
      currency: pkg.currency,
      interval: pkg.interval,
      features: Array.isArray(pkg.features) ? pkg.features.join('\n') : "",
      image_url: pkg.image_url || "",
      is_active: pkg.is_active,
      order_index: pkg.order_index,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Check if package has active subscriptions
      const { data: subscribers, error: checkError } = await supabase
        .from("subscribers")
        .select("id, email")
        .eq("package_id", id)
        .eq("subscribed", true);

      if (checkError) throw checkError;

      if (subscribers && subscribers.length > 0) {
        const userEmails = subscribers.map(sub => sub.email).join(", ");
        const confirmMessage = `This package has ${subscribers.length} active subscription(s) (${userEmails}). 

This will:
1. Remove the package reference from these subscriptions
2. Delete the package

Are you sure you want to continue?`;
        
        if (!confirm(confirmMessage)) return;

        // Update subscribers to remove package reference
        const { error: updateError } = await supabase
          .from("subscribers")
          .update({ package_id: null })
          .eq("package_id", id);

        if (updateError) throw updateError;
      } else {
        if (!confirm("Are you sure you want to delete this package?")) return;
      }

      // Now delete the package
      const { error } = await supabase
        .from("packages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Package deleted successfully");
      fetchPackages();
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Failed to delete package");
    }
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData({
      name: "",
      description: "",
      price_amount: "",
      currency: "usd",
      interval: "month",
      features: "",
      image_url: "",
      is_active: true,
      order_index: packages.length,
    });
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return <div>Loading packages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Package Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? "Edit Package" : "Create New Package"}
              </DialogTitle>
              <DialogDescription>
                Configure your subscription package details and pricing.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Package Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Premium Package"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (in dollars)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_amount}
                  onChange={(e) => setFormData({ ...formData, price_amount: e.target.value })}
                  placeholder="29.99"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                    <SelectItem value="gbp">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">Billing Interval</Label>
                <Select value={formData.interval} onValueChange={(value) => setFormData({ ...formData, interval: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Premium features and benefits"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="image_url">Package Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/package-image.jpg"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Priority support&#10;Exclusive content&#10;Advanced features"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Order Index</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                {editingPackage ? "Update" : "Create"} Package
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {pkg.name}
                    {!pkg.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </CardTitle>
                  <CardDescription>
                    {formatPrice(pkg.price_amount, pkg.currency)} per {pkg.interval}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(pkg)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(pkg.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pkg.image_url && (
                <div className="mb-4">
                  <img 
                    src={pkg.image_url} 
                    alt={pkg.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              {pkg.description && <p className="text-muted-foreground mb-4">{pkg.description}</p>}
              {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Features:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {pkg.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {packages.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No packages created yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}