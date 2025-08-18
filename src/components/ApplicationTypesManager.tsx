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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Save, X, FileText, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import FormFieldEditor from "./FormFieldEditor";

const ApplicationTypesManager = () => {
  const [applicationTypes, setApplicationTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingType, setEditingType] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newType, setNewType] = useState({
    name: "",
    description: "",
    form_fields: [],
    is_active: true
  });
  const { user } = useAuth();
  const { toast } = useToast();

  // Default form fields that are commonly used
  const defaultFields = [
    { id: 'discord_name', label: 'Discord Username', type: 'text', required: true },
    { id: 'steam_name', label: 'Steam Name', type: 'text', required: true },
    { id: 'fivem_name', label: 'FiveM Name', type: 'text', required: true },
    { id: 'age', label: 'Age', type: 'number', required: true },
    { id: 'character_backstory', label: 'Character Backstory', type: 'textarea', required: true },
    { id: 'rp_experience', label: 'RP Experience', type: 'textarea', required: true }
  ];

  useEffect(() => {
    fetchApplicationTypes();
  }, []);

  const fetchApplicationTypes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('application_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplicationTypes(data || []);
    } catch (error) {
      console.error('Error fetching application types:', error);
      toast({
        title: "Error",
        description: "Failed to fetch application types",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createApplicationType = async () => {
    try {
      const { error } = await supabase
        .from('application_types')
        .insert({
          ...newType,
          form_fields: newType.form_fields.length > 0 ? newType.form_fields : defaultFields,
          created_by: user?.id
        });

      if (error) throw error;

      await fetchApplicationTypes();
      setIsCreating(false);
      setNewType({
        name: "",
        description: "",
        form_fields: [],
        is_active: true
      });
      toast({
        title: "Success",
        description: "Application type created successfully",
      });
    } catch (error) {
      console.error('Error creating application type:', error);
      toast({
        title: "Error",
        description: "Failed to create application type",
        variant: "destructive",
      });
    }
  };

  const updateApplicationType = async (typeId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('application_types')
        .update(updates)
        .eq('id', typeId);

      if (error) throw error;

      await fetchApplicationTypes();
      setEditingType(null);
      toast({
        title: "Success",
        description: "Application type updated successfully",
      });
    } catch (error) {
      console.error('Error updating application type:', error);
      toast({
        title: "Error",
        description: "Failed to update application type",
        variant: "destructive",
      });
    }
  };

  const deleteApplicationType = async (typeId: string) => {
    try {
      const { error } = await supabase
        .from('application_types')
        .delete()
        .eq('id', typeId);

      if (error) throw error;

      await fetchApplicationTypes();
      toast({
        title: "Success",
        description: "Application type deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting application type:', error);
      toast({
        title: "Error",
        description: "Failed to delete application type",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="text-center">
          <p className="text-foreground">Loading application types...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-neon-blue" />
          <h2 className="text-xl font-semibold text-foreground">Application Types</h2>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-gaming-card border-gaming-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Application Type</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a new type of application with custom form fields
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Name</Label>
                <Input
                  value={newType.name}
                  onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                  placeholder="e.g., Server Application, Staff Application..."
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Description</Label>
                <Textarea
                  value={newType.description}
                  onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                  placeholder="Description of this application type..."
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newType.is_active}
                  onCheckedChange={(checked) => setNewType({ ...newType, is_active: checked })}
                />
                <Label className="text-foreground">Active</Label>
              </div>

              <div className="p-4 bg-gaming-dark rounded border">
                <p className="text-sm text-muted-foreground">
                  Default form fields will be automatically added: Discord Username, Steam Name, FiveM Name, Age, Character Backstory, and RP Experience.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={createApplicationType}>
                <Save className="h-4 w-4 mr-2" />
                Create Type
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {applicationTypes.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No application types found</p>
        ) : (
          applicationTypes.map((type) => (
            <Card key={type.id} className="p-4 bg-gaming-dark border-gaming-border">
              {editingType?.id === type.id ? (
                <div className="space-y-3">
                  <Input
                    value={editingType.name}
                    onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                    className="bg-gaming-card border-gaming-border text-foreground"
                  />
                  <Textarea
                    value={editingType.description}
                    onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                    className="bg-gaming-card border-gaming-border text-foreground"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingType.is_active}
                        onCheckedChange={(checked) => setEditingType({ ...editingType, is_active: checked })}
                      />
                      <Label className="text-foreground">Active</Label>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => updateApplicationType(type.id, editingType)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingType(null)}
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
                      <h4 className="font-medium text-foreground">{type.name}</h4>
                      {!type.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Form fields: {type.form_fields?.length || 0} fields configured
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Fields
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gaming-card border-gaming-border">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Edit Form Fields</DialogTitle>
                          <DialogDescription className="text-muted-foreground">
                            Customize the form fields for {type.name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <FormFieldEditor
                          applicationTypeId={type.id}
                          initialFields={type.form_fields || []}
                          onSave={(fields: any) => {
                            // Refresh the list
                            fetchApplicationTypes();
                          }}
                        />
                      </DialogContent>
                    </Dialog>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingType(type)}
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
                          <AlertDialogTitle className="text-foreground">Delete Application Type</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete this application type? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteApplicationType(type.id)}
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

export default ApplicationTypesManager;