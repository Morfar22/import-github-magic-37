import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Feature {
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface CtaSection {
  title: string;
  description: string;
  features: string[];
}

interface HomepageContentManagerProps {
  userId?: string;
}

const HomepageContentManager = ({ userId }: HomepageContentManagerProps) => {
  const [homepageFeatures, setHomepageFeatures] = useState<Feature[]>([]);
  const [homepageFeaturesSection, setHomepageFeaturesSection] = useState({
    title: "Why Choose Dreamlight RP?",
    description: "We've built the most immersive FiveM experience with attention to every detail"
  });
  const [homepageCta, setHomepageCta] = useState<CtaSection>({
    title: "",
    description: "",
    features: []
  });
  const [editingFeature, setEditingFeature] = useState<number | null>(null);
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [newFeature, setNewFeature] = useState<Feature>({
    title: "",
    description: "",
    icon: "Users",
    color: "text-neon-purple"
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchHomepageContent();
  }, []);

  const fetchHomepageContent = async () => {
    try {
      const [featuresRes, featuresSectionRes, ctaRes] = await Promise.all([
        supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'homepage_features')
          .maybeSingle(),
        supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'homepage_features_section')
          .maybeSingle(),
        supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'homepage_cta_section')
          .maybeSingle()
      ]);

      if (featuresRes.data?.setting_value) {
        setHomepageFeatures(featuresRes.data.setting_value as any);
      }
      if (featuresSectionRes.data?.setting_value) {
        setHomepageFeaturesSection(featuresSectionRes.data.setting_value as any);
      }
      if (ctaRes.data?.setting_value) {
        setHomepageCta(ctaRes.data.setting_value as any);
      }
    } catch (error) {
      console.error('Error fetching homepage content:', error);
    }
  };

  const handleSaveHomepageFeatures = async () => {
    try {
      const { error } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'homepage_features',
          setting_value: homepageFeatures as any,
          created_by: userId
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Homepage features updated successfully",
      });
    } catch (error) {
      console.error('Error updating homepage features:', error);
      toast({
        title: "Error",
        description: "Failed to update homepage features",
        variant: "destructive",
      });
    }
  };

  const handleSaveHomepageFeaturesSection = async () => {
    try {
      const { error } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'homepage_features_section',
          setting_value: homepageFeaturesSection as any,
          created_by: userId
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Features section header updated successfully",
      });
    } catch (error) {
      console.error('Error updating features section header:', error);
      toast({
        title: "Error",
        description: "Failed to update features section header",
        variant: "destructive",
      });
    }
  };

  const handleSaveHomepageCta = async () => {
    try {
      const { error } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'homepage_cta_section',
          setting_value: homepageCta as any,
          created_by: userId
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Homepage CTA section updated successfully",
      });
    } catch (error) {
      console.error('Error updating homepage CTA:', error);
      toast({
        title: "Error",
        description: "Failed to update homepage CTA section",
        variant: "destructive",
      });
    }
  };

  const handleSaveFeature = () => {
    if (editingFeature !== null) {
      const updatedFeatures = [...homepageFeatures];
      updatedFeatures[editingFeature] = newFeature;
      setHomepageFeatures(updatedFeatures);
    } else {
      setHomepageFeatures([...homepageFeatures, newFeature]);
    }
    
    setNewFeature({ title: "", description: "", icon: "Users", color: "text-neon-purple" });
    setEditingFeature(null);
    setShowFeatureDialog(false);
  };

  const handleDeleteFeature = (index: number) => {
    const updatedFeatures = homepageFeatures.filter((_, i) => i !== index);
    setHomepageFeatures(updatedFeatures);
  };

  const addCtaFeature = () => {
    setHomepageCta({
      ...homepageCta,
      features: [...homepageCta.features, ""]
    });
  };

  const updateCtaFeature = (index: number, value: string) => {
    const updatedFeatures = [...homepageCta.features];
    updatedFeatures[index] = value;
    setHomepageCta({
      ...homepageCta,
      features: updatedFeatures
    });
  };

  const removeCtaFeature = (index: number) => {
    const updatedFeatures = homepageCta.features.filter((_, i) => i !== index);
    setHomepageCta({
      ...homepageCta,
      features: updatedFeatures
    });
  };

  return (
    <div className="space-y-6">
      {/* Features Section Header Management */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <CardTitle className="text-foreground">"Why Choose [Server Name]?" Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="features-section-title">Section Title</Label>
            <Input
              id="features-section-title"
              value={homepageFeaturesSection.title}
              onChange={(e) => setHomepageFeaturesSection({...homepageFeaturesSection, title: e.target.value})}
              className="bg-background border-input"
              placeholder="Why Choose Dreamlight RP?"
            />
          </div>
          <div>
            <Label htmlFor="features-section-description">Section Description</Label>
            <Textarea
              id="features-section-description"
              value={homepageFeaturesSection.description}
              onChange={(e) => setHomepageFeaturesSection({...homepageFeaturesSection, description: e.target.value})}
              className="bg-background border-input"
              rows={3}
              placeholder="We've built the most immersive FiveM experience..."
            />
          </div>
          <Button onClick={handleSaveHomepageFeaturesSection} className="w-full">
            Save Section Header
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Features Cards */}
        <Card className="bg-gaming-card border-gaming-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center justify-between">
              Feature Cards
              <Button
                onClick={() => {
                  setNewFeature({ title: "", description: "", icon: "Users", color: "text-neon-purple" });
                  setEditingFeature(null);
                  setShowFeatureDialog(true);
                }}
                size="sm"
                className="bg-neon-purple hover:bg-neon-purple/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Feature
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {homepageFeatures.map((feature, index) => (
              <div key={index} className="bg-gaming-dark p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-foreground">{feature.title}</h4>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        setNewFeature(feature);
                        setEditingFeature(index);
                        setShowFeatureDialog(true);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteFeature(index)}
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
                <div className="flex items-center mt-2 space-x-2">
                  <span className="text-xs bg-background px-2 py-1 rounded">Icon: {feature.icon}</span>
                  <span className={`text-xs px-2 py-1 rounded ${feature.color}`}>Color Preview</span>
                </div>
              </div>
            ))}
            
            <Button onClick={handleSaveHomepageFeatures} className="w-full mt-4">
              Save Features
            </Button>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gaming-card border-gaming-border">
          <CardHeader>
            <CardTitle className="text-foreground">Ready to Join the Future? Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cta-title">Title</Label>
              <Input
                id="cta-title"
                value={homepageCta.title}
                onChange={(e) => setHomepageCta({...homepageCta, title: e.target.value})}
                className="bg-background border-input"
              />
            </div>

            <div>
              <Label htmlFor="cta-description">Description</Label>
              <Textarea
                id="cta-description"
                value={homepageCta.description}
                onChange={(e) => setHomepageCta({...homepageCta, description: e.target.value})}
                className="bg-background border-input"
                rows={4}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Features List</Label>
                <Button onClick={addCtaFeature} size="sm" variant="outline">
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              {homepageCta.features?.map((feature: string, index: number) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateCtaFeature(index, e.target.value)}
                    className="bg-background border-input"
                    placeholder="Feature description"
                  />
                  <Button
                    onClick={() => removeCtaFeature(index)}
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            <Button onClick={handleSaveHomepageCta} className="w-full">
              Save CTA Section
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feature Dialog */}
      <Dialog open={showFeatureDialog} onOpenChange={setShowFeatureDialog}>
        <DialogContent className="bg-gaming-card border-gaming-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingFeature !== null ? 'Edit Feature' : 'Add New Feature'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="feature-title">Title</Label>
              <Input
                id="feature-title"
                value={newFeature.title}
                onChange={(e) => setNewFeature({...newFeature, title: e.target.value})}
                className="bg-background border-input"
              />
            </div>
            <div>
              <Label htmlFor="feature-description">Description</Label>
              <Textarea
                id="feature-description"
                value={newFeature.description}
                onChange={(e) => setNewFeature({...newFeature, description: e.target.value})}
                className="bg-background border-input"
              />
            </div>
            <div>
              <Label htmlFor="feature-icon">Icon (Lucide icon name)</Label>
              <Input
                id="feature-icon"
                value={newFeature.icon}
                onChange={(e) => setNewFeature({...newFeature, icon: e.target.value})}
                className="bg-background border-input"
                placeholder="e.g., Users, Shield, Map, Clock"
              />
            </div>
            <div>
              <Label htmlFor="feature-color">Color Class</Label>
              <Input
                id="feature-color"
                value={newFeature.color}
                onChange={(e) => setNewFeature({...newFeature, color: e.target.value})}
                className="bg-background border-input"
                placeholder="e.g., text-neon-purple, text-neon-blue"
              />
            </div>
            <Button onClick={handleSaveFeature} className="w-full">
              {editingFeature !== null ? 'Update Feature' : 'Add Feature'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomepageContentManager;