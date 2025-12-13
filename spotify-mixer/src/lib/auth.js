/**
 * Genera un string aleatorio de la longitud especificada
 * Utilizado para crear tokens de estado CSRF seguros
 * 
 * @param {number} length - Longitud del string a generar
 * @returns {string} String aleatorio compuesto de letras y números
 */
const generateRandomString = (length) => {
    let text = '';
    // Caracteres alfanuméricos permitidos
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // Seleccionar caracteres aleatorios uno por uno
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Permisos (scopes) solicitados a la API de Spotify
 * - user-read-private: Leer información del perfil privado del usuario
 * - user-read-email: Acceder al email del usuario
 * - user-top-read: Leer las canciones y artistas más escuchados
 * - playlist-modify-public: Crear y modificar playlists públicas
 * - playlist-modify-private: Crear y modificar playlists privadas
 */
const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'playlist-modify-public',
    'playlist-modify-private',
].join(' '); // Se unen con espacios según requiere la API de Spotify

/**
 * Genera la URL de autorización de Spotify con todos los parámetros necesarios
 * Implementa el flujo OAuth 2.0 Authorization Code con protección CSRF
 * 
 * @returns {string} URL completa para redirigir al usuario a la página de autorización de Spotify
 *                   Retorna '/' si faltan las variables de entorno necesarias
 */
export const getSpotifyAuthUrl = () => {

    // Generar token aleatorio de 16 caracteres para protección CSRF
    const state = generateRandomString(16);

    // Guardar el estado en sessionStorage solo si estamos en el navegador (no en SSR)
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('spotify_auth_state', state);
    }

    // Obtener credenciales de Spotify desde variables de entorno
    const client_id = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirect_uri = process.env.NEXT_PUBLIC_REDIRECT_URI;

    // Validar que las variables de entorno estén configuradas
    if (!client_id || !redirect_uri) {
        console.error("Faltan variables de entorno para Spotify Auth.");
        return '/'; // Retorna a la raíz si falla la configuración
    }

    // Construir los parámetros de la URL según la especificación OAuth 2.0 de Spotify
    const params = new URLSearchParams({
        response_type: 'code',        // Indica que queremos recibir un código de autorización
        client_id: client_id,         // ID de nuestra aplicación en Spotify
        scope: scopes,                // Permisos que solicitamos
        redirect_uri: redirect_uri,   // URL a la que Spotify redirigirá después de autorizar
        state: state,                 // Token CSRF para validar que la respuesta viene de nuestra solicitud
        show_dialog: 'true',          // Útil para testing, fuerza a que el usuario se loguee/acepte
    });

    // Retornar la URL completa de autorización de Spotify
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

/**
 * Valida que el estado (state) recibido de Spotify coincida con el que generamos
 * Esta validación previene ataques CSRF (Cross-Site Request Forgery)
 * 
 * El estado se usa una sola vez y se elimina después de la validación
 * 
 * @param {string} state - Estado recibido de Spotify en la URL de callback
 * @returns {boolean} true si el estado es válido, false en caso contrario
 */
export const validateAuthState = (state) => {
    // Solo funciona en el navegador (sessionStorage no existe en servidor)
    if (typeof window === 'undefined') return false;

    // Recuperar el estado que guardamos antes de redirigir a Spotify
    const savedState = sessionStorage.getItem('spotify_auth_state');
    sessionStorage.removeItem('spotify_auth_state'); // Se usa una sola vez (previene replay attacks)

    // Verificar que el estado existe y coincide exactamente
    if (!state || state !== savedState) {
        console.error('CSRF validation failed: State mismatch or missing.');
        return false;
    }
    return true;
}