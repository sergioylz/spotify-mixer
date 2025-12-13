// src/app/api/spotify-token/route.js
// ============================================
// API ROUTE: INTERCAMBIO DE CÓDIGO POR TOKENS
// ============================================
// Este endpoint maneja el paso final del flujo OAuth 2.0:
// Recibe el código de autorización de Spotify y lo intercambia
// por access_token y refresh_token usando las credenciales de la app.
// Este proceso DEBE ocurrir en el servidor para mantener el client_secret seguro.

import { NextResponse } from 'next/server';

/**
 * Manejador POST para intercambiar código de autorización por tokens de Spotify
 * 
 * Flujo OAuth 2.0 - Authorization Code Flow:
 * 1. Usuario autoriza la app en Spotify
 * 2. Spotify redirige con un código de autorización
 * 3. Este endpoint intercambia el código por tokens
 * 4. Devuelve access_token, refresh_token y tiempo de expiración
 * 
 * @param {Request} request - Solicitud con { code: string } en el body
 * @returns {Promise<NextResponse>} Tokens de Spotify o error
 */
export async function POST(request) {
    // ============================================
    // PASO 1: Obtener el código de autorización
    // ============================================
    const body = await request.json();
    const code = body.code || null;
    
    // Validar que el código existe
    // Sin código no podemos obtener tokens de Spotify
    if (!code) {
        return NextResponse.json({ error: 'Code not found' }, { status: 400 });
    }

    // ============================================
    // PASO 2: Cargar credenciales de la app
    // ============================================
    // Estas variables SOLO están disponibles en el servidor (Next.js API Routes)
    // NUNCA deben exponerse al cliente por seguridad
    const client_id = process.env.SPOTIFY_CLIENT_ID;           // ID público de la app
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;   // Secret (¡CONFIDENCIAL!)
    const redirect_uri = process.env.NEXT_PUBLIC_REDIRECT_URI; // URI de callback registrada

    // Verificar que todas las credenciales están configuradas
    if (!client_id || !client_secret || !redirect_uri) {
        console.error("Faltan variables de entorno críticas en el servidor.");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // ============================================
    // PASO 3: Preparar autenticación Basic Auth
    // ============================================
    // Spotify requiere autenticación Basic Auth en el header
    // Formato: "Basic base64(client_id:client_secret)"
    const authHeader = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    
    // Preparar el body de la petición (application/x-www-form-urlencoded)
    // grant_type: Tipo de flujo OAuth (authorization_code)
    // code: El código recibido de Spotify
    // redirect_uri: Debe coincidir con el usado en la autorización inicial
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirect_uri);

    try {
        // ============================================
        // PASO 4: Intercambiar código por tokens
        // ============================================
        // POST https://accounts.spotify.com/api/token
        // Esta es la petición oficial de Spotify para obtener tokens
        const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${authHeader}`,              // Autenticación de la app
            'Content-Type': 'application/x-www-form-urlencoded'  // Formato requerido por Spotify
        },
        body: params.toString()  // Enviar código y redirect_uri  // Enviar código y redirect_uri
        });

        // ============================================
        // PASO 5: Validar la respuesta de Spotify
        // ============================================
        if (!response.ok) {
        // Si Spotify rechaza la petición (código inválido, expirado, etc.)
        const errorData = await response.json();
        console.error('Spotify token exchange failed:', errorData);
        return NextResponse.json({ error: 'Spotify token exchange failed', details: errorData }, { status: response.status });
        }

        // Respuesta exitosa contiene:
        // - access_token: Token para hacer peticiones a la API (válido ~1 hora)
        // - refresh_token: Token para renovar el access_token sin re-login
        // - expires_in: Segundos hasta que expire el access_token
        // - token_type: "Bearer"
        // - scope: Permisos concedidos
        const data = await response.json();
        
        // ============================================
        // PASO 6: Devolver tokens al cliente
        // ============================================
        // El cliente guardará estos tokens en localStorage
        return NextResponse.json(data);

    } catch (error) {
        // Capturar errores de red, timeout, o parsing JSON
        console.error('Error during token exchange:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}