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
import FavoriteHeader from '@/components/FavoriteHeader';

import Background from '@/components/background/Background';


export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState(null); // Datos del usuario
  const [isSaving, setIsSaving] = useState(false);

  // *** ESTADO CENTRAL DE FAVORITOS (CLAVE ÚNICA DE ALMACENAMIENTO: 'favorite_seeds') ***
  const [favoriteSeeds, setFavoriteSeeds] = useState({
    favoriteArtists: [],
    favoriteTracks: [],
    favoriteGenres: [],
  });
  
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
  // 1. Lógica de Autenticación y CARGA DE FAVORITOS (Corregida)
  // --------------------------------------------------------
  useEffect(() => {
    // Función helper para cargar favoritos de localStorage
    const loadFavorites = () => {
        try {
            // CLAVE UNIFICADA PARA LECTURA
            const storedFavorites = localStorage.getItem('favorite_seeds'); 
            if (storedFavorites) {
                const parsed = JSON.parse(storedFavorites);
                
                // Si la clave guarda un Array (lo cual es incorrecto pero manejable) o el Objeto completo.
                // Aquí asumimos que el objeto completo {favoriteTracks: [...]} se guarda consistentemente.
                // Si solo guardaste el array de tracks, descomenta esta lógica:
                /*
                if (Array.isArray(parsed)) {
                    setFavoriteSeeds(prev => ({ 
                        ...prev, 
                        favoriteTracks: parsed 
                    }));
                } else {
                    setFavoriteSeeds(parsed);
                }
                */
                // Dado que handleToggleFavorite guarda el objeto completo, usamos la línea simple:
                setFavoriteSeeds(parsed);
            }
        } catch (e) {
            console.error("Error al cargar favoritos de localStorage:", e);
            // Limpiar datos dañados para que la próxima carga sea limpia
            localStorage.removeItem('favorite_seeds');
        }
    };

    const authenticate = async () => {
      // 1. INTENTO DE AUTENTICACIÓN
      const profile = await getMyProfile();

      if (!profile) {
        console.log("No se pudo autenticar al usuario. Redirigiendo.");
        router.push('/');
        return;
      }
      
      // 2. ÉXITO: CARGAR DATOS PERSISTENTES (FAVORITOS)
      loadFavorites(); 
      
      // 3. ESTABILIZAR ESTADO Y TERMINAR LOADING
      setUser(profile);
      setLoading(false);
    };

    authenticate();
  }, [router]);

  // --------------------------------------------------------
  // Función de Toggle Favoritos (Guarda en 'favorite_seeds')
  // --------------------------------------------------------
  const handleToggleFavorite = (type, item) => {
        setFavoriteSeeds(prev => {
            const key = `favorite${type.charAt(0).toUpperCase() + type.slice(1)}s`; 
            const currentList = prev[key] || [];
            
            let newList;
            if (currentList.some(i => i.id === item.id)) {
                // Remover si ya existe (basado en el ID)
                newList = currentList.filter(i => i.id !== item.id);
            } else {
                // Añadir
                newList = [...currentList, item];
            }

            const updatedState = { ...prev, [key]: newList };
            
            // Guardar la lista actualizada en localStorage (Clave Consistente)
            try {
                localStorage.setItem('favorite_seeds', JSON.stringify(updatedState));
            } catch (e) {
                console.error("Error al guardar favoritos en localStorage:", e);
            }
            
            return updatedState;
        });
    };

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
  const [activeTab, setActiveTab] = useState('artists'); // <--- NUEVO ESTADO PARA PESTAÑAS

  // Mapa de widgets para renderizado más limpio
  const widgetMap = {
    artists: { title: 'Artistas', component: <ArtistWidget selectedItems={preferences.artists} onSelect={(items) => updatePreferences('artists', items)} /> },
    genres: { title: 'Géneros', component: <GenreWidget selectedItems={preferences.genres} onSelect={(items) => updatePreferences('genres', items)} /> },
    tracks: { title: 'Canciones', component: <TrackWidget selectedItems={preferences.tracks} onSelect={(items) => updatePreferences('tracks', items)} /> },
    mood: { 
      title: 'Mood', 
      component: (
        <MoodWidget 
          preferences={preferences.mood} 
          onUpdate={(keyOrObject, value) => {
            if (keyOrObject === 'reset' && typeof value === 'object') {
              setPreferences(prev => ({ ...prev, mood: value }));
            } else {
              setPreferences(prev => ({ ...prev, mood: { ...prev.mood, [keyOrObject]: value } }));
            }
          }} 
        />
      )
    },
  };
  
  // Lógica de Loading y Renderizado
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

      <FavoriteHeader 
        favoriteSeeds={favoriteSeeds} // Pasamos el objeto con todos los favoritos
        onToggleFavorite={handleToggleFavorite} // Si quieres que puedan eliminar desde aquí
      />
      
      <main className="p-4 md:p-8">
        <Background />
        
        {/* Título y Botón de Generación */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">
            Aleatoriza tu música basandote en tus gustos
            {user && <span className="text-xl text-green-400 block lg:inline ml-2">({user.display_name})</span>}
          </h1>
            <div className="flex space-x-4">
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
        </div>

        {/* LAYOUT PRINCIPAL: Dos Columnas Grandes (Widgets c/Tabs | Playlist) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Columna Izquierda: Widgets en Pestañas */}
          <div className="p-6 bg-gray-800 rounded-xl shadow-2xl min-h-[600px] flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Ajusta tus Preferencias (Seeds y Mood)</h2>
            
            {/* Navegación de Pestañas */}
            <div className="flex space-x-2 border-b border-gray-700 mb-4 overflow-x-auto">
              {Object.keys(widgetMap).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`
                    py-2 px-4 text-sm font-semibold rounded-t-lg transition-colors duration-200 whitespace-nowrap
                    ${activeTab === key 
                      ? 'bg-gray-700 text-white border-b-2 border-green-400' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'}
                  `}
                >
                  {widgetMap[key].title}
                </button>
              ))}
            </div>

            {/* Contenido de la Pestaña Activa */}
            <div className="flex-grow overflow-y-auto">
              {widgetMap[activeTab].component}
            </div>
          </div>

          {/* Columna Derecha: Playlist Generada */}
          <div className="p-6 bg-gray-800 rounded-xl shadow-2xl min-h-[600px] flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
              Playlist Generada ({playlist.length} Canciones)
            </h2>
            
            <div className="flex-grow overflow-y-auto">
              <PlaylistDisplay 
                playlist={playlist} 
                setPlaylist={setPlaylist} 
                onRefreshPlaylist={() => handleGeneratePlaylist(false)}
                onAddMoreTracks={() => handleGeneratePlaylist(true)}
                favoriteTracks={favoriteSeeds.favoriteTracks} 
                onToggleFavorite={(track) => handleToggleFavorite('track', track)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}