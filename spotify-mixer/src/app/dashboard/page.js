// src/app/dashboard/page.js
'use client';

import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Importa la nueva utilidad
import { getMyProfile } from '@/lib/spotify'; 

// IMPORTAR WIDGETS (Resto del código...)
//import ArtistWidget from '@/components/widgets/ArtistWidget';
//import GenreWidget from '@/components/widgets/GenreWidget';
//import MoodWidget from '@/components/widgets/MoodWidget';
//import PlaylistDisplay from '@/components/PlaylistDisplay';

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null); // Nuevo estado para los datos del usuario
    
    // ... (Resto de estados: preferences, playlist) ...
    const [preferences, setPreferences] = useState({
        artists: [], 
        genres: [],  
        mood: {      
        min_energy: 0,
        max_valence: 100,
        danceability: 50,
        },
    });
    const [playlist, setPlaylist] = useState([]);


    // ** Lógica de Validación de Autenticación **
    useEffect(() => {
        const authenticate = async () => {
        // Intentar obtener el perfil del usuario.
        // spotifyRequest hará el refresh si el token está expirado.
        const profile = await getMyProfile();

        if (!profile) {
            // Si no se pudo obtener el perfil (no hay token o refresh falló)
            console.log("No se pudo autenticar al usuario. Redirigiendo.");
            router.push('/');
            return;
        }
        
        // Autenticación exitosa
        setUser(profile);
        setLoading(false);
        console.log('Usuario autenticado:', profile.display_name);
        };

        authenticate();
    }, [router]);


    // Función PLACEHOLDER para actualizar las preferencias (Mantener igual)
    const updatePreferences = (key, value) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    // Función PLACEHOLDER para generar la playlist (Mantener igual)
    const handleGeneratePlaylist = async () => {
        console.log("Generando playlist con preferencias:", preferences);
        // ...
        // Simulación de carga 
        setPlaylist([{ id: 'mock1', name: 'Mock Track 1', artist: 'Mock Artist', duration_ms: 200000, album: { images: [{ url: '/placeholder.jpg' }] } }]);
    };


    if (loading) {
        return (
        <div className="flex justify-center items-center min-h-screen bg-[#121212]">
            <div className="text-lg text-green-400">Conectando con Spotify...</div>
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#121212]">
        {/* <Header user={user} */}
        
        <main className="p-4 md:p-8">
            
            {/* Título y Botón */}
            <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">
                Tu Mezclador de Sabor 
                {user && <span className="text-xl text-green-400 block lg:inline ml-2">({user.display_name})</span>}
            </h1>
            {/* ... (Resto del código del Dashboard) ... */}
            </div>
            {/* ... */}
        </main>
        </div>
    );
}