import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ServerSettings {
  general_settings: {
    server_name: string;
    welcome_message: string;
    maintenance_mode: boolean;
  };
  application_settings: {
    accept_applications: boolean;
    multiple_applications_allowed?: boolean;
  };
  security_settings: {
    require_2fa: boolean;
    ip_whitelist: boolean;
    whitelisted_ips?: string[];
  };
  performance_settings: {
    monitoring: boolean;
  };
  discord_settings: {
    server_id: string;
    auto_roles: boolean;
    sync_roles: boolean;
  };
  discord_logging: {
    enabled: boolean;
    webhook_url: string;
    log_rule_changes: boolean;
    log_user_actions: boolean;
    log_system_changes: boolean;
    log_application_actions: boolean;
  };
}

interface ServerSettingsContextType {
  settings: ServerSettings;
  loading: boolean;
  updateSetting: (key: keyof ServerSettings, value: any) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: ServerSettings = {
  general_settings: {
    server_name: 'Dreamlight RP',
    welcome_message: 'Welcome to our server!',
    maintenance_mode: false,
  },
  application_settings: {
    accept_applications: true,
    multiple_applications_allowed: false,
  },
  security_settings: {
    require_2fa: false,
    ip_whitelist: false,
    whitelisted_ips: [],
  },
  performance_settings: {
    monitoring: false,
  },
  discord_settings: {
    server_id: '',
    auto_roles: false,
    sync_roles: false,
  },
  discord_logging: {
    enabled: false,
    webhook_url: '',
    log_rule_changes: true,
    log_user_actions: true,
    log_system_changes: true,
    log_application_actions: true,
  },
};

const ServerSettingsContext = createContext<ServerSettingsContextType | undefined>(undefined);

export const ServerSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ServerSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'general_settings',
          'application_settings', 
          'security_settings',
          'performance_settings',
          'discord_settings',
          'discord_logging'
        ]);

      if (error) throw error;

      const newSettings = { ...defaultSettings };
      
      data?.forEach(setting => {
        if (setting.setting_value && typeof setting.setting_value === 'object') {
          newSettings[setting.setting_key as keyof ServerSettings] = setting.setting_value as any;
        }
      });

      setSettings(newSettings);
    } catch (error) {
      console.error('Error fetching server settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof ServerSettings, value: any) => {
    try {
      const { error } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          created_by: user?.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    setLoading(true);
    await fetchSettings();
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <ServerSettingsContext.Provider value={{
      settings,
      loading,
      updateSetting,
      refreshSettings
    }}>
      {children}
    </ServerSettingsContext.Provider>
  );
};

export const useServerSettings = () => {
  const context = useContext(ServerSettingsContext);
  if (context === undefined) {
    throw new Error('useServerSettings must be used within a ServerSettingsProvider');
  }
  return context;
};