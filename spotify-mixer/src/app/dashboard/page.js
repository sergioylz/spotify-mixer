// src/app/dashboard/page.js
'use client';

import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMyProfile, getArtistTopTracks, getAudioFeatures, searchSpotify } from '@/lib/spotify'; 
import { Loader } from 'lucide-react';

// Importación de Widgets y Display
import ArtistWidget from '@/components/widgets/ArtistWidget';
import GenreWidget from '@/components/widgets/GenreWidget';
import TrackWidget from '@/components/widgets/TrackWidget'; 
import MoodWidget from '@/components/widgets/MoodWidget';
import PlaylistDisplay from '@/components/PlaylistDisplay'; 


export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState(null); // Datos del usuario
  const [isSaving, setIsSaving] = useState(false);
  
  // *** Estado Central de Preferencias (Seeds y Filtros) ***
  const [preferences, setPreferences] = useState({
    artists: [],
    genres: [],
    tracks: [],
    mood: { // Valores iniciales de Mood (el punto medio 0.5)
      energy: 0.5,
      valence: 0.5,
      danceability: 0.5,
      acousticness: 0.5,
    },
  });

  // Estado para la playlist generada
  const [playlist, setPlaylist] = useState([]);
  
  // --------------------------------------------------------
  // 1. Lógica de Autenticación al Cargar
  // --------------------------------------------------------
  useEffect(() => {
    const authenticate = async () => {
      // Intenta obtener el perfil (gestiona refresh de token)
      const profile = await getMyProfile();

      if (!profile) {
        // Si falla la autenticación/refresh, redirigir
        console.log("No se pudo autenticar al usuario. Redirigiendo.");
        router.push('/');
        return;
      }
      
      // Éxito
      setUser(profile);
      setLoading(false);
    };

    authenticate();
  }, [router]);

  const handleSavePlaylist = async () => {
        if (playlist.length === 0) {
        alert("La playlist está vacía. Genera canciones primero.");
        return;
        }

        const userId = user?.id;
        if (!userId) {
        alert("No se pudo obtener el ID de usuario.");
        setIsSaving(false);
        return;
        }

        setIsSaving(true);
    
    // 💥 OBTENER TOKENS DEL CLIENTE 💥
    const accessToken = localStorage.getItem('spotify_token');
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    
    if (!accessToken || !refreshToken) {
        alert("Tokens de autenticación no encontrados. Inicia sesión de nuevo.");
        setIsSaving(false);
        return;
    }

    const trackUris = playlist.map(track => `spotify:track:${track.id}`);
    const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    const playlistName = `Taste Mixer (${date} - ${playlist.length} tracks)`;

    try {
      // 3. Llamar a la API Route (servidor), PASANDO LOS TOKENS
      const response = await fetch('/api/save-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          playlistName,
          trackUris,
          accessToken, // <-- PASAR
          refreshToken, // <-- PASAR
        }),
      });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error desconocido al guardar.');
        }

        alert(`¡Playlist "${playlistName}" guardada en Spotify!`);
        // Opcional: Abrir la playlist en una nueva pestaña
        window.open(data.playlistUrl, '_blank');

        } catch (error) {
        console.error('Error al guardar playlist:', error);
        alert(`Fallo al guardar playlist: ${error.message}`);
        } finally {
        setIsSaving(false);
        }
    };

  // --------------------------------------------------------
  // 2. Gestión de Estado para los Widgets
  // --------------------------------------------------------
  const updatePreferences = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  // --------------------------------------------------------
  // 3. Lógica de Filtrado por Mood (Helper Function)
  // --------------------------------------------------------
  const filterByMood = (tracks, moodPrefs, audioFeatures) => {
    if (!audioFeatures || audioFeatures.length === 0) return tracks;

    return tracks.filter(track => {
      const features = audioFeatures.find(f => f && f.id === track.id);
      if (!features) return false;
      
      const { energy, valence, danceability, acousticness } = features;
      
      // Aplicar restricciones de los sliders con una tolerancia (±0.15)
      const TOLERANCE = 0.15;
      const matchesEnergy = Math.abs(energy - moodPrefs.energy) <= TOLERANCE;
      const matchesValence = Math.abs(valence - moodPrefs.valence) <= TOLERANCE;
      const matchesDanceability = Math.abs(danceability - moodPrefs.danceability) <= TOLERANCE;
      const matchesAcousticness = acousticness <= moodPrefs.acousticness + TOLERANCE;

      return matchesEnergy && matchesValence && matchesDanceability && matchesAcousticness;
    });
  };

    const handleMoodUpdate = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            mood: {
                ...prev.mood,
                [key]: value
            }
        }));
    };

  // --------------------------------------------------------
  // 4. Lógica de Generación de Playlist (Función Principal)
  // --------------------------------------------------------
  const handleGeneratePlaylist = async (append = false) => {
    const { artists, genres, tracks, mood } = preferences;
    
    // Validar semillas
    if (artists.length === 0 && genres.length === 0 && tracks.length === 0) {
      alert("Por favor, selecciona al menos un Artista, Canción o Género.");
      return;
    }

    setIsGenerating(true);
    let rawTracks = [];
    
    // --- Obtener tracks basados en Artistas y Tracks ---
    const seedPromises = [];

    // Tracks de artistas seleccionados
    artists.forEach(artist => {
      seedPromises.push(getArtistTopTracks(artist.id));
    });

    // Añadir tracks de semilla (los que el usuario buscó) al pool
    tracks.forEach(track => {
      rawTracks.push({
          ...track,
          duration_ms: track.duration_ms || 200000, 
          album: { images: [{ url: track.image }] },
          artists: [{ name: track.artist }]
      }); 
    });

    // Esperar resultados de top tracks de artistas
    const artistTracksResults = await Promise.all(seedPromises);
    artistTracksResults.forEach(trackList => {
      rawTracks.push(...trackList);
    });

    // --- Obtener tracks basados en Géneros ---
    const genrePromises = [];
    genres.forEach(genre => {
        const q = `genre:"${genre}"`; 
        // Buscamos 10 canciones populares por género para tener buen pool
        genrePromises.push(searchSpotify(q, 'track')); 
    });

    const genreResults = await Promise.all(genrePromises);
    genreResults.forEach(result => {
        if (result && result.tracks && result.tracks.items) {
            rawTracks.push(...result.tracks.items);
        }
    });
    
    // --- Limpieza y Desduplicación ---
    let uniqueTracksMap = new Map();
    rawTracks.forEach(track => {
        if (track && track.id) {
            uniqueTracksMap.set(track.id, track);
        }
    });
    let finalTracks = Array.from(uniqueTracksMap.values());
    
    // --- Aplicar Filtro de Mood ---
    const trackIdsToFilter = finalTracks.map(t => t.id).filter(id => id !== null);
    const audioFeatures = await getAudioFeatures(trackIdsToFilter);

    // Filtrar la lista final de tracks usando el Mood
    const filteredTracks = filterByMood(finalTracks, mood, audioFeatures);
    
    // 5. Limitar y actualizar el estado
    const MAX_PLAYLIST_SIZE = 50;
    let newTracks = filteredTracks.slice(0, MAX_PLAYLIST_SIZE); 
    
    if (append) {
      // Añadir al estado existente (Añadir Más Canciones)
      setPlaylist(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const toAppend = newTracks.filter(t => !existingIds.has(t.id));
        return [...prev, ...toAppend];
      });
    } else {
      // Reemplazar la lista (Generar / Refrescar)
      setPlaylist(newTracks);
    }

    setIsGenerating(false);
  };
  
  // --------------------------------------------------------
  // 5. Renderizado
  // --------------------------------------------------------
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#121212]">
        <div className="text-lg text-green-400 flex items-center space-x-3">
            <Loader size={24} className="animate-spin" />
            <span>Conectando con Spotify...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header user={user} />
      
      <main className="p-4 md:p-8">
        
        {/* Título y Botón de Generación */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">
            Tu Mezclador de Sabor 
            {user && <span className="text-xl text-green-400 block lg:inline ml-2">({user.display_name})</span>}
          </h1>
          
            {/* Botón de Guardar en Spotify */}
            <button
            onClick={handleSavePlaylist}
            className="py-3 px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center space-x-2"
            disabled={isSaving || isGenerating || playlist.length === 0}
            >
            {isSaving ? (
                <>
                <Loader size={20} className="animate-spin" />
                <span>Guardando...</span>
                </>
            ) : (
                <span>Guardar en Spotify ✨</span>
            )}
            </button>

          <button
            onClick={() => handleGeneratePlaylist()}
            className="py-3 px-6 bg-[#1DB954] hover:bg-[#1ed760] text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center space-x-2"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader size={20} className="animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              <span>Generar Playlist 🚀</span>
            )}
          </button>
        </div>

        {/* LAYOUT PRINCIPAL: Grid de Widgets + Playlist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* Columna de Widgets (1/3 en desktop) */}
          <div className="lg:col-span-1 min-w-0 space-y-6">
            <h2 className="text-xl font-semibold text-gray-300 border-b border-gray-700 pb-2">Ajusta tus Preferencias</h2>
            
            <div className="space-y-4">
              <ArtistWidget selectedItems={preferences.artists} onSelect={(items) => updatePreferences('artists', items)} />
              <GenreWidget selectedItems={preferences.genres} onSelect={(items) => updatePreferences('genres', items)} />
              <TrackWidget selectedItems={preferences.tracks} onSelect={(items) => updatePreferences('tracks', items)} />
              <MoodWidget 
                    preferences={preferences.mood} 
                    // FUNCIÓN DE ACTUALIZACIÓN CORREGIDA
                    onUpdate={(keyOrObject, value) => {
                        if (keyOrObject === 'reset' && typeof value === 'object') {
                            // Maneja el reset: El valor es el objeto {energy: 0.5, ...}
                            // Aplica el objeto completo, forzando la actualización de todos los sliders
                            setPreferences(prev => ({ ...prev, mood: value }));
                        } else {
                            // Maneja el deslizador individual (key, value)
                            setPreferences(prev => ({ 
                                ...prev, 
                                mood: { ...prev.mood, [keyOrObject]: value } 
                            }));
                        }
                    }} 
                />
            </div>
          </div>

          {/* Área Central de Playlist (2/3 en desktop) */}
          <div className="lg:col-span-2 xl:col-span-3 min-w-0">
            <h2 className="text-xl font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-4">Playlist Generada ({playlist.length} Canciones)</h2>
            
            <PlaylistDisplay 
              playlist={playlist} 
              setPlaylist={setPlaylist} 
              // Pasamos las funciones de gestión obligatorias
              onRefreshPlaylist={() => handleGeneratePlaylist(false)} // false para reemplazar
              onAddMoreTracks={() => handleGeneratePlaylist(true)} // true para añadir
            />
          </div>
        </div>
      </main>
    </div>
  );
}