import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Save, X, Navigation, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface NavbarItem {
  id: string;
  path: string;
  label: string;
  order: number;
  visible: boolean;
  staffOnly: boolean;
}

const NavbarManager = () => {
  const [navbarItems, setNavbarItems] = useState<NavbarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<NavbarItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState({
    id: "",
    path: "",
    label: "",
    order: 0,
    visible: true,
    staffOnly: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchNavbarConfig();
  }, []);

  const fetchNavbarConfig = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'navbar_config')
        .single();

      if (error) throw error;
      
      const config = data?.setting_value as any;
      if (config?.items) {
        setNavbarItems(config.items);
      }
    } catch (error) {
      console.error('Error fetching navbar config:', error);
      toast({
        title: "Error",
        description: "Failed to fetch navbar configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveNavbarConfig = async (items: NavbarItem[]) => {
    try {
      const { error } = await supabase
        .from('server_settings')
        .update({
          setting_value: { items } as any,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'navbar_config');

      if (error) throw error;

      setNavbarItems(items);
      toast({
        title: "Success",
        description: "Navbar configuration updated successfully",
      });
    } catch (error) {
      console.error('Error saving navbar config:', error);
      toast({
        title: "Error",
        description: "Failed to save navbar configuration",
        variant: "destructive",
      });
    }
  };

  const addNavbarItem = () => {
    const items = [...navbarItems, {
      ...newItem,
      id: newItem.id || `item_${Date.now()}`,
      order: Math.max(...navbarItems.map(item => item.order), -1) + 1
    }];
    saveNavbarConfig(items);
    setIsCreating(false);
    setNewItem({
      id: "",
      path: "",
      label: "",
      order: 0,
      visible: true,
      staffOnly: false
    });
  };

  const updateNavbarItem = (updatedItem: NavbarItem) => {
    const items = navbarItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    saveNavbarConfig(items);
    setEditingItem(null);
  };

  const deleteNavbarItem = (itemId: string) => {
    const items = navbarItems.filter(item => item.id !== itemId);
    saveNavbarConfig(items);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const items = [...navbarItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < items.length) {
      [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
      
      // Update order values
      items.forEach((item, idx) => {
        item.order = idx;
      });
      
      saveNavbarConfig(items);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="text-center">
          <p className="text-foreground">Loading navbar configuration...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Navigation className="h-5 w-5 text-neon-purple" />
          <h2 className="text-xl font-semibold text-foreground">Navbar Management</h2>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gaming-card border-gaming-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Navbar Item</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a new navigation item for the navbar
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">ID</Label>
                <Input
                  value={newItem.id}
                  onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
                  placeholder="unique-id"
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Label</Label>
                <Input
                  value={newItem.label}
                  onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                  placeholder="Display text"
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Path</Label>
                <Input
                  value={newItem.path}
                  onChange={(e) => setNewItem({ ...newItem, path: e.target.value })}
                  placeholder="/page-url"
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newItem.visible}
                  onCheckedChange={(checked) => setNewItem({ ...newItem, visible: checked })}
                />
                <Label className="text-foreground">Visible</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newItem.staffOnly}
                  onCheckedChange={(checked) => setNewItem({ ...newItem, staffOnly: checked })}
                />
                <Label className="text-foreground">Staff Only</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={addNavbarItem}>
                <Save className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {navbarItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No navbar items configured</p>
        ) : (
          navbarItems
            .sort((a, b) => a.order - b.order)
            .map((item, index) => (
              <Card key={item.id} className="p-4 bg-gaming-dark border-gaming-border">
                {editingItem?.id === item.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editingItem.label}
                      onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                      placeholder="Label"
                      className="bg-gaming-card border-gaming-border text-foreground"
                    />
                    <Input
                      value={editingItem.path}
                      onChange={(e) => setEditingItem({ ...editingItem, path: e.target.value })}
                      placeholder="Path"
                      className="bg-gaming-card border-gaming-border text-foreground"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editingItem.visible}
                            onCheckedChange={(checked) => setEditingItem({ ...editingItem, visible: checked })}
                          />
                          <Label className="text-foreground">Visible</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editingItem.staffOnly}
                            onCheckedChange={(checked) => setEditingItem({ ...editingItem, staffOnly: checked })}
                          />
                          <Label className="text-foreground">Staff Only</Label>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => updateNavbarItem(editingItem)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingItem(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col space-y-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="h-4 p-0"
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === navbarItems.length - 1}
                          className="h-4 p-0"
                        >
                          ↓
                        </Button>
                      </div>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-foreground">{item.label}</h4>
                          {!item.visible && (
                            <Badge variant="secondary" className="text-xs">Hidden</Badge>
                          )}
                          {item.staffOnly && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                              Staff Only
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.path}</p>
                        <p className="text-xs text-muted-foreground">Order: {item.order}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gaming-card border-gaming-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Delete Navbar Item</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              Are you sure you want to delete the "{item.label}" navbar item?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteNavbarItem(item.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </Card>
            ))
        )}
      </div>
    </Card>
  );
};

export default NavbarManager;