import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, GripVertical, Save, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const RulesManager = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState({
    title: "",
    description: "",
    category: "",
    order_index: 0,
    is_active: true
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .order('category', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rules",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createRule = async () => {
    try {
      const { error } = await supabase
        .from('rules')
        .insert({
          ...newRule,
          created_by: user?.id
        });

      if (error) throw error;

      await fetchRules();
      setIsCreating(false);
      setNewRule({
        title: "",
        description: "",
        category: "",
        order_index: 0,
        is_active: true
      });
      toast({
        title: "Success",
        description: "Rule created successfully",
      });
    } catch (error) {
      console.error('Error creating rule:', error);
      toast({
        title: "Error",
        description: "Failed to create rule",
        variant: "destructive",
      });
    }
  };

  const updateRule = async (ruleId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('rules')
        .update(updates)
        .eq('id', ruleId);

      if (error) throw error;

      await fetchRules();
      setEditingRule(null);
      toast({
        title: "Success",
        description: "Rule updated successfully",
      });
    } catch (error) {
      console.error('Error updating rule:', error);
      toast({
        title: "Error",
        description: "Failed to update rule",
        variant: "destructive",
      });
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      await fetchRules();
      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive",
      });
    }
  };

  const groupedRules = rules.reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, any[]>);

  if (isLoading) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="text-center">
          <p className="text-foreground">Loading rules...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Server Rules Management</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gaming-card border-gaming-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Rule</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a new rule to your server
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Title</Label>
                <Input
                  value={newRule.title}
                  onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                  placeholder="Rule title..."
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Category</Label>
                <Input
                  value={newRule.category}
                  onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                  placeholder="Rule category..."
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Description</Label>
                <Textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Rule description..."
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Order Index</Label>
                <Input
                  type="number"
                  value={newRule.order_index}
                  onChange={(e) => setNewRule({ ...newRule, order_index: parseInt(e.target.value) || 0 })}
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newRule.is_active}
                  onCheckedChange={(checked) => setNewRule({ ...newRule, is_active: checked })}
                />
                <Label className="text-foreground">Active</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={createRule}>
                <Save className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedRules).length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No rules found</p>
        ) : (
          Object.entries(groupedRules).map(([category, categoryRules]: [string, any[]]) => (
            <div key={category}>
              <h3 className="text-lg font-medium text-foreground mb-3 capitalize">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryRules.map((rule) => (
                  <Card key={rule.id} className="p-4 bg-gaming-dark border-gaming-border">
                    {editingRule?.id === rule.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editingRule.title}
                          onChange={(e) => setEditingRule({ ...editingRule, title: e.target.value })}
                          className="bg-gaming-card border-gaming-border text-foreground"
                        />
                        <Textarea
                          value={editingRule.description}
                          onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                          className="bg-gaming-card border-gaming-border text-foreground"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={editingRule.is_active}
                              onCheckedChange={(checked) => setEditingRule({ ...editingRule, is_active: checked })}
                            />
                            <Label className="text-foreground">Active</Label>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => updateRule(rule.id, editingRule)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingRule(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-foreground">{rule.title}</h4>
                            {!rule.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRule(rule)}
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
                                <AlertDialogTitle className="text-foreground">Delete Rule</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  Are you sure you want to delete this rule? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteRule(rule.id)}
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
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default RulesManager;