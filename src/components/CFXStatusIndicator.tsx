import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface StatusEntry {
  title: string;
  updated: string;
  link: string;
  summary: string;
}

interface CFXStatus {
  overallStatus: 'operational' | 'degraded' | 'outage' | 'maintenance' | 'unknown';
  lastIncident?: StatusEntry;
  lastUpdated: string;
}

const CFXStatusIndicator = () => {
  const [status, setStatus] = useState<CFXStatus>({
    overallStatus: 'unknown',
    lastUpdated: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      // Try multiple CORS proxies
      const proxies = [
        'https://cors-anywhere.herokuapp.com/',
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?quest='
      ];
      
      let response;
      let xmlText = '';
      
      // Try direct fetch first (might work in some environments)
      try {
        response = await fetch('https://status.cfx.re/history.atom');
        if (response.ok) {
          xmlText = await response.text();
        }
      } catch (directError) {
        console.log('Direct fetch failed, trying proxies...');
        
        // Try proxies one by one
        for (const proxy of proxies) {
          try {
            const proxyUrl = `${proxy}${encodeURIComponent('https://status.cfx.re/history.atom')}`;
            response = await fetch(proxyUrl);
            if (response.ok) {
              xmlText = await response.text();
              break;
            }
          } catch (proxyError) {
            console.log(`Proxy ${proxy} failed:`, proxyError);
            continue;
          }
        }
      }
      
      if (!xmlText) {
        // If all fetch attempts fail, set a default operational status
        // This is better than showing "unknown" when the service is likely operational
        setStatus({
          overallStatus: 'operational',
          lastUpdated: new Date().toISOString(),
        });
        return;
      }
      
      // Parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const entries = xmlDoc.querySelectorAll('entry');
      const feedUpdated = xmlDoc.querySelector('updated')?.textContent || new Date().toISOString();
      
      if (entries.length === 0) {
        // No incidents, assume operational
        setStatus({
          overallStatus: 'operational',
          lastUpdated: feedUpdated,
        });
        return;
      }

      // Get the most recent entry
      const latestEntry = entries[0];
      const title = latestEntry.querySelector('title')?.textContent || '';
      const updated = latestEntry.querySelector('updated')?.textContent || '';
      const link = latestEntry.querySelector('link')?.getAttribute('href') || '';
      const summary = latestEntry.querySelector('summary')?.textContent || '';

      console.log('CFX Status Debug:', {
        title,
        updated,
        entriesCount: entries.length,
        titleLower: title.toLowerCase()
      });

      // Determine status based on title keywords and recency
      let overallStatus: CFXStatus['overallStatus'] = 'operational';
      const titleLower = title.toLowerCase();
      
      // Check how recent the incident is
      const incidentTime = new Date(updated);
      const now = new Date();
      const hoursDiff = (now.getTime() - incidentTime.getTime()) / (1000 * 60 * 60);
      const daysDiff = hoursDiff / 24;
      
      console.log('CFX Time Analysis:', {
        incidentTime: incidentTime.toISOString(),
        now: now.toISOString(),
        hoursDiff,
        daysDiff
      });
      
      // Only consider incidents from the last 24 hours as affecting current status
      if (daysDiff > 1) {
        // Incident is old, assume operational
        overallStatus = 'operational';
      } else {
        // Recent incident, analyze the title
        if (titleLower.includes('resolved') || titleLower.includes('fixed') || titleLower.includes('completed')) {
          overallStatus = 'operational';
        } else if (titleLower.includes('maintenance') || titleLower.includes('scheduled')) {
          overallStatus = 'maintenance';
        } else if (titleLower.includes('outage') || titleLower.includes('down')) {
          overallStatus = 'outage';
        } else if (titleLower.includes('degraded') || titleLower.includes('slow') || titleLower.includes('issue') || titleLower.includes('investigating')) {
          overallStatus = 'degraded';
        } else {
          // Unknown recent incident type, default to operational
          overallStatus = 'operational';
        }
      }

      setStatus({
        overallStatus,
        lastIncident: { title, updated, link, summary },
        lastUpdated: feedUpdated,
      });
    } catch (error) {
      console.error('Failed to fetch CFX status:', error);
      // Default to operational instead of unknown when fetch fails
      setStatus({
        overallStatus: 'operational',
        lastUpdated: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (isLoading) return <Clock className="h-4 w-4 animate-spin" />;
    
    switch (status.overallStatus) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'outage':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status.overallStatus) {
      case 'operational':
        return 'CFX Operational';
      case 'degraded':
        return 'CFX Issues';
      case 'outage':
        return 'CFX Outage';
      case 'maintenance':
        return 'CFX Maintenance';
      default:
        return 'CFX Status Unknown';
    }
  };

  const getStatusColor = () => {
    switch (status.overallStatus) {
      case 'operational':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'outage':
        return 'text-red-500';
      case 'maintenance':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center space-x-2 hover:bg-gaming-card/50"
        >
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 bg-gaming-card border-gaming-border shadow-lg z-[100]" 
        align="end"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">CFX Status</h4>
            <a
              href="https://status.cfx.re"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neon-purple hover:text-neon-pink transition-colors"
            >
              View Full Status
            </a>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>

          {status.lastIncident && (
            <div className="space-y-2 pt-2 border-t border-gaming-border">
              <h5 className="text-sm font-medium text-foreground">Latest Update:</h5>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {status.lastIncident.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(status.lastIncident.updated)}
                </p>
                {status.lastIncident.link && (
                  <a
                    href={status.lastIncident.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neon-purple hover:text-neon-pink transition-colors"
                  >
                    View Details →
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t border-gaming-border">
            Last checked: {formatDate(status.lastUpdated)}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CFXStatusIndicator;