// src/app/page.js
'use client';

import { getSpotifyAuthUrl } from '@/lib/auth'; // Usamos el alias de importación

export default function Home() {
    const handleLogin = () => {
        // Redirige al usuario a la URL de autorización de Spotify
        window.location.href = getSpotifyAuthUrl();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="p-8 max-w-md w-full bg-gray-800 rounded-lg shadow-2xl">
            <h1 className="text-4xl font-bold text-center mb-4 text-green-400">
            Spotify Taste Mixer
            </h1>
            <p className="text-center mb-8 text-gray-400">
            Genera playlists personalizadas mezclando artistas, géneros y estados de ánimo.
            </p>

            <button
            onClick={handleLogin}
            className="w-full py-3 px-6 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
            Iniciar Sesión con Spotify 🎵
            </button>
            
            <p className="mt-4 text-center text-sm text-gray-500">
            Se requiere una cuenta de Spotify para continuar.
            </p>
        </div>
        </div>
    );
}