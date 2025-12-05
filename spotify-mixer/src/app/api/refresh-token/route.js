// src/app/api/refresh-token/route.js
import { NextResponse } from 'next/server';

/**
 * API Route para refrescar un token de acceso de Spotify expirado.
 * @param {Request} request - El objeto de la solicitud (Request).
 */
export async function POST(request) {
  // 1. Obtener el refresh token del cuerpo de la solicitud
    const body = await request.json();
    const refresh_token = body.refresh_token || null;

    if (!refresh_token) {
        return NextResponse.json({ error: 'Refresh token not found' }, { status: 400 });
    }

    // 2. Cargar variables de entorno
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!client_id || !client_secret) {
        console.error("Faltan variables de entorno críticas en el servidor.");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 3. Preparar datos y headers
    const authHeader = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refresh_token);

    try {
        // 4. Realizar la petición POST a Spotify para refrescar el token
        const response = await fetch('http://googleusercontent.com/spotify.com/7', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
        });

        // 5. Manejar la respuesta
        if (!response.ok) {
        const errorData = await response.json();
        console.error('Spotify token refresh failed:', errorData);
        return NextResponse.json({ error: 'Spotify token refresh failed', details: errorData }, { status: response.status });
        }

        const data = await response.json();

        // 6. Respuesta exitosa con el nuevo token de acceso (y, a veces, un nuevo refresh token)
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error during token refresh:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}