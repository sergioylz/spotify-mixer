'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Componente Header
 * Barra de navegación superior que muestra información del usuario y botón de logout
 * 
 * @param {Object} user - Objeto con la información del usuario de Spotify
 * @param {string} user.display_name - Nombre de usuario a mostrar
 * @param {Array} user.images - Array con las imágenes de perfil del usuario
 */
export default function Header({ user }) {
    const router = useRouter();

    /**
     * Maneja el cierre de sesión del usuario
     * Limpia todos los datos de autenticación del localStorage y redirige al home
     */
    const handleLogout = () => {
        // Eliminar token de acceso de Spotify
        localStorage.removeItem('spotify_token');
        // Eliminar token de refresco para obtener nuevos access tokens
        localStorage.removeItem('spotify_refresh_token');
        // Eliminar timestamp de expiración del token
        localStorage.removeItem('spotify_token_expiration');
        // Eliminar canciones marcadas como favoritas
        localStorage.removeItem('favorite_tracks');

        // Redirigir a la página principal (login)
        router.push('/');
    };

    return (
        // Barra de navegación fija en la parte superior con fondo oscuro
        <header className='flex justify-between items-center p-4 bg-[#181818] shadow-lg sticky top-0 z-10'>
            {/* Logo/título de la aplicación con enlace al dashboard */}
            <Link href="/dashboard" className="text-2xl font-bold text-[#1DB954] hover:text-white transition-colors">
                Taste Mixer 🎵
            </Link>
            
            {/* Sección derecha con información del usuario y botón de logout */}
            <div className="flex items-center space-x-4">
                {user && (
                // Mostrar datos del usuario si está autenticado
                <div className="text-sm text-gray-300 flex items-center space-x-2">
                    {/* Imagen de perfil del usuario (si está disponible) */}
                    {user.images && user.images[0] && (
                        <img 
                            src={user.images[0].url} 
                            alt={user.display_name} 
                            className="w-8 h-8 rounded-full" 
                        />
                    )}
                    {/* Nombre de usuario */}
                    <span>Hola, {user.display_name}</span>
                </div>
                )}

                {/* Botón para cerrar sesión y limpiar datos locales */}
                <button
                onClick={handleLogout}
                className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-full text-sm font-semibold transition-colors"
                >
                Cerrar Sesión
                </button>
            </div>
        </header>   
    );
}