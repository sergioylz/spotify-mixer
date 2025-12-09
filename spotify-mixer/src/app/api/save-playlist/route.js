// src/app/api/save-playlist/route.js
import { NextResponse } from 'next/server';

import { getValidToken, getProfileByToken } from '@/lib/spotify'; // <--- AÑADIR getProfileByToken

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1/search?type=track&q=bohemian%20rhapsody&limit=10`;//7'; 

export async function POST(request) {
  try {
    // Ya no usamos el userId que viene del cliente (puede ser la causa del 400)
    const { playlistName, trackUris, accessToken, refreshToken } = await request.json(); 

    // ... (validaciones)

    const validToken = await getValidToken(accessToken, refreshToken); 

    if (!validToken) { /* ... */ }

    // 💥 PASO AÑADIDO: OBTENER EL USERID VERIFICADO POR EL TOKEN 💥
    const profile = await getProfileByToken(validToken);
    const verifiedUserId = profile?.id;

    if (!verifiedUserId) {
         return NextResponse.json({ error: 'No se pudo verificar el ID de usuario con el token.' }, { status: 401 });
    }

    const headers = {
      'Authorization': `Bearer ${validToken}`,
      'Content-Type': 'application/json',
    };

    // --- PASO 1: CREAR LA PLAYLIST ---
    // Usamos el ID verificado.
    const createResponse = await fetch(`${SPOTIFY_API_BASE}/users/${verifiedUserId}/playlists`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        name: playlistName,
        description: 'Generada por Spotify Taste Mixer',
        public: true, 
      }),
    });

    if (!createResponse.ok) {
      // 💥 AHORA ESTA CORRECCIÓN ESTÁ EN SU LUGAR 💥
      const errorText = await createResponse.text();
      // Si recibimos un 400/403, mostramos el error de Spotify
      return NextResponse.json({ 
          error: 'Fallo al crear playlist en Spotify.', 
          details: errorText.substring(0, 100) 
      }, { status: createResponse.status });
    }

    const playlistData = await createResponse.json();
    const playlistId = playlistData.id;

    // --- PASO 2: AÑADIR LAS CANCIONES ---
    // ... (El código de añadir tracks es el mismo, usa validToken y playlistId) ...

    const urisChunks = [];
    for (let i = 0; i < trackUris.length; i += 100) {
        urisChunks.push(trackUris.slice(i, i + 100));
    }

    const addTrackPromises = urisChunks.map(uris => 
        fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                uris: uris,
            }),
        })
    );
    await Promise.all(addTrackPromises);

    // --- PASO 3: RESPUESTA FINAL ---
    return NextResponse.json({ 
        message: 'Playlist creada y canciones añadidas con éxito.', 
        playlistUrl: playlistData.external_urls.spotify,
        playlistId: playlistId
    });

  } catch (error) {
    console.error('Error general al guardar playlist:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}