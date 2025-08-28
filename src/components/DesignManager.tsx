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
  border_color?: string;
  card_color?: string;
  muted_color?: string;
  destructive_color?: string;
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

  useEffect(() => {
    if (Object.keys(designSettings).length > 0) {
      applyDesignSettings(designSettings);
    }
  }, [designSettings]);

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
      toast({ title: "Error", description: "Failed to load design settings", variant: "destructive" });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please upload an image smaller than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-image-${Date.now()}.${fileExt}`;
      const filePath = `hero/${fileName}`;

      // Upload to the dedicated design-assets bucket
      const { error: uploadError } = await supabase.storage
        .from('design-assets')
        .upload(filePath, file);
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('design-assets')
        .getPublicUrl(filePath);

      setDesignSettings(prev => ({
        ...prev,
        hero_image_url: publicUrl
      }));

      toast({ title: "Image Uploaded", description: "Hero image uploaded successfully" });
    } catch (error) {
      console.error('Hero image upload error:', error);
      toast({ title: "Upload Failed", description: "Failed to upload image. Check console for details.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const saveDesignSettings = async () => {
    setIsLoading(true);
    try {
      const designData = { ...designSettings };
      delete designData.server_name;
      delete designData.welcome_message;
      const { error: designError } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'design_settings',
          setting_value: designData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });
      if (designError) throw designError;

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
          }, { onConflict: 'setting_key' });
        if (generalError) throw generalError;
      }

      applyDesignSettings(designSettings);
      toast({ title: "Settings Saved & Applied", description: "Design settings updated and applied successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save design settings", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const applyDesignSettings = (settings: DesignSettings) => {
    const root = document.documentElement;

    // Colors to CSS
    if (settings.primary_color) {
      const hsl = hexToHsl(settings.primary_color);
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--neon-teal', hsl);
      root.style.setProperty('--teal-primary', hsl);
    }
    if (settings.secondary_color) {
      const hsl = hexToHsl(settings.secondary_color);
      root.style.setProperty('--secondary', hsl);
      root.style.setProperty('--neon-gold', hsl);
      root.style.setProperty('--cyber-gold', hsl);
      root.style.setProperty('--golden-primary', hsl);
    }
    if (settings.accent_color) {
      const hsl = hexToHsl(settings.accent_color);
      root.style.setProperty('--accent', hsl);
      root.style.setProperty('--neon-blue', hsl);
    }
    if (settings.background_color) {
      const hsl = hexToHsl(settings.background_color);
      root.style.setProperty('--background', hsl);
      root.style.setProperty('--gaming-dark', hsl);
      root.style.setProperty('--gaming-darker', adjustHslBrightness(hsl, -10));
    }
    if (settings.text_color) {
      const hsl = hexToHsl(settings.text_color);
      root.style.setProperty('--foreground', hsl);
      root.style.setProperty('--neon-cream', hsl);
      root.style.setProperty('--patriot-cream', hsl);
    }
    if (settings.border_color) {
      const hsl = hexToHsl(settings.border_color);
      root.style.setProperty('--border', hsl);
      root.style.setProperty('--gaming-border', hsl);
    }
    if (settings.card_color) {
      const hsl = hexToHsl(settings.card_color);
      root.style.setProperty('--card', hsl);
      root.style.setProperty('--gaming-card', hsl);
    }
    if (settings.muted_color) {
      const hsl = hexToHsl(settings.muted_color);
      root.style.setProperty('--muted', hsl);
    }
    if (settings.destructive_color) {
      const hsl = hexToHsl(settings.destructive_color);
      root.style.setProperty('--destructive', hsl);
    }

    // Additional color mappings
    if (settings.primary_color) {
      const hsl = hexToHsl(settings.primary_color);
      root.style.setProperty('--primary-foreground', adjustHslBrightness(hsl, 90));
    }
    if (settings.secondary_color) {
      const hsl = hexToHsl(settings.secondary_color);
      root.style.setProperty('--secondary-foreground', adjustHslBrightness(hsl, -50));
    }
    if (settings.card_color) {
      const hsl = hexToHsl(settings.card_color);
      root.style.setProperty('--card-foreground', adjustHslBrightness(hsl, 80));
    }
    if (settings.muted_color) {
      const hsl = hexToHsl(settings.muted_color);
      root.style.setProperty('--muted-foreground', adjustHslBrightness(hsl, 40));
    }

    // Fonts
    if (settings.font_primary) root.style.setProperty('--font-primary', settings.font_primary);
    if (settings.font_secondary) root.style.setProperty('--font-secondary', settings.font_secondary);

    // Layout
    if (settings.border_radius) root.style.setProperty('--radius', settings.border_radius);

    // Custom CSS always live - fixed functionality
    updateCustomCSS(settings.custom_css || '');

    // Hero image
    if (settings.hero_image_url) {
      const heroSections = document.querySelectorAll('[data-hero-bg]');
      heroSections.forEach(section => {
        (section as HTMLElement).style.backgroundImage = `url(${settings.hero_image_url})`;
      });
    }
  };

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    const l = sum / 2;
    let h = 0, s = 0;
    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - sum) : diff / sum;
      switch (max) {
        case r: h = ((g - b) / diff) + (g < b ? 6 : 0); break;
        case g: h = (b - r) / diff + 2; break;
        case b: h = (r - g) / diff + 4; break;
      }
      h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const adjustHslBrightness = (hsl: string, adjustment: number): string => {
    const [h, s, l] = hsl.split(' ');
    const lightness = parseInt(l.replace('%', ''));
    const newLightness = Math.max(0, Math.min(100, lightness + adjustment));
    return `${h} ${s} ${newLightness}%`;
  };

  const updateCustomCSS = (css: string) => {
    const existingStyle = document.getElementById('custom-design-css');
    if (existingStyle) existingStyle.remove();
    if (css && css.trim()) {
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
      server_name: 'Adventure RP',
      welcome_message: 'Experience the ultimate GTA V roleplay in our cyberpunk-themed city. Professional staff, custom content, and endless possibilities await.',
      custom_css: ''
    });
    toast({ title: "Settings Reset", description: "Design settings reset to defaults" });
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

    toast({ title: "Settings Exported", description: "Design settings exported successfully" });
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
                      placeholder="adventurerp"
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
                {/* Layout Fields */}
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
                  onChange={e => {
                    const custom_css = e.target.value;
                    setDesignSettings(prev => ({ ...prev, custom_css }));
                    updateCustomCSS(custom_css); // live update
                  }}
                  placeholder="/* Add your custom CSS here */"
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
