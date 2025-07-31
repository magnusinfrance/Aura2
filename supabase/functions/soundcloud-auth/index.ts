import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, code } = await req.json()

    const soundcloudClientId = Deno.env.get('SOUNDCLOUD_CLIENT_ID')
    if (!soundcloudClientId) {
      throw new Error('SoundCloud Client ID not configured')
    }

    if (action === 'connect') {
      // Step 1: Generate authorization URL
      const redirectUri = `${new URL(req.url).origin}/soundcloud-callback`
      const authUrl = `https://api.soundcloud.com/connect?` +
        `client_id=${soundcloudClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=non-expiring`

      return new Response(
        JSON.stringify({ authUrl }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (action === 'callback' && code) {
      // Step 2: Exchange code for access token
      const soundcloudClientSecret = Deno.env.get('SOUNDCLOUD_CLIENT_SECRET')
      if (!soundcloudClientSecret) {
        throw new Error('SoundCloud Client Secret not configured')
      }

      const redirectUri = `${new URL(req.url).origin}/soundcloud-callback`
      
      const tokenResponse = await fetch('https://api.soundcloud.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: soundcloudClientId,
          client_secret: soundcloudClientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code: code,
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('SoundCloud token exchange failed:', errorText)
        throw new Error('Failed to exchange code for access token')
      }

      const tokenData = await tokenResponse.json()

      // Store the connection in the database
      const { error: insertError } = await supabase
        .from('user_connections')
        .upsert({
          user_id: user.id,
          service_type: 'soundcloud',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in ? 
            new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : 
            null,
        }, {
          onConflict: 'user_id,service_type'
        })

      if (insertError) {
        console.error('Database insert error:', insertError)
        throw new Error('Failed to store connection')
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (action === 'fetch-tracks') {
      // Fetch user's SoundCloud tracks
      const { data: connection } = await supabase
        .from('user_connections')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('service_type', 'soundcloud')
        .single()

      if (!connection?.access_token) {
        throw new Error('No SoundCloud connection found')
      }

      const tracksResponse = await fetch(
        `https://api.soundcloud.com/me/tracks?oauth_token=${connection.access_token}&limit=50`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (!tracksResponse.ok) {
        throw new Error('Failed to fetch SoundCloud tracks')
      }

      const tracks = await tracksResponse.json()

      // Transform SoundCloud tracks to our format
      const transformedTracks = tracks.map((track: any) => ({
        id: `sc-${track.id}`,
        name: track.title,
        artist: track.user?.username || 'Unknown Artist',
        duration: Math.floor(track.duration / 1000), // Convert from ms to seconds
        url: track.stream_url ? `${track.stream_url}?oauth_token=${connection.access_token}` : null,
        artwork: track.artwork_url || track.user?.avatar_url,
        genre: track.genre,
        description: track.description,
        soundcloud_id: track.id,
        streamable: track.streamable,
      })).filter((track: any) => track.streamable && track.url)

      return new Response(
        JSON.stringify({ tracks: transformedTracks }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (action === 'disconnect') {
      // Remove the SoundCloud connection
      const { error: deleteError } = await supabase
        .from('user_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('service_type', 'soundcloud')

      if (deleteError) {
        throw new Error('Failed to disconnect SoundCloud')
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})