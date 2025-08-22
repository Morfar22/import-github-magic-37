import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { Shield, Users, Car, Heart, AlertCircle, ChevronDown, Edit3, Save, X, Plus, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Rules = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [importantNotes, setImportantNotes] = useState<string[]>([]);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotes, setEditNotes] = useState<string[]>([]);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if user is staff
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    fetchRules();
    fetchImportantNotes();
    checkStaffStatus();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from("rules")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("order_index", { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error("Error fetching rules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchImportantNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'important_notes')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const notes = (data?.setting_value as any)?.notes || [
        "Staff beslutninger er endelige. Respektér deres autoritet.",
        "Rapportér regelbrud via Discord/support.",
        "Ignorance er ikke en undskyldning. Hold dig opdateret.",
        "Regler opdateres løbende. Tjek ofte for ændringer."
      ];
      setImportantNotes(notes);
    } catch (error) {
      console.error('Error fetching important notes:', error);
    }
  };

  const checkStaffStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('is_staff', { _user_id: user.id });
      if (error) throw error;
      setIsStaff(data || false);
    } catch (error) {
      console.error('Error checking staff status:', error);
    }
  };

  const startEditingNotes = () => {
    setEditNotes([...importantNotes]);
    setIsEditingNotes(true);
  };

  const cancelEditingNotes = () => {
    setEditNotes([]);
    setIsEditingNotes(false);
  };

  const addNewNote = () => {
    setEditNotes([...editNotes, ""]);
  };

  const updateNote = (index: number, value: string) => {
    const updated = [...editNotes];
    updated[index] = value;
    setEditNotes(updated);
  };

  const removeNote = (index: number) => {
    const updated = editNotes.filter((_, i) => i !== index);
    setEditNotes(updated);
  };

  const saveImportantNotes = async () => {
    setIsSavingNotes(true);
    try {
      const filteredNotes = editNotes.filter(note => note.trim() !== "");
      
      const { error } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'important_notes',
          setting_value: { notes: filteredNotes },
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (error) throw error;

      setImportantNotes(filteredNotes);
      setIsEditingNotes(false);
      setEditNotes([]);
      
      toast({
        title: "Success",
        description: "Important notes updated successfully!",
      });
    } catch (error) {
      console.error('Error saving important notes:', error);
      toast({
        title: "Error",
        description: "Failed to save important notes",
        variant: "destructive"
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Server Regler":
      case "General Rules":
        return Shield;
      case "Allow List":
        return Users;
      case "Crime & Police":
        return Car;
      case "EMS & Medical":
        return Heart;
      case "Bande Regler":
        return Users;
      default:
        return Shield;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Server Regler":
      case "General Rules":
        return "text-neon-purple";
      case "Allow List":
      case "Bande Regler":
        return "text-neon-blue";
      case "Crime & Police":
        return "text-neon-green";
      case "EMS & Medical":
        return "text-red-400";
      default:
        return "text-neon-purple";
    }
  };

  // Group rules by category
  const ruleCategories = rules.reduce((acc: any, rule: any) => {
    if (!acc[rule.category]) acc[rule.category] = [];
    acc[rule.category].push(rule);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading rules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">Server Rules</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Følg reglerne for at sikre den bedste RP-oplevelse for alle.<br />
            Staff kan opdatere regler dynamisk via panel!
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(ruleCategories).map(([categoryName, categoryRules]: [string, any]) => {
            const IconComponent = getCategoryIcon(categoryName);
            const color = getCategoryColor(categoryName);

            const isOpen = openCategory === categoryName;

            return (
              <Card key={categoryName} className="p-0 bg-gaming-card border-gaming-border shadow-gaming transition-all duration-300">
                <button
                  type="button"
                  className="w-full flex items-center px-6 py-4 focus:outline-none hover:bg-gaming-border/20 transition-colors"
                  onClick={() => setOpenCategory(isOpen ? null : categoryName)}
                  aria-expanded={isOpen}
                  aria-controls={`category-panel-${categoryName}`}
                >
                  <IconComponent className={`h-6 w-6 ${color} mr-2`} />
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">{categoryName}</h2>
                  <Badge variant="secondary" className="ml-3">{categoryRules.length} regler</Badge>
                  <ChevronDown className={`ml-auto h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`} />
                </button>

                {isOpen && (
                  <div
                    id={`category-panel-${categoryName}`}
                    className="px-6 pb-6 animate-fade-in"
                    role="region"
                  >
                    <ul className="space-y-4 mt-2">
                      {categoryRules.map((rule: any) => (
                        <li key={rule.id} className="flex items-start space-x-2">
                          <span className={`w-2 h-2 rounded-full ${color.replace("text-", "bg-")} mt-2 flex-shrink-0`} />
                          <div>
                            <div className="text-base font-medium text-foreground">{rule.title}</div>
                            <div className="text-muted-foreground text-sm">{rule.description}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {Object.keys(ruleCategories).length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Ingen regler fundet. Kontakt staff for at oprette server regler.</p>
          </div>
        )}

        <Card className="group mt-8 p-0 bg-gradient-to-br from-gaming-card via-gaming-card to-gaming-darker border-gaming-border shadow-gaming hover:shadow-gaming-glow transition-all duration-500 animate-fade-in overflow-hidden">
          {/* Header with gradient background */}
          <div className="px-6 py-4 bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-neon-teal/10 border-b border-gaming-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 backdrop-blur-sm">
                  <Info className="h-5 w-5 text-neon-blue" />
                </div>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                  Vigtige Noter
                </h2>
              </div>
              {isStaff && !isEditingNotes && (
                <Button
                  onClick={startEditingNotes}
                  size="sm"
                  variant="outline"
                  className="border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 hover:border-neon-blue transition-all duration-300"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isEditingNotes ? (
              <div className="space-y-4">
                {editNotes.map((note, index) => (
                  <div key={index} className="flex items-start space-x-2 group/item">
                    <div className="flex-1">
                      <Textarea
                        value={note}
                        onChange={(e) => updateNote(index, e.target.value)}
                        placeholder="Enter important note..."
                        className="min-h-[60px] bg-gaming-darker border-gaming-border focus:border-neon-blue transition-colors resize-none"
                      />
                    </div>
                    <Button
                      onClick={() => removeNote(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10 opacity-0 group-hover/item:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  onClick={addNewNote}
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed border-gaming-border hover:border-neon-teal text-neon-teal hover:bg-neon-teal/10 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>

                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gaming-border">
                  <Button
                    onClick={cancelEditingNotes}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={saveImportantNotes}
                    disabled={isSavingNotes}
                    size="sm"
                    className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 transition-all duration-300"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSavingNotes ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {importantNotes.map((note, index) => (
                  <div 
                    key={index} 
                    className="flex items-start space-x-3 group/note p-3 rounded-lg bg-gaming-darker/50 hover:bg-gaming-darker transition-all duration-300 hover-scale"
                  >
                    <div className="p-1 rounded-full bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 mt-1 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple" />
                    </div>
                    <p className="text-muted-foreground group-hover/note:text-foreground transition-colors leading-relaxed">
                      {note}
                    </p>
                  </div>
                ))}
                {importantNotes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No important notes configured yet.</p>
                    {isStaff && (
                      <p className="text-sm mt-1">Click Edit to add some notes.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Rules;
