// src/lib/spotify.js

/**
 * Nota: Este archivo contiene lógica que se ejecuta tanto en el cliente 
 * (para las peticiones iniciales y el manejo de tokens en localStorage) 
 * como potencialmente en el servidor (si es importado por una API Route que 
 * simula peticiones de cliente).
 */

// 💥 CORRECCIÓN: Definimos la constante de la URL BASE al inicio 💥
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1'; 

// --------------------------------------------------------------------------
// LÓGICA DE AUTENTICACIÓN (CLIENTE)
// --------------------------------------------------------------------------

/**
 * Función central para refrescar el token de acceso.
 * Se llama cuando el token actual está expirado o falla con 401.
 * @returns {Promise<string|null>} El nuevo access token o null si falla.
 */
async function refreshAccessToken(tokenToRefresh) {
    
    // Si no se pasa un token, asumimos que estamos en el cliente e intentamos obtenerlo de localStorage
    const refreshToken = tokenToRefresh || (typeof window !== 'undefined' ? localStorage.getItem('spotify_refresh_token') : null);

    if (!refreshToken) {
        console.error("No se encontró Refresh Token.");
        // Si no hay token Y estamos en el cliente, limpiamos (aunque ya deberían estar limpios)
        if (typeof window !== 'undefined') {
            localStorage.removeItem('spotify_token');
            localStorage.removeItem('spotify_refresh_token');
            localStorage.removeItem('spotify_token_expiration');
        }
        return null;
    }

    try {
        const response = await fetch('/api/refresh-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Usamos el refreshToken obtenido/pasado
            body: JSON.stringify({ refresh_token: refreshToken }) 
        });

        if (!response.ok) {
            console.error('Error al refrescar token:', await response.json());
            // Solo limpiamos localStorage si estamos en el cliente
            if (typeof window !== 'undefined') {
                localStorage.removeItem('spotify_token');
                localStorage.removeItem('spotify_refresh_token');
                localStorage.removeItem('spotify_token_expiration');
            }
            return null;
        }

        const data = await response.json();

        // 💥 Solo guardamos en localStorage si estamos en el cliente 💥
        if (typeof window !== 'undefined') {
            localStorage.setItem('spotify_token', data.access_token);
            const expirationTime = Date.now() + data.expires_in * 1000; 
            localStorage.setItem('spotify_token_expiration', expirationTime.toString());
            
            if (data.refresh_token) {
                localStorage.setItem('spotify_refresh_token', data.refresh_token);
            }
        }

        console.log("Token refrescado con éxito.");
        return data.access_token; // Retornar el nuevo token
    } catch (error) {
        console.error('Error de red al intentar refrescar el token:', error);
        return null;
    }
}

/**
 * Obtiene un token válido, refrescándolo si es necesario.
 * @returns {Promise<string|null>} Un token de acceso válido o null.
 */
export async function getValidToken(clientAccessToken, clientRefreshToken) {
  
  // 1. Usar tokens pasados si estamos en el servidor (API Route)
  let token;
  let refreshToken;
  let expiration;
  
  if (clientAccessToken && clientRefreshToken) {
      // Estamos en el servidor (API Route). Usamos los tokens pasados.
      token = clientAccessToken;
      refreshToken = clientRefreshToken;
      // Nota: Aquí no podemos verificar 'expiration' fácilmente sin el cliente, 
      // así que nos enfocamos en que el refresh token funcione.
  } else if (typeof window !== 'undefined') {
      // 2. Usar localStorage si estamos en el cliente (Browser)
      token = localStorage.getItem('spotify_token');
      refreshToken = localStorage.getItem('spotify_refresh_token');
      expiration = localStorage.getItem('spotify_token_expiration');

      // Verificar expiración solo si estamos en el cliente
      if (token && expiration && Date.now() >= parseInt(expiration) - 5000) {
          console.log("Token expirado en cliente. Refrescando...");
          return await refreshAccessToken();
      }
  } else {
      // No hay tokens en ninguno de los dos entornos.
      return null;
  }
  
  // En el servidor, si el token pasado está a punto de fallar, el refresh lo manejará.
  if (token && refreshToken && typeof window === 'undefined') {
      // Forzamos el refresh para el servidor, ya que no podemos verificar la expiración segura
      // Simplemente devolveremos el token actual y dejaremos que Spotify lo rechace si está expirado.
      return token;
  }
  
  return token;
}


/**
 * Función genérica para hacer peticiones a la API de Spotify.
 * Maneja automáticamente la expiración y el refresco del token.
 * * @param {string} endpoint - El endpoint de la API de Spotify (ej: '/me').
 * @param {object} options - Opciones de fetch (method, body, etc.).
 * @returns {Promise<object|null>} Los datos de la respuesta JSON o null si falla.
 */
export async function spotifyRequest(endpoint, options = {}) {
    let token = await getValidToken();
    // 💥 CORRECCIÓN: Usamos la constante global en lugar de la variable local
    

    // Si no hay token válido, abortar.
    if (!token) {
        console.warn("No se pudo obtener un token válido para la petición.");
        return null;
    }

    // 1. Petición inicial
    let response = await fetch(`${SPOTIFY_API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
        },
    });

    // 2. Manejo de Token Expirado (401 Unauthorized)
    if (response.status === 401) {
        console.warn("Petición fallida (401). Intentando refrescar token...");
        
        // Intentar refrescar token
        token = await refreshAccessToken();
        
        if (!token) {
        // Si el refresh falla, devolvemos null y el componente llamador debe redirigir
        return null;
        }

        // Reintentar la petición con el nuevo token
        response = await fetch(`${SPOTIFY_API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        });
    }

    // 3. Manejo de respuesta final (incluyendo el reintento)
    if (!response.ok) {
        console.error(`Error en Spotify API (Endpoint: ${endpoint}, Status: ${response.status})`);
        // Puedes manejar otros códigos de error (429 Rate Limit, 403 Forbidden, etc.)
        return null;
    }

    // Devolver JSON si no hay contenido (ej. POST que no devuelve cuerpo)
    if (response.status === 204) return {}; 
    
    return response.json();
}

/**
 * Función de ejemplo para obtener el perfil del usuario (para testing).
 */
export async function getMyProfile() {
    return spotifyRequest('/me');
}

/**
 * Busca artistas o canciones en Spotify.
 * @param {string} query - Término de búsqueda.
 * @param {string} type - Tipo de búsqueda ('artist' o 'track').
 * @returns {Promise<object|null>} Resultados de la búsqueda.
 */
export async function searchSpotify(query, type = 'artist') {
    if (!query) return null;
    // Codificamos la URI para manejar espacios y caracteres especiales
    const encodedQuery = encodeURIComponent(query);
    const endpoint = `/search?q=${encodedQuery}&type=${type}&limit=10`;
    
    // spotifyRequest gestiona el token y el refresh automático
    return spotifyRequest(endpoint);
}

// src/lib/spotify.js (Añadir al final)

/**
 * Obtiene los top tracks de un artista específico (necesario para las seeds).
 * @param {string} artistId - ID del artista de Spotify.
 * @returns {Promise<Array>|null} Array de objetos de track.
 */
export async function getArtistTopTracks(artistId) {
    // El país 'ES' (España) se usa para obtener tracks accesibles
    const endpoint = `/artists/${artistId}/top-tracks?market=ES`;
    const response = await spotifyRequest(endpoint);
    
    if (response && response.tracks) {
        return response.tracks;
    }
    return [];
}

/**
 * Obtiene las características de audio (mood, energy, danceability) para un conjunto de tracks.
 * @param {Array<string>} trackIds - Array de hasta 100 IDs de canciones.
 * @returns {Promise<Array>|null} Array de objetos de audio features.
 */
export async function getAudioFeatures(trackIds) {
    if (trackIds.length === 0) return [];

    const ids = trackIds.slice(0, 100).join(','); // La API solo acepta hasta 100 IDs
    const endpoint = `/audio-features?ids=${ids}`;
    const response = await spotifyRequest(endpoint);
    
    if (response && response.audio_features) {
        return response.audio_features;
    }
    return [];
}

/**
 * Función auxiliar para obtener el ID de usuario desde el perfil.
 * @returns {string|null} ID del usuario o null.
 */
export async function getUserId() {
    const profile = await getMyProfile();
    return profile ? profile.id : null;
}

// src/lib/spotify.js (Añadir al final)

export async function getProfileByToken(accessToken) {
    const baseUrl = 'https://api.spotify.com/v1'; // Base URL de la API

    const response = await fetch(`${baseUrl}/me`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    
    if (response.ok) {
        return response.json();
    }
    return null;
}

/**
 * Obtiene los elemento principales (Top Artists o Top Tracks) del usuario.
 * @param {string} validToken - Token de acceso válido.
 * @param {'artists'|'tracks'} type - Tipo de elementos a obtener.
 * @param {'long_term'|'medium_term'|'short_term'} timeRange - Rango de tiempo para los top items.
 * @returns {Promise<Object|null>} Objeto con los elementos principales o null.
 */

export async function getTopItems(validToken, type, timeRange = 'medium_term', limit = 5) {
    if(!validToken) return null;

    const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

    try { 
        const url = `${SPOTIFY_API_BASE}/me/top/${type}?time_range=${timeRange}&limit=${limit}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${validToken}`,
            },
        });

        if (!response.ok) {
            console.error(`Error al obtener top ${type}:`, await response.json());
            return null;
        }

        const data = await response.json();
        return data;
    }catch (error) {
        console.error('Error de red al obtener top items:', error);
        return null;
    }
}