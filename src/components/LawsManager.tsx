import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Scale, Plus, Edit, Trash2, Save, X, DollarSign, Clock, AlertTriangle, Settings, FolderPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Law {
  id: string;
  title: string;
  description: string;
  category: string;
  fine_amount: number;
  jail_time_minutes: number;
  severity_level: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

interface LawFormData {
  title: string;
  description: string;
  category: string;
  fine_amount: number;
  jail_time_minutes: number;
  severity_level: string;
  is_active: boolean;
  order_index: number;
}

const LawsManager = () => {
  const { toast } = useToast();
  const [laws, setLaws] = useState<Law[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['General', 'Traffic', 'Property', 'Violence', 'Drug', 'Weapon', 'Public Order', 'Financial']);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ old: string; new: string } | null>(null);
  const [formData, setFormData] = useState<LawFormData>({
    title: '',
    description: '',
    category: 'General',
    fine_amount: 0,
    jail_time_minutes: 0,
    severity_level: 'Minor',
    is_active: true,
    order_index: 0
  });

  const severityLevels = ['Minor', 'Moderate', 'Severe'];

  useEffect(() => {
    fetchLaws();
  }, []);

  const fetchLaws = async () => {
    try {
      const { data, error } = await supabase
        .from('laws')
        .select('*')
        .order('category')
        .order('order_index');

      if (error) throw error;
      setLaws(data || []);
      
      // Extract unique categories from existing laws
      const uniqueCategories = [...new Set(data?.map(law => law.category) || [])];
      const allCategories = [...new Set([...categories, ...uniqueCategories])];
      setCategories(allCategories);
    } catch (error) {
      console.error('Error fetching laws:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch laws',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'General',
      fine_amount: 0,
      jail_time_minutes: 0,
      severity_level: 'Minor',
      is_active: true,
      order_index: 0
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Error',
        description: 'Title and description are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('laws')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Law updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('laws')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Law created successfully'
        });
      }

      resetForm();
      fetchLaws();
    } catch (error) {
      console.error('Error saving law:', error);
      toast({
        title: 'Error',
        description: 'Failed to save law',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (law: Law) => {
    setFormData({
      title: law.title,
      description: law.description,
      category: law.category,
      fine_amount: law.fine_amount,
      jail_time_minutes: law.jail_time_minutes,
      severity_level: law.severity_level,
      is_active: law.is_active,
      order_index: law.order_index
    });
    setEditingId(law.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('laws')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Law deleted successfully'
      });
      
      fetchLaws();
    } catch (error) {
      console.error('Error deleting law:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete law',
        variant: 'destructive'
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'minor':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'severe':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatJailTime = (minutes: number) => {
    if (minutes === 0) return 'No jail time';
    if (minutes < 60) return `${minutes} minutes`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    if (categories.includes(newCategoryName.trim())) {
      toast({
        title: 'Error',
        description: 'Category already exists',
        variant: 'destructive'
      });
      return;
    }

    setCategories(prev => [...prev, newCategoryName.trim()]);
    setNewCategoryName('');
    toast({
      title: 'Success',
      description: 'Category added successfully'
    });
  };

  const handleEditCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName.trim()) {
      setEditingCategory(null);
      return;
    }

    if (categories.includes(newName.trim()) && newName.trim() !== oldName) {
      toast({
        title: 'Error',
        description: 'Category name already exists',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Update all laws with this category
      const { error } = await supabase
        .from('laws')
        .update({ category: newName.trim() })
        .eq('category', oldName);

      if (error) throw error;

      // Update local categories state
      setCategories(prev => prev.map(cat => cat === oldName ? newName.trim() : cat));
      setEditingCategory(null);
      fetchLaws(); // Refresh laws to show updated categories
      
      toast({
        title: 'Success',
        description: 'Category updated successfully'
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    const lawsInCategory = laws.filter(law => law.category === categoryName);
    
    if (lawsInCategory.length > 0) {
      toast({
        title: 'Error',
        description: `Cannot delete category with ${lawsInCategory.length} law(s). Move or delete the laws first.`,
        variant: 'destructive'
      });
      return;
    }

    setCategories(prev => prev.filter(cat => cat !== categoryName));
    toast({
      title: 'Success',
      description: 'Category deleted successfully'
    });
  };

  // Group laws by category
  const lawsByCategory = categories.reduce((acc, category) => {
    acc[category] = laws.filter(law => law.category === category);
    return acc;
  }, {} as Record<string, Law[]>);

  if (loading) {
    return <div className="text-center py-8">Loading laws...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Scale className="h-6 w-6 text-neon-purple" />
            Laws Management
          </h2>
          <p className="text-muted-foreground">Manage city laws and legislation</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsManagingCategories(!isManagingCategories)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Categories
          </Button>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-neon-purple hover:bg-neon-purple/80"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Law
          </Button>
        </div>
      </div>

      {isManagingCategories && (
        <Card className="bg-gaming-card border-gaming-border">
          <CardHeader>
            <CardTitle className="text-foreground">Category Management</CardTitle>
            <CardDescription>Add, edit, or delete law categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button onClick={handleAddCategory} size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Existing Categories</h4>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    {editingCategory?.old === category ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={editingCategory.new}
                          onChange={(e) => setEditingCategory({ ...editingCategory, new: e.target.value })}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleEditCategory(category, editingCategory.new);
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleEditCategory(category, editingCategory.new)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-foreground">{category}</span>
                        <Badge variant="secondary">
                          {lawsByCategory[category]?.length || 0} laws
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingCategory({ old: category, new: category })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Category</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the "{category}" category? 
                                {lawsByCategory[category]?.length > 0 && (
                                  <span className="text-red-600 block mt-2">
                                    This category contains {lawsByCategory[category].length} law(s). 
                                    You must move or delete these laws first.
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCategory(category)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={lawsByCategory[category]?.length > 0}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isCreating && (
        <Card className="bg-gaming-card border-gaming-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              {editingId ? 'Edit Law' : 'Create New Law'}
            </CardTitle>
            <CardDescription>
              {editingId ? 'Update the law details' : 'Add a new law to the legislation'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Law Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter law title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the law"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity Level</Label>
                  <Select
                    value={formData.severity_level}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, severity_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {severityLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fine">Fine Amount ($)</Label>
                  <Input
                    id="fine"
                    type="number"
                    min="0"
                    value={formData.fine_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, fine_amount: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jail">Jail Time (minutes)</Label>
                  <Input
                    id="jail"
                    type="number"
                    min="0"
                    value={formData.jail_time_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, jail_time_minutes: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order">Order Index</Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    value={formData.order_index}
                    onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-neon-purple hover:bg-neon-purple/80">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Update Law' : 'Create Law'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {laws.length === 0 ? (
        <Card className="bg-gaming-card border-gaming-border">
          <CardContent className="text-center py-12">
            <Scale className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Laws Found</h3>
            <p className="text-muted-foreground mb-4">Create your first law to get started.</p>
            <Button onClick={() => setIsCreating(true)} className="bg-neon-purple hover:bg-neon-purple/80">
              <Plus className="h-4 w-4 mr-2" />
              Add First Law
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {categories.map((category) => {
            const categoryLaws = lawsByCategory[category] || [];
            if (categoryLaws.length === 0) return null;
            
            return (
              <AccordionItem 
                key={category} 
                value={category}
                className="bg-gaming-card border-gaming-border rounded-lg"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{category}</h3>
                    <Badge variant="secondary">{categoryLaws.length} laws</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-4">
                    {categoryLaws.map((law) => (
                      <Card key={law.id} className="bg-muted/50 border-muted">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                <h4 className="font-semibold text-foreground">{law.title}</h4>
                                <Badge className={getSeverityColor(law.severity_level)}>
                                  {law.severity_level}
                                </Badge>
                                {!law.is_active && <Badge variant="secondary">Inactive</Badge>}
                              </div>
                              
                              <p className="text-muted-foreground text-sm">{law.description}</p>
                              
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-green-500" />
                                  <span>Fine: ${law.fine_amount.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-orange-500" />
                                  <span>Jail: {formatJailTime(law.jail_time_minutes)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(law)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Law</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{law.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(law.id)}
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
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};

export default LawsManager;