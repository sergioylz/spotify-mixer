import { NextResponse } from 'next/server';

/**
 * API Route para el intercambio de código de autorización por tokens de Spotify.
 * @param {Request} request - El objeto de la solicitud (Request).
 */
export async function POST(request) {
    // 1. Obtener datos necesarios
    const body = await request.json();
    const code = body.code || null;
    
    if (!code) {
        return NextResponse.json({ error: 'Code not found' }, { status: 400 });
    }

    // 2. Cargar variables de entorno (solo accesibles en el servidor)
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirect_uri = process.env.NEXT_PUBLIC_REDIRECT_URI;

    if (!client_id || !client_secret || !redirect_uri) {
        console.error("Faltan variables de entorno críticas en el servidor.");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 3. Preparar los datos para la petición POST a Spotify
    const authHeader = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirect_uri);

    try {
        // 4. Realizar la petición POST a Spotify para obtener los tokens
        const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
        });

        // 5. Manejar la respuesta del servidor de Spotify
        if (!response.ok) {
        const errorData = await response.json();
        console.error('Spotify token exchange failed:', errorData);
        return NextResponse.json({ error: 'Spotify token exchange failed', details: errorData }, { status: response.status });
        }

        const data = await response.json();
        
        // 6. Respuesta exitosa con los tokens
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error during token exchange:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}