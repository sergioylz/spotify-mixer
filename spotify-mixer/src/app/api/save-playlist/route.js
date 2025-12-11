import { NextResponse } from 'next/server';

import { getValidToken, getProfileByToken } from '@/lib/spotify'; 

// 💥 CORRECCIÓN DE LA URL BASE 💥
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'; 

export async function POST(request) {
  try {
    // 1. Obtener datos del cliente
    const { playlistName, trackUris, accessToken, refreshToken } = await request.json(); 

    // --- Validación básica ---
    if (!playlistName || !trackUris || trackUris.length === 0 || !accessToken || !refreshToken) {
        return NextResponse.json({ error: 'Faltan parámetros necesarios (nombre de playlist o URIs de tracks/tokens).' }, { status: 400 });
    }

    // 2. Validar y/o refrescar el token de acceso
    const validToken = await getValidToken(accessToken, refreshToken); 

    if (!validToken) {
        // Esto indica que el refresh token también falló o no se pudo obtener un token válido.
        return NextResponse.json({ error: 'Autenticación fallida. El token no es válido ni se puede refrescar.' }, { status: 401 });
    }

    // 3. OBTENER EL USERID VERIFICADO POR EL TOKEN
    // Esto previene que un usuario intente crear una playlist para otro.
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
      const errorText = await createResponse.text();
      // Si recibimos un 400/403, mostramos el error de Spotify
      return NextResponse.json({ 
          error: 'Fallo al crear playlist en Spotify.', 
          details: errorText.substring(0, 100) 
      }, { status: createResponse.status });
    }

    const playlistData = await createResponse.json();
    const playlistId = playlistData.id;

    // --- PASO 2: AÑADIR LAS CANCIONES (Chunking) ---
    // Spotify solo permite añadir 100 URIs por petición.
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
    // Esperar a que todas las peticiones de añadir tracks terminen
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