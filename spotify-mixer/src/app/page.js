// src/app/page.js
'use client';

import { getSpotifyAuthUrl } from '@/lib/auth'; // Usamos el alias de importación
import Background from '@/components/background/Background';

/**
 * Componente Home (Página de Inicio)
 * Página de landing que muestra el botón de login con Spotify
 * Es la primera página que ve el usuario al acceder a la aplicación
 */
export default function Home() {
    /**
     * Maneja el inicio de sesión con Spotify
     * Redirige al usuario a la página de autorización de Spotify usando OAuth 2.0
     */
    const handleLogin = () => {
        // Obtener URL de autorización y redirigir el navegador
        window.location.href = getSpotifyAuthUrl();
    };

    return (
        // Contenedor principal centrado vertical y horizontalmente en toda la pantalla
        <div class="flex flex-col items-center justify-center min-h-screen p-4">
            {/* Componente de fondo animado/decorativo */}
            <Background />

            {/* Contenedor de ancho máximo centrado */}
            <div class="max-w-sm w-full mx-auto">
                
                {/* Tarjeta principal con el contenido de login */}
                <div class="p-6 md:p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700/50 transform hover:shadow-cyan-500/30 transition duration-500 ease-in-out">
                    
                    {/* Título de la aplicación con gradiente de color */}
                    <h1 class="text-3xl font-extrabold text-center mb-3 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
                        Taste Mixer
                    </h1>
                    
                    {/* Descripción breve de la funcionalidad de la app */}
                    <p class="text-center mb-6 text-gray-400 text-sm">
                        Genera playlists únicas: mezcla tus artistas, géneros y estados de ánimo favoritos.
                    </p>

                    {/* Botón principal para iniciar el flujo de autenticación con Spotify */}
                    <button 
                        onClick={handleLogin}
                        class="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-gray-900 font-bold text-lg rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
                    >
                        Conectar con Spotify
                    </button>
                    
                    {/* Créditos del desarrollador */}
                    <p class="mt-6 text-center text-xs text-gray-600">
                        Creado por Sergio Yiheng Lin.
                    </p>
                </div>
                
            </div>
            
        </div>
    );
}