import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Save, X, GripVertical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const FormFieldEditor = ({ applicationTypeId, initialFields, onSave }: any) => {
  const [fields, setFields] = useState(initialFields || []);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio Buttons' }
  ];

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      placeholder: '',
      options: []
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const removeField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index);
    setFields(updated);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    
    const updated = [...fields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFields(updated);
  };

  const saveFields = async () => {
    try {
      const { error } = await supabase
        .from('application_types')
        .update({ form_fields: fields })
        .eq('id', applicationTypeId);

      if (error) throw error;

      onSave(fields);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Form fields updated successfully",
      });
    } catch (error) {
      console.error('Error saving fields:', error);
      toast({
        title: "Error",
        description: "Failed to save form fields",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 bg-gaming-dark border-gaming-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Form Fields</h3>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "destructive" : "outline"}
        >
          {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
          {isEditing ? 'Cancel' : 'Edit Fields'}
        </Button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {fields.map((field: any, index: number) => (
            <Card key={field.id || index} className="p-4 bg-gaming-card border-gaming-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <Badge variant="outline">{field.type}</Badge>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveField(index, 'up')}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveField(index, 'down')}
                    disabled={index === fields.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeField(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground">Field Label</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    className="bg-gaming-dark border-gaming-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Field Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value) => updateField(index, { type: value })}
                  >
                    <SelectTrigger className="bg-gaming-dark border-gaming-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gaming-card border-gaming-border">
                      {fieldTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground">Placeholder</Label>
                  <Input
                    value={field.placeholder || ''}
                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                    className="bg-gaming-dark border-gaming-border text-foreground"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={field.required || false}
                    onCheckedChange={(checked) => updateField(index, { required: checked })}
                  />
                  <Label className="text-foreground">Required</Label>
                </div>
              </div>

              {(field.type === 'select' || field.type === 'radio') && (
                <div className="mt-3">
                  <Label className="text-foreground">Options (one per line)</Label>
                  <Textarea
                    value={(field.options || []).join('\n')}
                    onChange={(e) => updateField(index, { 
                      options: e.target.value.split('\n').filter(o => o.trim()) 
                    })}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    className="bg-gaming-dark border-gaming-border text-foreground"
                  />
                </div>
              )}
            </Card>
          ))}

          <div className="flex justify-between">
            <Button onClick={addField} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
            <Button onClick={saveFields}>
              <Save className="h-4 w-4 mr-2" />
              Save Fields
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.length === 0 ? (
            <p className="text-muted-foreground">No form fields configured</p>
          ) : (
            fields.map((field: any, index: number) => (
              <div key={field.id || index} className="flex items-center justify-between p-3 bg-gaming-card rounded border">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{field.type}</Badge>
                  <span className="text-foreground">{field.label}</span>
                  {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
};

export default FormFieldEditor;