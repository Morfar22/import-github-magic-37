import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GoogleAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  fullWidthResponsive?: boolean;
  className?: string;
}

const GoogleAd = ({ 
  adSlot, 
  adFormat = 'auto', 
  fullWidthResponsive = true,
  className = ''
}: GoogleAdProps) => {
  const [publisherId, setPublisherId] = useState<string>('');

  useEffect(() => {
    fetchPublisherId();
  }, []);

  const fetchPublisherId = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'google_adsense_publisher_id')
        .maybeSingle();

      if (error) {
        console.error('Error fetching AdSense publisher ID:', error);
        return;
      }

      if (data?.setting_value) {
        setPublisherId(data.setting_value as string);
      }
    } catch (error) {
      console.error('Error fetching AdSense publisher ID:', error);
    }
  };

  useEffect(() => {
    if (publisherId) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  }, [publisherId]);

  // Don't render if no publisher ID is configured
  if (!publisherId) {
    return null;
  }

  return (
    <div className={`google-ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive}
      />
    </div>
  );
};

export default GoogleAd;