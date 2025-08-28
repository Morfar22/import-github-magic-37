import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Heart, Star, Crown, Diamond, Trophy, Medal, Eye, EyeOff } from "lucide-react";
import { SupporterBadge } from "@/components/SupporterBadge";

interface Supporter {
  id: string;
  user_id: string | null;
  amount: number;
  supporter_tier: string;
  donation_date: string;
  message: string | null;
  is_anonymous: boolean;
  is_featured: boolean;
  currency: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
    email: string | null;
  } | null;
}

interface NewSupporter {
  user_id: string | null;
  amount: number;
  supporter_tier: string;
  donation_date: string;
  message: string;
  is_anonymous: boolean;
  is_featured: boolean;
  currency: string;
  donor_email?: string;
  donor_name?: string;
}

export default function SupportersManager() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupporter, setEditingSupporter] = useState<Supporter | null>(null);
  const [formData, setFormData] = useState<NewSupporter>({
    user_id: null,
    amount: 0,
    supporter_tier: 'bronze',
    donation_date: new Date().toISOString().split('T')[0],
    message: '',
    is_anonymous: false,
    is_featured: false,
    currency: 'usd',
    donor_email: '',
    donor_name: ''
  });

  const { toast } = useToast();

  const tierOptions = [
    { value: 'bronze', label: 'Bronze ($5+)', icon: Medal },
    { value: 'silver', label: 'Silver ($50+)', icon: Star },
    { value: 'gold', label: 'Gold ($100+)', icon: Trophy },
    { value: 'platinum', label: 'Platinum ($250+)', icon: Crown },
    { value: 'diamond', label: 'Diamond ($500+)', icon: Diamond }
  ];

  useEffect(() => {
    fetchSupporters();
    fetchUsers();
  }, []);

  const fetchSupporters = async () => {
    try {
      const { data, error } = await supabase
        .from("supporters")
        .select(`
          *,
          profiles!left (
            username,
            email
          )
        `)
        .order("donation_date", { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Supporter interface
      const transformedData = (data || []).map(item => ({
        ...item,
        profiles: item.profiles && typeof item.profiles === 'object' && !Array.isArray(item.profiles) && 'username' in item.profiles
          ? item.profiles 
          : null
      }));
      
      setSupporters(transformedData as Supporter[]);
    } catch (error) {
      console.error("Error fetching supporters:", error);
      toast({
        title: "Error",
        description: "Failed to fetch supporters",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email")
        .order("username", { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const calculateTierFromAmount = (amount: number): string => {
    if (amount >= 50000) return 'diamond';
    if (amount >= 25000) return 'platinum';
    if (amount >= 10000) return 'gold';
    if (amount >= 5000) return 'silver';
    return 'bronze';
  };

  const resetForm = () => {
    setFormData({
      user_id: null,
      amount: 0,
      supporter_tier: 'bronze',
      donation_date: new Date().toISOString().split('T')[0],
      message: '',
      is_anonymous: false,
      is_featured: false,
      currency: 'usd',
      donor_email: '',
      donor_name: ''
    });
    setEditingSupporter(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Calculate tier based on amount
      const tierFromAmount = calculateTierFromAmount(formData.amount);
      
      const supporterData = {
        user_id: formData.user_id === "external_donor" ? null : formData.user_id,
        amount: formData.amount,
        supporter_tier: tierFromAmount,
        donation_date: new Date(formData.donation_date).toISOString(),
        message: formData.message || null,
        is_anonymous: formData.is_anonymous,
        is_featured: formData.is_featured,
        currency: formData.currency
      };

      if (editingSupporter) {
        const { error } = await supabase
          .from("supporters")
          .update(supporterData)
          .eq("id", editingSupporter.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Supporter updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("supporters")
          .insert([supporterData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Supporter added successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchSupporters();
    } catch (error: any) {
      console.error("Error saving supporter:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save supporter",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (supporter: Supporter) => {
    setEditingSupporter(supporter);
    setFormData({
      user_id: supporter.user_id || "external_donor",
      amount: supporter.amount,
      supporter_tier: supporter.supporter_tier,
      donation_date: supporter.donation_date.split('T')[0],
      message: supporter.message || '',
      is_anonymous: supporter.is_anonymous,
      is_featured: supporter.is_featured,
      currency: supporter.currency,
      donor_email: supporter.profiles?.email || '',
      donor_name: supporter.profiles?.username || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("supporters")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Supporter deleted successfully",
      });

      fetchSupporters();
    } catch (error: any) {
      console.error("Error deleting supporter:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete supporter",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <Card className="card-gaming-outline bg-gradient-card border-gaming-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-gaming-outline bg-gradient-card border-gaming-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Supporters Management
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Manage supporter donations and tiers
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => resetForm()}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supporter
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gaming-card border-gaming-border max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    {editingSupporter ? 'Edit Supporter' : 'Add New Supporter'}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {editingSupporter ? 'Update supporter information' : 'Add a new supporter to the system'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">User (Optional)</Label>
                    <Select 
                      value={formData.user_id || "external_donor"} 
                      onValueChange={(value) => setFormData({...formData, user_id: value === "external_donor" ? null : value})}
                    >
                      <SelectTrigger className="bg-gaming-dark border-gaming-border text-foreground">
                        <SelectValue placeholder="Select a user (leave empty for external donor)" />
                      </SelectTrigger>
                      <SelectContent className="bg-gaming-dark border-gaming-border">
                        <SelectItem value="external_donor">External Donor</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.username || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(!formData.user_id || formData.user_id === "external_donor") && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-foreground">Donor Name</Label>
                        <Input
                          value={formData.donor_name}
                          onChange={(e) => setFormData({...formData, donor_name: e.target.value})}
                          placeholder="External donor name"
                          className="bg-gaming-dark border-gaming-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Donor Email</Label>
                        <Input
                          type="email"
                          value={formData.donor_email}
                          onChange={(e) => setFormData({...formData, donor_email: e.target.value})}
                          placeholder="External donor email"
                          className="bg-gaming-dark border-gaming-border text-foreground"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label className="text-foreground">Amount (in cents)</Label>
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => {
                        const amount = parseInt(e.target.value) || 0;
                        setFormData({
                          ...formData, 
                          amount,
                          supporter_tier: calculateTierFromAmount(amount)
                        });
                      }}
                      placeholder="500 = $5.00"
                      className="bg-gaming-dark border-gaming-border text-foreground"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Amount: {formatCurrency(formData.amount, formData.currency)} 
                      - Tier: {formData.supporter_tier}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Currency</Label>
                    <Select 
                      value={formData.currency} 
                      onValueChange={(value) => setFormData({...formData, currency: value})}
                    >
                      <SelectTrigger className="bg-gaming-dark border-gaming-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gaming-dark border-gaming-border">
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="eur">EUR</SelectItem>
                        <SelectItem value="gbp">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Donation Date</Label>
                    <Input
                      type="date"
                      value={formData.donation_date}
                      onChange={(e) => setFormData({...formData, donation_date: e.target.value})}
                      className="bg-gaming-dark border-gaming-border text-foreground"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Message (Optional)</Label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Thank you message or note"
                      className="bg-gaming-dark border-gaming-border text-foreground"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_anonymous}
                        onCheckedChange={(checked) => setFormData({...formData, is_anonymous: checked})}
                      />
                      <Label className="text-foreground">Anonymous</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData({...formData, is_featured: checked})}
                      />
                      <Label className="text-foreground">Featured</Label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                      {editingSupporter ? 'Update' : 'Add'} Supporter
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {supporters.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No supporters found</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {supporters.map((supporter) => (
                  <Card key={supporter.id} className="card-gaming-outline bg-gaming-darker border-gaming-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {supporter.is_anonymous ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                            {supporter.is_featured && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-foreground">
                                {supporter.is_anonymous 
                                  ? 'Anonymous Supporter' 
                                  : supporter.profiles?.username || supporter.profiles?.email || 'Unknown User'
                                }
                              </p>
                              <SupporterBadge tier={supporter.supporter_tier} size="sm" />
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{formatCurrency(supporter.amount, supporter.currency)}</span>
                              <span>{new Date(supporter.donation_date).toLocaleDateString()}</span>
                            </div>
                            {supporter.message && (
                              <p className="text-sm text-muted-foreground italic mt-1">
                                "{supporter.message}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(supporter)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gaming-card border-gaming-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">Delete Supporter</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  Are you sure you want to delete this supporter? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(supporter.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}