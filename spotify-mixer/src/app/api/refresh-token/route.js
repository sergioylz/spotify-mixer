import { NextResponse } from 'next/server';

// Constantes del endpoint de Spotify
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const GRANT_TYPE = 'refresh_token';

// Mensajes de error estandarizados
const ERROR_MESSAGES = {
    MISSING_REFRESH_TOKEN: 'Refresh token not found',
    SERVER_CONFIG_ERROR: 'Server configuration error',
    SPOTIFY_REFRESH_FAILED: 'Spotify token refresh failed',
    INTERNAL_ERROR: 'Internal Server Error'
};

/**
 * API Route para refrescar un token de acceso de Spotify expirado.
 * 
 * @param {Request} request - Objeto de la solicitud HTTP con el refresh_token en el body
 * @returns {NextResponse} Token de acceso renovado o error
 * 
 * Body esperado: { refresh_token: string }
 * Respuesta exitosa: { access_token: string, token_type: string, expires_in: number, scope: string }
 */
export async function POST(request) {
    try {
        // 1. Extraer y validar el refresh token del cuerpo de la solicitud
        const { refresh_token } = await request.json();
        
        if (!refresh_token) {
        return NextResponse.json(
            { error: ERROR_MESSAGES.MISSING_REFRESH_TOKEN }, 
            { status: 400 }
        );
        }

        // 2. Validar variables de entorno críticas
        const { SPOTIFY_CLIENT_ID: client_id, SPOTIFY_CLIENT_SECRET: client_secret } = process.env;
        
        if (!client_id || !client_secret) {
        console.error('Faltan variables de entorno críticas: SPOTIFY_CLIENT_ID o SPOTIFY_CLIENT_SECRET');
        return NextResponse.json(
            { error: ERROR_MESSAGES.SERVER_CONFIG_ERROR }, 
            { status: 500 }
        );
        }

        // 3. Preparar credenciales de autenticación (Basic Auth)
        const authHeader = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
        
        // 4. Construir parámetros para la solicitud de refresh
        const params = new URLSearchParams({
        grant_type: GRANT_TYPE,
        refresh_token
        });

        // 5. Realizar petición a Spotify para refrescar el token
        const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
        });

        // 6. Procesar respuesta de Spotify
        const data = await response.json();
        
        if (!response.ok) {
        console.error('Spotify token refresh failed:', data);
        return NextResponse.json(
            { error: ERROR_MESSAGES.SPOTIFY_REFRESH_FAILED, details: data }, 
            { status: response.status }
        );
        }

        // 7. Devolver el nuevo access token (y opcionalmente un nuevo refresh token)
        return NextResponse.json(data);

    } catch (error) {
        // Manejo de errores inesperados (parsing JSON, red, etc.)
        console.error('Error during token refresh:', error);
        return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR }, 
        { status: 500 }
        );
    }
}