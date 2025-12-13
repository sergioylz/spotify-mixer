// src/app/api/save-playlist/route.js
// ============================================
// API ROUTE: CREAR Y GUARDAR PLAYLIST EN SPOTIFY
// ============================================
// Este endpoint crea una nueva playlist en la cuenta del usuario
// y añade las canciones seleccionadas. Maneja:
// - Validación y refresh de tokens
// - Verificación de identidad del usuario
// - Creación de playlist con nombre personalizado
// - Añadir tracks en chunks de 100 (límite de Spotify)

import { NextResponse } from 'next/server';

import { getValidToken, getProfileByToken } from '@/lib/spotify'; 

// URL base de la API de Spotify (versión 1)
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'; 

/**
 * Manejador POST para crear una playlist en Spotify y añadir canciones
 * 
 * Body esperado:
 * @param {string} playlistName - Nombre de la playlist a crear
 * @param {string[]} trackUris - Array de URIs de Spotify (spotify:track:xxx)
 * @param {string} accessToken - Token de acceso actual del usuario
 * @param {string} refreshToken - Token para renovar el acceso si expira
 * 
 * @returns {Promise<NextResponse>} Playlist creada con URL y ID
 */
export async function POST(request) {
  try {
    // ============================================
    // PASO 1: Obtener y validar datos del cliente
    // ============================================
    const { playlistName, trackUris, accessToken, refreshToken } = await request.json(); 

    // Validar que tenemos todos los datos necesarios:
    // - Nombre de playlist no vacío
    // - Al menos una canción para añadir
    // - Tokens de autenticación válidos
    if (!playlistName || !trackUris || trackUris.length === 0 || !accessToken || !refreshToken) {
        return NextResponse.json({ error: 'Faltan parámetros necesarios (nombre de playlist o URIs de tracks/tokens).' }, { status: 400 });
    }

    // ============================================
    // PASO 2: Validar y/o refrescar el token de acceso
    // ============================================
    // getValidToken verifica si el token actual es válido, y si no,
    // intenta renovarlo usando el refresh_token
    const validToken = await getValidToken(accessToken, refreshToken); 

    if (!validToken) {
        // Si ambos tokens fallaron, el usuario debe volver a autenticarse
        return NextResponse.json({ error: 'Autenticación fallida. El token no es válido ni se puede refrescar.' }, { status: 401 });
    }

    // ============================================
    // PASO 3: Verificar la identidad del usuario
    // ============================================
    // Obtenemos el perfil del usuario usando el token para asegurar que
    // la playlist se cree en la cuenta correcta. Esto previene que alguien
    // manipule el userId y cree playlists en cuentas ajenas.
    const profile = await getProfileByToken(validToken);
    const verifiedUserId = profile?.id;

    if (!verifiedUserId) {
        return NextResponse.json({ error: 'No se pudo verificar el ID de usuario con el token.' }, { status: 401 });
    }

    // Headers comunes para todas las peticiones a Spotify
    const headers = {
      'Authorization': `Bearer ${validToken}`,
      'Content-Type': 'application/json',
    };

    // ============================================
    // PASO 4: Crear la playlist en Spotify
    // ============================================
    // POST /users/{user_id}/playlists
    // Crea una nueva playlist vacía en la cuenta del usuario
    const createResponse = await fetch(`${SPOTIFY_API_BASE}/users/${verifiedUserId}/playlists`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        name: playlistName,                                    // Nombre proporcionado por el usuario
        description: 'Generada por Spotify Taste Mixer',      // Descripción de la app
        public: true,                                         // Playlist pública (visible en el perfil)
      }),
    });

    // Verificar si la creación fue exitosa
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      // Mostrar el mensaje de error de Spotify (truncado a 100 chars)
      return NextResponse.json({ 
          error: 'Fallo al crear playlist en Spotify.', 
          details: errorText.substring(0, 100) 
      }, { status: createResponse.status });
    }

    // Extraer el ID de la playlist recién creada
    const playlistData = await createResponse.json();
    const playlistId = playlistData.id;

    // ============================================
    // PASO 5: Añadir canciones a la playlist
    // ============================================
    // Spotify API limita a 100 URIs por petición, así que dividimos
    // el array de canciones en chunks (grupos) de máximo 100
    const urisChunks = [];
    for (let i = 0; i < trackUris.length; i += 100) {
        urisChunks.push(trackUris.slice(i, i + 100));
    }

    // Crear una promesa para cada chunk de canciones
    // POST /playlists/{playlist_id}/tracks
    const addTrackPromises = urisChunks.map(uris => 
        fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                uris: uris,  // Array de URIs (hasta 100 por petición)
            }),
        })
    );
    
    // Ejecutar todas las peticiones en paralelo y esperar a que terminen
    // Esto es más rápido que hacerlas secuencialmente
    await Promise.all(addTrackPromises);

    // ============================================
    // PASO 6: Responder con éxito
    // ============================================
    // Devolvemos la URL de la playlist para que el usuario pueda abrirla
    return NextResponse.json({ 
        message: 'Playlist creada y canciones añadidas con éxito.', 
        playlistUrl: playlistData.external_urls.spotify,  // Link para abrir en Spotify
        playlistId: playlistId                            // ID para futuras operaciones
    });

  } catch (error) {
    // Capturar cualquier error no manejado (red, parsing JSON, etc.)
    console.error('Error general al guardar playlist:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}