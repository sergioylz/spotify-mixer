const generateRandomString = (length) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'playlist-modify-public',
    'playlist-modify-private',
].join(' ');

export const getSpotifyAuthUrl = () => {

    const state = generateRandomString(16);

    if (typeof window !== 'undefined') {
        sessionStorage.setItem('spotify_auth_state', state);
    }

    const client_id = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirect_uri = process.env.NEXT_PUBLIC_REDIRECT_URI;

    if (!client_id || !redirect_uri) {
        console.error("Faltan variables de entorno para Spotify Auth.");
        return '/'; // Retorna a la raíz si falla la configuración
    }

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: client_id,
        scope: scopes,
        redirect_uri: redirect_uri,
        state: state,
        show_dialog: 'true', // Útil para testing, fuerza a que el usuario se loguee/acepte
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const validateAuthState = (state) => {
    if (typeof window === 'undefined') return false;

    const savedState = sessionStorage.getItem('spotify_auth_state');
    sessionStorage.removeItem('spotify_auth_state'); // Se usa una sola vez

    if (!state || state !== savedState) {
        console.error('CSRF validation failed: State mismatch or missing.');
        return false;
    }
    return true;
}