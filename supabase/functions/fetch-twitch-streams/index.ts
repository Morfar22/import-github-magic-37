import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface TwitchStreamData {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
}

interface TwitchStreamsResponse {
  data: TwitchStreamData[];
}

async function getTwitchAccessToken(): Promise<string> {
  const clientId = Deno.env.get('TWITCH_CLIENT_ID');
  const clientSecret = Deno.env.get('TWITCH_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing Twitch credentials');
  }

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to get Twitch access token:', error);
    throw new Error('Failed to authenticate with Twitch API');
  }

  const data: TwitchTokenResponse = await response.json();
  return data.access_token;
}

async function getTwitchStreams(accessToken: string, usernames: string[]): Promise<TwitchStreamData[]> {
  const clientId = Deno.env.get('TWITCH_CLIENT_ID');
  
  if (!clientId) {
    throw new Error('Missing Twitch client ID');
  }

  // Twitch API allows max 100 user logins per request
  const chunks = [];
  for (let i = 0; i < usernames.length; i += 100) {
    chunks.push(usernames.slice(i, i + 100));
  }

  const allStreams: TwitchStreamData[] = [];

  for (const chunk of chunks) {
    const url = new URL('https://api.twitch.tv/helix/streams');
    chunk.forEach(username => url.searchParams.append('user_login', username));

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': clientId,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch Twitch streams:', error);
      throw new Error('Failed to fetch stream data from Twitch API');
    }

    const data: TwitchStreamsResponse = await response.json();
    allStreams.push(...data.data);
  }

  return allStreams;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching Twitch stream data...');

    // Get active streamers from database
    const { data: streamers, error: streamersError } = await supabase
      .from('twitch_streamers')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (streamersError) {
      console.error('Error fetching streamers:', streamersError);
      throw new Error('Failed to fetch streamers from database');
    }

    if (!streamers || streamers.length === 0) {
      console.log('No active streamers found');
      return new Response(JSON.stringify({ streamers: [], streamData: {} }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${streamers.length} active streamers`);

    // Get Twitch access token
    const accessToken = await getTwitchAccessToken();
    console.log('Successfully obtained Twitch access token');

    // Get stream data from Twitch API
    const usernames = streamers.map(s => s.twitch_username);
    const twitchStreams = await getTwitchStreams(accessToken, usernames);
    console.log(`Found ${twitchStreams.length} live streams`);

    // Create stream data object
    const streamData: Record<string, any> = {};
    
    // Initialize all streamers as offline
    streamers.forEach(streamer => {
      streamData[streamer.twitch_username] = {
        is_live: false,
        viewer_count: 0,
        game_name: '',
        title: '',
        started_at: '',
        thumbnail_url: '',
      };
    });

    // Update with live stream data
    twitchStreams.forEach(stream => {
      console.log(`Processing stream for ${stream.user_login}, thumbnail: ${stream.thumbnail_url}`);
      streamData[stream.user_login] = {
        is_live: true,
        viewer_count: stream.viewer_count,
        game_name: stream.game_name,
        title: stream.title,
        started_at: stream.started_at,
        thumbnail_url: stream.thumbnail_url,
      };
    });

    console.log('Successfully processed stream data');

    return new Response(JSON.stringify({ streamers, streamData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-twitch-streams function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      streamers: [],
      streamData: {}
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});