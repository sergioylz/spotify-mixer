// src/lib/spotify.js
/**
 * Módulo de integración con la API de Spotify
 * 
 * Este módulo proporciona funciones para interactuar con la API de Spotify,
 * incluyendo autenticación, gestión de tokens, búsqueda de contenido,
 * obtención de datos de usuario y análisis de características de audio.
 * 
 * La gestión de tokens funciona tanto en cliente (localStorage) como en servidor (API Routes).
 */

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';

// ============================================================================
// AUTENTICACIÓN Y GESTIÓN DE TOKENS
// ============================================================================

/**
 * Limpia los tokens almacenados en localStorage (solo cliente)
 * Función auxiliar para mantener el código DRY
 */
function clearClientTokens() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('spotify_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiration');
    }
}

/**
 * Refresca el token de acceso de Spotify cuando está expirado o inválido
 * 
 * Esta función se llama automáticamente cuando:
 * - El token actual está expirado según la fecha de expiración
 * - Una petición a la API falla con código 401 (Unauthorized)
 * 
 * @param {string} [tokenToRefresh] - Refresh token opcional. Si no se proporciona, se busca en localStorage
 * @returns {Promise<string|null>} El nuevo access token si se refresca correctamente, null en caso de error
 */
async function refreshAccessToken(tokenToRefresh) {
    // Obtener refresh token desde el parámetro o desde localStorage (cliente)
    const refreshToken = tokenToRefresh || 
        (typeof window !== 'undefined' ? localStorage.getItem('spotify_refresh_token') : null);

    // Si no existe refresh token, no podemos continuar
    if (!refreshToken) {
        console.error('No se encontró Refresh Token para refrescar el acceso.');
        clearClientTokens();
        return null;
    }

    try {
        // Llamar al endpoint de nuestra API que maneja el refresh
        const response = await fetch('/api/refresh-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!response.ok) {
            console.error('Error al refrescar token:', await response.json());
            clearClientTokens();
            return null;
        }

        const data = await response.json();

        // Guardar el nuevo token en localStorage solo si estamos en el cliente
        if (typeof window !== 'undefined') {
            localStorage.setItem('spotify_token', data.access_token);
            
            // Calcular y guardar la fecha de expiración (5 segundos antes para seguridad)
            const expirationTime = Date.now() + (data.expires_in * 1000);
            localStorage.setItem('spotify_token_expiration', expirationTime.toString());
            
            // Actualizar refresh token si Spotify nos proporciona uno nuevo
            if (data.refresh_token) {
                localStorage.setItem('spotify_refresh_token', data.refresh_token);
            }
        }

        console.log('Token de acceso refrescado correctamente.');
        return data.access_token;
        
    } catch (error) {
        console.error('Error de red al intentar refrescar el token:', error);
        return null;
    }
}

/**
 * Obtiene un token de acceso válido, refrescándolo automáticamente si es necesario
 * 
 * Esta función soporta dos modos de operación:
 * 1. Cliente (Browser): Lee tokens desde localStorage y verifica expiración
 * 2. Servidor (API Route): Usa tokens pasados como parámetros
 * 
 * @param {string} [clientAccessToken] - Access token desde el cliente (para uso en servidor)
 * @param {string} [clientRefreshToken] - Refresh token desde el cliente (para uso en servidor)
 * @returns {Promise<string|null>} Token de acceso válido o null si no está disponible
 */
export async function getValidToken(clientAccessToken, clientRefreshToken) {
    let token;
    let refreshToken;
    let expiration;
    
    // Modo 1: Servidor (API Route) - Usar tokens pasados como parámetros
    if (clientAccessToken && clientRefreshToken) {
        token = clientAccessToken;
        refreshToken = clientRefreshToken;
        // En el servidor no podemos verificar expiración fácilmente sin timestamp del cliente
        // Dejamos que Spotify rechace el token si está expirado (401)
    } 
    // Modo 2: Cliente (Browser) - Usar localStorage
    else if (typeof window !== 'undefined') {
        token = localStorage.getItem('spotify_token');
        refreshToken = localStorage.getItem('spotify_refresh_token');
        expiration = localStorage.getItem('spotify_token_expiration');

        // Verificar si el token está expirado (con margen de 5 segundos)
        if (token && expiration && Date.now() >= parseInt(expiration) - 5000) {
            console.log('Token expirado detectado. Refrescando automáticamente...');
            return await refreshAccessToken();
        }
    } 
    // No hay tokens disponibles en ningún entorno
    else {
        return null;
    }
    
    return token;
}

// ============================================================================
// PETICIONES A LA API DE SPOTIFY
// ============================================================================

/**
 * Función genérica para realizar peticiones a la API de Spotify
 * 
 * Esta función centraliza todas las peticiones a Spotify y proporciona:
 * - Gestión automática de tokens de acceso
 * - Refresco automático cuando el token expira (401)
 * - Reintento automático tras refrescar el token
 * - Manejo de errores consistente
 * 
 * @param {string} endpoint - Endpoint de la API de Spotify (ej: '/me', '/search?q=...')
 * @param {object} [options={}] - Opciones de fetch (method, body, headers adicionales, etc.)
 * @returns {Promise<object|null>} Datos de la respuesta en formato JSON, objeto vacío si no hay contenido, o null si falla
 */
export async function spotifyRequest(endpoint, options = {}) {
    // Obtener token válido (puede refrescarse automáticamente)
    let token = await getValidToken();

    // Sin token válido, no podemos hacer la petición
    if (!token) {
        console.warn('No se pudo obtener un token válido para la petición a Spotify.');
        return null;
    }

    // Realizar la petición inicial con el token actual
    let response = await fetch(`${SPOTIFY_API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers, // Permitir headers adicionales
        },
    });

    // Si recibimos 401 (Unauthorized), el token está expirado o inválido
    if (response.status === 401) {
        console.warn('Petición rechazada (401). Intentando refrescar token...');
        
        // Intentar obtener un nuevo token
        token = await refreshAccessToken();
        
        // Si el refresh falla, no podemos continuar
        if (!token) {
            console.error('No se pudo refrescar el token. El usuario debe autenticarse nuevamente.');
            return null;
        }

        // Reintentar la petición con el token refrescado
        response = await fetch(`${SPOTIFY_API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
    }

    // Manejar respuestas de error después del posible reintento
    if (!response.ok) {
        console.error(
            `Error en la API de Spotify (Endpoint: ${endpoint}, Status: ${response.status})`
        );
        // Aquí se podrían manejar otros códigos específicos:
        // - 429: Rate limiting (demasiadas peticiones)
        // - 403: Forbidden (permisos insuficientes)
        // - 404: Not found (recurso no existe)
        return null;
    }

    // Algunas peticiones (ej: POST, DELETE) no devuelven contenido (204 No Content)
    if (response.status === 204) {
        return {};
    }
    
    // Devolver la respuesta en formato JSON
    return response.json();
}

// ============================================================================
// PERFIL Y DATOS DEL USUARIO
// ============================================================================

/**
 * Obtiene el perfil del usuario actual autenticado
 * 
 * Utiliza spotifyRequest para manejar automáticamente la autenticación.
 * 
 * @returns {Promise<Object|null>} Objeto con datos del perfil (id, display_name, email, etc.) o null si falla
 */
export async function getMyProfile() {
    return spotifyRequest('/me');
}

/**
 * Obtiene el perfil del usuario usando un token de acceso específico
 * 
 * Esta función no usa spotifyRequest para tener control directo sobre el token.
 * Útil para validar tokens o hacer peticiones desde el servidor.
 * 
 * @param {string} accessToken - Token de acceso de Spotify
 * @returns {Promise<Object|null>} Datos del perfil del usuario o null si el token es inválido
 */
export async function getProfileByToken(accessToken) {
    const baseUrl = 'https://api.spotify.com/v1';

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
 * Obtiene el ID del usuario actual
 * 
 * Función auxiliar que extrae solo el ID del perfil completo.
 * 
 * @returns {Promise<string|null>} ID del usuario de Spotify o null si no se puede obtener
 */
export async function getUserId() {
    const profile = await getMyProfile();
    return profile ? profile.id : null;
}

/**
 * Obtiene los elementos más escuchados del usuario (artistas o canciones)
 * 
 * Permite obtener los top items del usuario en diferentes periodos de tiempo:
 * - long_term: Varios años de datos
 * - medium_term: Aproximadamente 6 meses
 * - short_term: Aproximadamente 4 semanas
 * 
 * @param {string} validToken - Token de acceso válido de Spotify
 * @param {'artists'|'tracks'} type - Tipo de elementos a obtener
 * @param {'long_term'|'medium_term'|'short_term'} [timeRange='medium_term'] - Periodo de tiempo a analizar
 * @param {number} [limit=5] - Cantidad de elementos a devolver (máximo 50)
 * @returns {Promise<Object|null>} Objeto con array de items en la propiedad correspondiente, o null si falla
 */
export async function getTopItems(validToken, type, timeRange = 'medium_term', limit = 5) {
    if (!validToken) {
        console.warn('No se proporcionó token válido para obtener top items.');
        return null;
    }

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

        return response.json();
        
    } catch (error) {
        console.error('Error de red al obtener top items:', error);
        return null;
    }
}

// ============================================================================
// BÚSQUEDA DE CONTENIDO
// ============================================================================

/**
 * Busca artistas o canciones en el catálogo de Spotify
 * 
 * Utiliza el endpoint de búsqueda de Spotify para encontrar contenido.
 * Maneja automáticamente la codificación de caracteres especiales en la consulta.
 * 
 * @param {string} query - Término de búsqueda (nombre del artista, canción, etc.)
 * @param {string} [type='artist'] - Tipo de búsqueda: 'artist', 'track', 'album', 'playlist'
 * @returns {Promise<Object|null>} Objeto con resultados de búsqueda o null si falla o query vacío
 */
export async function searchSpotify(query, type = 'artist') {
    if (!query) {
        console.warn('No se proporcionó término de búsqueda.');
        return null;
    }
    
    // Codificar la consulta para manejar espacios, acentos y caracteres especiales
    const encodedQuery = encodeURIComponent(query);
    const endpoint = `/search?q=${encodedQuery}&type=${type}&limit=10`;
    
    return spotifyRequest(endpoint);
}

// ============================================================================
// ARTISTAS Y CANCIONES
// ============================================================================

/**
 * Obtiene las canciones más populares de un artista específico
 * 
 * Esta función es útil para obtener seeds (semillas) de canciones
 * al generar recomendaciones basadas en un artista.
 * 
 * @param {string} artistId - ID único del artista en Spotify
 * @returns {Promise<Array>} Array de objetos de track (vacío si no hay resultados o falla)
 */
export async function getArtistTopTracks(artistId) {
    // Usar mercado ES (España) para obtener tracks disponibles en esa región
    // Cambiar según la región objetivo de tu aplicación
    const endpoint = `/artists/${artistId}/top-tracks?market=ES`;
    const response = await spotifyRequest(endpoint);
    
    // La respuesta contiene un objeto con propiedad 'tracks'
    if (response && response.tracks) {
        return response.tracks;
    }
    
    return [];
}

// ============================================================================
// ANÁLISIS DE AUDIO
// ============================================================================

/**
 * Obtiene características de audio detalladas para un conjunto de canciones
 * 
 * Las características incluyen métricas como:
 * - danceability: Qué tan bailable es la canción (0.0 a 1.0)
 * - energy: Intensidad y actividad percibida (0.0 a 1.0)
 * - valence: Positividad musical (0.0 a 1.0, donde 1.0 es más feliz)
 * - tempo: Tempo estimado en BPM
 * - acousticness, instrumentalness, speechiness, etc.
 * 
 * @param {Array<string>} trackIds - Array de IDs de canciones de Spotify (máximo 100)
 * @returns {Promise<Array>} Array de objetos con características de audio (vacío si falla o sin IDs)
 */
export async function getAudioFeatures(trackIds) {
    if (trackIds.length === 0) {
        console.warn('No se proporcionaron IDs de canciones para analizar.');
        return [];
    }

    // La API de Spotify acepta hasta 100 IDs por petición
    const ids = trackIds.slice(0, 100).join(',');
    const endpoint = `/audio-features?ids=${ids}`;
    const response = await spotifyRequest(endpoint);
    
    // La respuesta contiene un array 'audio_features'
    if (response && response.audio_features) {
        return response.audio_features;
    }
    
    return [];
}