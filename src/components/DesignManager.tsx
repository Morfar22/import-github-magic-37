import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Palette, Type, Image, Save, RotateCcw, Download } from "lucide-react";

interface DesignSettings {
  hero_image_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_primary?: string;
  font_secondary?: string;
  border_radius?: string;
  shadow_intensity?: string;
  animation_speed?: string;
  server_name?: string;
  welcome_message?: string;
  custom_css?: string;
}

const DesignManager = () => {
  const [designSettings, setDesignSettings] = useState<DesignSettings>({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDesignSettings();
  }, []);

  const fetchDesignSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['design_settings', 'general_settings']);

      if (error) throw error;

      const settings: DesignSettings = {};
      data?.forEach(setting => {
        if (setting.setting_key === 'design_settings') {
          Object.assign(settings, setting.setting_value);
        } else if (setting.setting_key === 'general_settings') {
          const generalSettings = setting.setting_value as any;
          settings.server_name = generalSettings.server_name;
          settings.welcome_message = generalSettings.welcome_message;
        }
      });

      setDesignSettings(settings);
    } catch (error) {
      console.error('Error fetching design settings:', error);
      toast({
        title: "Error",
        description: "Failed to load design settings",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-image-${Date.now()}.${fileExt}`;
      const filePath = `design/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      setDesignSettings(prev => ({
        ...prev,
        hero_image_url: publicUrl
      }));

      toast({
        title: "Image Uploaded",
        description: "Hero image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const saveDesignSettings = async () => {
    setIsLoading(true);
    try {
      // Save design settings
      const designData = { ...designSettings };
      delete designData.server_name;
      delete designData.welcome_message;

      const { error: designError } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'design_settings',
          setting_value: designData,
          updated_at: new Date().toISOString()
        });

      if (designError) throw designError;

      // Save general settings if they exist
      if (designSettings.server_name || designSettings.welcome_message) {
        const { error: generalError } = await supabase
          .from('server_settings')
          .upsert({
            setting_key: 'general_settings',
            setting_value: {
              server_name: designSettings.server_name,
              welcome_message: designSettings.welcome_message
            },
            updated_at: new Date().toISOString()
          });

        if (generalError) throw generalError;
      }

      // Apply CSS changes to the document if custom CSS is provided
      if (designSettings.custom_css) {
        updateCustomCSS(designSettings.custom_css);
      }

      toast({
        title: "Settings Saved",
        description: "Design settings updated successfully. Refresh the page to see changes.",
      });
    } catch (error) {
      console.error('Error saving design settings:', error);
      toast({
        title: "Error",
        description: "Failed to save design settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomCSS = (css: string) => {
    // Remove existing custom style element if it exists
    const existingStyle = document.getElementById('custom-design-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new custom CSS
    if (css.trim()) {
      const style = document.createElement('style');
      style.id = 'custom-design-css';
      style.textContent = css;
      document.head.appendChild(style);
    }
  };

  const resetToDefaults = () => {
    setDesignSettings({
      primary_color: '#339999',
      secondary_color: '#f0e68c',
      accent_color: '#00ccff',
      background_color: '#1a1a1a',
      text_color: '#f5f5dc',
      font_primary: 'Orbitron',
      font_secondary: 'Inter',
      border_radius: '0.5rem',
      shadow_intensity: 'medium',
      animation_speed: 'normal',
      server_name: 'DREAMLIGHT RP',
      welcome_message: 'Experience the ultimate GTA V roleplay in our cyberpunk-themed city. Professional staff, custom content, and endless possibilities await.',
      custom_css: ''
    });
    
    toast({
      title: "Settings Reset",
      description: "Design settings reset to defaults",
    });
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(designSettings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'design-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Settings Exported",
      description: "Design settings exported successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Palette className="h-5 w-5 text-neon-teal" />
            <h2 className="text-xl font-semibold text-foreground">Design & Appearance Manager</h2>
          </div>
          <div className="flex space-x-2">
            <Button onClick={exportSettings} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={resetToDefaults} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={saveDesignSettings} disabled={isLoading} className="bg-neon-teal hover:bg-neon-teal/80">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save All'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="space-y-6">
            <Card className="p-4 bg-gaming-darker border-gaming-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                <Image className="h-5 w-5 mr-2 text-neon-teal" />
                Hero Image & Content
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Hero Background Image</Label>
                    <div className="mt-2 space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="bg-gaming-dark border-gaming-border text-foreground"
                      />
                      {designSettings.hero_image_url && (
                        <div className="mt-2">
                          <img 
                            src={designSettings.hero_image_url} 
                            alt="Hero preview" 
                            className="w-full h-32 object-cover rounded border border-gaming-border"
                          />
                        </div>
                      )}
                      {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                    </div>
                  </div>

                  <div>
                    <Label className="text-foreground">Server Name</Label>
                    <Input
                      value={designSettings.server_name || ''}
                      onChange={(e) => setDesignSettings(prev => ({ ...prev, server_name: e.target.value }))}
                      placeholder="DREAMLIGHT RP"
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-foreground">Welcome Message</Label>
                  <Textarea
                    value={designSettings.welcome_message || ''}
                    onChange={(e) => setDesignSettings(prev => ({ ...prev, welcome_message: e.target.value }))}
                    placeholder="Experience the ultimate GTA V roleplay..."
                    rows={6}
                    className="bg-gaming-dark border-gaming-border text-foreground"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="colors" className="space-y-6">
            <Card className="p-4 bg-gaming-darker border-gaming-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Color Scheme</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-foreground">Primary Color</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      type="color"
                      value={designSettings.primary_color || '#339999'}
                      onChange={(e) => setDesignSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-12 h-10 p-1 bg-gaming-dark border-gaming-border"
                    />
                    <Input
                      value={designSettings.primary_color || ''}
                      onChange={(e) => setDesignSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      placeholder="#339999"
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-foreground">Secondary Color</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      type="color"
                      value={designSettings.secondary_color || '#f0e68c'}
                      onChange={(e) => setDesignSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-12 h-10 p-1 bg-gaming-dark border-gaming-border"
                    />
                    <Input
                      value={designSettings.secondary_color || ''}
                      onChange={(e) => setDesignSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      placeholder="#f0e68c"
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-foreground">Accent Color</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      type="color"
                      value={designSettings.accent_color || '#00ccff'}
                      onChange={(e) => setDesignSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="w-12 h-10 p-1 bg-gaming-dark border-gaming-border"
                    />
                    <Input
                      value={designSettings.accent_color || ''}
                      onChange={(e) => setDesignSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                      placeholder="#00ccff"
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-foreground">Background Color</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      type="color"
                      value={designSettings.background_color || '#1a1a1a'}
                      onChange={(e) => setDesignSettings(prev => ({ ...prev, background_color: e.target.value }))}
                      className="w-12 h-10 p-1 bg-gaming-dark border-gaming-border"
                    />
                    <Input
                      value={designSettings.background_color || ''}
                      onChange={(e) => setDesignSettings(prev => ({ ...prev, background_color: e.target.value }))}
                      placeholder="#1a1a1a"
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-foreground">Text Color</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      type="color"
                      value={designSettings.text_color || '#f5f5dc'}
                      onChange={(e) => setDesignSettings(prev => ({ ...prev, text_color: e.target.value }))}
                      className="w-12 h-10 p-1 bg-gaming-dark border-gaming-border"
                    />
                    <Input
                      value={designSettings.text_color || ''}
                      onChange={(e) => setDesignSettings(prev => ({ ...prev, text_color: e.target.value }))}
                      placeholder="#f5f5dc"
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="typography" className="space-y-6">
            <Card className="p-4 bg-gaming-darker border-gaming-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                <Type className="h-5 w-5 mr-2 text-neon-teal" />
                Typography Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-foreground">Primary Font (Headings)</Label>
                  <Input
                    value={designSettings.font_primary || ''}
                    onChange={(e) => setDesignSettings(prev => ({ ...prev, font_primary: e.target.value }))}
                    placeholder="Orbitron"
                    className="bg-gaming-dark border-gaming-border text-foreground"
                  />
                  <p className="text-sm text-muted-foreground mt-1">e.g., Orbitron, Arial, sans-serif</p>
                </div>

                <div>
                  <Label className="text-foreground">Secondary Font (Body Text)</Label>
                  <Input
                    value={designSettings.font_secondary || ''}
                    onChange={(e) => setDesignSettings(prev => ({ ...prev, font_secondary: e.target.value }))}
                    placeholder="Inter"
                    className="bg-gaming-dark border-gaming-border text-foreground"
                  />
                  <p className="text-sm text-muted-foreground mt-1">e.g., Inter, Arial, sans-serif</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            <Card className="p-4 bg-gaming-darker border-gaming-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Layout & Effects</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-foreground">Border Radius</Label>
                  <Input
                    value={designSettings.border_radius || ''}
                    onChange={(e) => setDesignSettings(prev => ({ ...prev, border_radius: e.target.value }))}
                    placeholder="0.5rem"
                    className="bg-gaming-dark border-gaming-border text-foreground"
                  />
                </div>

                <div>
                  <Label className="text-foreground">Shadow Intensity</Label>
                  <select
                    value={designSettings.shadow_intensity || 'medium'}
                    onChange={(e) => setDesignSettings(prev => ({ ...prev, shadow_intensity: e.target.value }))}
                    className="w-full p-2 bg-gaming-dark border border-gaming-border rounded text-foreground"
                  >
                    <option value="none">None</option>
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="heavy">Heavy</option>
                  </select>
                </div>

                <div>
                  <Label className="text-foreground">Animation Speed</Label>
                  <select
                    value={designSettings.animation_speed || 'normal'}
                    onChange={(e) => setDesignSettings(prev => ({ ...prev, animation_speed: e.target.value }))}
                    className="w-full p-2 bg-gaming-dark border border-gaming-border rounded text-foreground"
                  >
                    <option value="slow">Slow</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast</option>
                    <option value="none">Disabled</option>
                  </select>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card className="p-4 bg-gaming-darker border-gaming-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Advanced Customization</h3>
              
              <div>
                <Label className="text-foreground">Custom CSS</Label>
                <Textarea
                  value={designSettings.custom_css || ''}
                  onChange={(e) => setDesignSettings(prev => ({ ...prev, custom_css: e.target.value }))}
                  placeholder="/* Add your custom CSS here */
.custom-element {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  border-radius: 10px;
}"
                  rows={12}
                  className="bg-gaming-dark border-gaming-border text-foreground font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Add custom CSS to override or extend the default styling. Changes will be applied immediately after saving.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default DesignManager;