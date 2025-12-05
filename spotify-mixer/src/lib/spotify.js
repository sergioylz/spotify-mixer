// src/lib/spotify.js
// 'use client' es necesario porque usa localStorage y fetch en el cliente (aunque la API Route es servidor)

/**
 * Función central para refrescar el token de acceso.
 * Se llama cuando el token actual está expirado o falla con 401.
 * @returns {Promise<string|null>} El nuevo access token o null si falla.
 */
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('spotify_refresh_token');

    if (!refreshToken) {
        console.error("No se encontró Refresh Token.");
        return null;
    }

    try {
        const response = await fetch('/api/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!response.ok) {
        console.error('Error al refrescar token:', await response.json());
        // Si el refresh token falla (ej. ha sido revocado), limpiamos todo.
        localStorage.removeItem('spotify_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiration');
        return null;
        }

        const data = await response.json();

        // Guardar el nuevo token
        localStorage.setItem('spotify_token', data.access_token);
        // Calcular y guardar la nueva expiración (sumar data.expires_in segundos)
        const expirationTime = Date.now() + data.expires_in * 1000; 
        localStorage.setItem('spotify_token_expiration', expirationTime.toString());
        
        // Spotify a veces devuelve un nuevo refresh token, si es así, lo guardamos
        if (data.refresh_token) {
            localStorage.setItem('spotify_refresh_token', data.refresh_token);
        }

        console.log("Token refrescado con éxito.");
        return data.access_token;

    } catch (error) {
        console.error('Error de red al intentar refrescar el token:', error);
        return null;
    }
}

/**
 * Obtiene un token válido, refrescándolo si es necesario.
 * @returns {Promise<string|null>} Un token de acceso válido o null.
 */
async function getValidToken() {
    const token = localStorage.getItem('spotify_token');
    const expiration = localStorage.getItem('spotify_token_expiration');

    // Si no hay token o no hay expiración, no estamos autenticados.
    if (!token || !expiration) {
        return null;
    }

    // Verificar si el token ha expirado (usando un buffer de 5 segundos)
    if (Date.now() >= parseInt(expiration) - 5000) {
        console.log("Token expirado o a punto de expirar. Refrescando...");
        return await refreshAccessToken();
    }

    // El token es válido
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
    const baseUrl = 'https://api.spotify.com/v1'; 

    // Si no hay token válido, abortar.
    if (!token) {
        console.warn("No se pudo obtener un token válido para la petición.");
        return null;
    }

    // 1. Petición inicial
    let response = await fetch(`${baseUrl}${endpoint}`, {
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
        response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
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