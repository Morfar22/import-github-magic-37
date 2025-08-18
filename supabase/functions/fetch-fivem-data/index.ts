import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FiveMServerConfig {
  id: string;
  name: string;
  ip: string;
  port: number;
  coordinates: [number, number];
  region: string;
}

interface FiveMPlayer {
  id: number;
  name: string;
  ping: number;
  identifiers: string[];
}

interface FiveMServerData {
  hostname: string;
  clients: number;
  maxclients: number;
  players: FiveMPlayer[];
  resources: string[];
  server: string;
  vars: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching FiveM server data...");

    // Get server configuration from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Fetch server settings from database
    const settingsResponse = await fetch(
      `${supabaseUrl}/rest/v1/server_settings?select=setting_key,setting_value&setting_key=in.(fivem_server_ip,fivem_server_port,fivem_server_name)`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'apikey': supabaseServiceRoleKey,
          'Content-Type': 'application/json'
        }
      }
    );

    const settingsData = await settingsResponse.json();
    console.log("Server settings from database:", settingsData);

    // Parse settings into a map
    const settings: Record<string, string> = {};
    if (Array.isArray(settingsData)) {
      settingsData.forEach((setting: any) => {
        settings[setting.setting_key] = setting.setting_value;
      });
    }

    // Your FiveM server configurations from database or fallback defaults
    const servers: FiveMServerConfig[] = [
      {
        id: "main",
        name: settings.fivem_server_name || "Dreamlight RP - Main",
        ip: settings.fivem_server_ip || "YOUR_SERVER_IP", // Will use database value or fallback
        port: parseInt(settings.fivem_server_port || "30120"),
        coordinates: [-118.2437, 34.0522], // Los Angeles coordinates for Los Santos reference
        region: "GTA V"
      }
      // Add more servers if needed
    ];

    console.log("Using server configurations:", servers);

    const serverData = await Promise.all(
      servers.map(async (server) => {
        try {
          // Fetch server info from FiveM server API
          const serverInfoUrl = `http://${server.ip}:${server.port}/info.json`;
          const playersUrl = `http://${server.ip}:${server.port}/players.json`;
          
          console.log(`Fetching data from: ${serverInfoUrl}`);
          
          const [serverInfoResponse, playersResponse] = await Promise.all([
            fetch(serverInfoUrl, { 
              method: 'GET',
              signal: AbortSignal.timeout(5000) // 5 second timeout
            }),
            fetch(playersUrl, { 
              method: 'GET',
              signal: AbortSignal.timeout(5000)
            })
          ]);

          if (!serverInfoResponse.ok || !playersResponse.ok) {
            throw new Error(`Server ${server.name} is not responding`);
          }

          const serverInfo: FiveMServerData = await serverInfoResponse.json();
          const players: FiveMPlayer[] = await playersResponse.json();

          console.log(`Successfully fetched data for ${server.name}: ${players.length} players`);

          // Process players and extract job data (if available through server variables)
          const processedPlayers = players.map((player, index) => {
            // Try to extract job from server variables or identifiers
            // This depends on your server's setup - you may need to adjust this
            const jobData = extractJobFromPlayer(player, serverInfo.vars);
            
            // Generate random positions within Los Angeles area for Los Santos simulation
            // In reality, this would come from your server's player position system
            const baseCoords = server.coordinates;
            const randomOffset = 0.05; // ~5km radius in latitude/longitude
            
            return {
              id: `${server.id}_${player.id}`,
              name: player.name,
              coordinates: [
                baseCoords[0] + (Math.random() - 0.5) * randomOffset,
                baseCoords[1] + (Math.random() - 0.5) * randomOffset
              ] as [number, number],
              lastSeen: new Date().toISOString(),
              job: jobData.job,
              jobGrade: jobData.grade,
              status: player.ping > 0 ? 'online' : 'idle',
              vehicle: jobData.vehicle,
              heading: Math.floor(Math.random() * 360),
              serverId: server.id
            };
          });

          return {
            server: {
              id: server.id,
              name: server.name,
              coordinates: server.coordinates,
              playerCount: serverInfo.clients,
              maxPlayers: serverInfo.maxclients,
              status: 'online' as const,
              description: serverInfo.hostname,
              region: server.region
            },
            players: processedPlayers
          };
        } catch (error) {
          console.error(`Error fetching data for ${server.name}:`, error);
          return {
            server: {
              id: server.id,
              name: server.name,
              coordinates: server.coordinates,
              playerCount: 0,
              maxPlayers: 200,
              status: 'offline' as const,
              description: `Server offline: ${error.message}`,
              region: server.region
            },
            players: []
          };
        }
      })
    );

    const result = {
      servers: serverData.map(data => data.server),
      players: serverData.flatMap(data => data.players),
      lastUpdated: new Date().toISOString()
    };

    console.log(`Returning data for ${result.servers.length} servers and ${result.players.length} players`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in fetch-fivem-data function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        servers: [],
        players: [],
        lastUpdated: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Helper function to extract job data from player info
function extractJobFromPlayer(player: FiveMPlayer, serverVars: Record<string, any>) {
  // This is a placeholder - you'll need to customize this based on your server setup
  // Common ways FiveM servers expose job data:
  // 1. Through server variables
  // 2. Through player identifiers
  // 3. Through a separate API endpoint
  
  // Example: if your server exposes job data through variables
  const jobMappings = {
    'police': { job: 'police', grade: 'Officer', vehicle: 'Police Cruiser' },
    'sheriff': { job: 'police', grade: 'Deputy', vehicle: 'Sheriff SUV' },
    'ambulance': { job: 'ems', grade: 'Paramedic', vehicle: 'Ambulance' },
    'mechanic': { job: 'mechanic', grade: 'Mechanic', vehicle: 'Tow Truck' },
    'taxi': { job: 'taxi', grade: 'Driver', vehicle: 'Taxi' }
  };

  // Random assignment for demo - replace with actual job detection
  const jobs = Object.keys(jobMappings);
  const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
  
  // For civilians, return default
  if (Math.random() > 0.3) { // 70% chance of civilian
    return { job: 'civilian', grade: undefined, vehicle: undefined };
  }
  
  return jobMappings[randomJob] || { job: 'civilian', grade: undefined, vehicle: undefined };
}

serve(handler);