'use client';

// Componentes de UI
import Header from '@/components/Header';
import Background from '@/components/background/Background';

// Hooks de React y Next.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Funciones de la API de Spotify
import { getMyProfile, getArtistTopTracks, getAudioFeatures, searchSpotify } from '@/lib/spotify'; 

// Iconos
import { Loader } from 'lucide-react';

// Widgets para selección de seeds y mood
import WrappedWidget from '@/components/widgets/WrappedWidget';
import ArtistWidget from '@/components/widgets/ArtistWidget';
import GenreWidget from '@/components/widgets/GenreWidget';
import TrackWidget from '@/components/widgets/TrackWidget'; 
import MoodWidget from '@/components/widgets/MoodWidget';

// Componentes de visualización de playlist y favoritos
import PlaylistDisplay from '@/components/PlaylistDisplay'; 
import FavoriteHeader from '@/components/FavoriteHeader';

/**
 * Componente Dashboard
 * Página principal de la aplicación donde el usuario puede:
 * - Seleccionar artistas, géneros y canciones como "seeds"
 * - Ajustar parámetros de mood (energía, valencia, bailabilidad, acústica)
 * - Generar playlists personalizadas basadas en sus preferencias
 * - Guardar las playlists en su cuenta de Spotify
 * - Ver su Spotify Wrapped (top artistas y canciones)
 * - Marcar canciones como favoritas
 */
export default function Dashboard() {
  // Router de Next.js para navegación
  const router = useRouter();
  
  // ============================================================================
  // Estados de Autenticación y Usuario
  // ============================================================================
  
  // Token de acceso de Spotify para hacer peticiones a la API
  const [accessToken, setAccessToken] = useState(null);
  // Control de carga inicial mientras se autentica
  const [loading, setLoading] = useState(true);
  // Datos del perfil del usuario de Spotify
  const [user, setUser] = useState(null);

  // ============================================================================
  // Estados de Favoritos (Persistidos en localStorage con clave 'favorite_seeds')
  // ============================================================================
  
  // Estado central que agrupa todos los elementos marcados como favoritos
  // Se guarda y carga desde localStorage para persistencia entre sesiones
  const [favoriteSeeds, setFavoriteSeeds] = useState({
    favoriteArtists: [],   // Artistas favoritos del usuario
    favoriteTracks: [],    // Canciones favoritas del usuario
    favoriteGenres: [],    // Géneros favoritos del usuario
  });
  
  // ============================================================================
  // Estados de Preferencias (Seeds y Mood para generación de playlist)
  // ============================================================================
  
  // Estado central de preferencias usado para generar playlists
  // Contiene los "seeds" (artistas, géneros, canciones) y parámetros de mood
  const [preferences, setPreferences] = useState({
    artists: [],           // Artistas seleccionados como seeds
    genres: [],            // Géneros seleccionados como seeds
    tracks: [],            // Canciones seleccionadas como seeds
    mood: {                // Parámetros de audio para filtrar canciones
      energy: 0.5,         // Energía/intensidad (0.0 = calmado, 1.0 = activo)
      valence: 0.5,        // Positividad (0.0 = triste, 1.0 = feliz)
      danceability: 0.5,   // Bailabilidad (0.0 = poco bailable, 1.0 = muy bailable)
      acousticness: 0.5,   // Nivel acústico (0.0 = electrónico, 1.0 = acústico)
    },
  });

  // ============================================================================
  // Estados de Playlist
  // ============================================================================
  
  // Array de canciones generadas para la playlist actual
  const [playlist, setPlaylist] = useState([]);
  // Nombre personalizado para la playlist (opcional)
  const [playlistName, setPlaylistName] = useState('');
  
  // ============================================================================
  // Estados de UI y Procesos
  // ============================================================================
  
  // Indica si se está generando una playlist (muestra spinner)
  const [isGenerating, setIsGenerating] = useState(false);
  // Indica si se está guardando la playlist en Spotify (muestra spinner)
  const [isSaving, setIsSaving] = useState(false);
  
  // ============================================================================
  // Effect: Autenticación y Carga de Datos Persistentes
  // ============================================================================
  
  /**
   * Effect principal que se ejecuta al montar el componente
   * Realiza tres tareas críticas:
   * 1. Autentica al usuario verificando el token de Spotify
   * 2. Carga los favoritos guardados desde localStorage
   * 3. Obtiene el perfil del usuario de Spotify
   */
  useEffect(() => {
    /**
     * Función auxiliar para cargar favoritos desde localStorage
     * Lee la clave 'favorite_seeds' que contiene artistas, tracks y géneros favoritos
     */
    const loadFavorites = () => {
        try {
            // Leer datos de favoritos desde localStorage usando clave unificada
            const storedFavorites = localStorage.getItem('favorite_seeds'); 
            if (storedFavorites) {
                // Parsear JSON y establecer en el estado
                const parsed = JSON.parse(storedFavorites);
                
                // Guardar el objeto completo de favoritos en el estado
                // El objeto debe tener la estructura: {favoriteArtists: [], favoriteTracks: [], favoriteGenres: []}
                setFavoriteSeeds(parsed);
            }
        } catch (e) {
            // Si hay error al parsear (datos corruptos), limpiar localStorage
            console.error("Error al cargar favoritos de localStorage:", e);
            localStorage.removeItem('favorite_seeds');
        }
    };

    /**
     * Función asíncrona que maneja todo el proceso de autenticación
     * Verifica credenciales, carga datos persistentes y configura el estado inicial
     */
    const authenticate = async () => {
      // Paso 1: Intentar obtener el perfil del usuario de Spotify
      // Esta función verifica automáticamente el token y lo refresca si es necesario
      const profile = await getMyProfile();

      // Si no se pudo autenticar, redirigir al login
      if (!profile) {
        console.log("No se pudo autenticar al usuario. Redirigiendo.");
        router.push('/');
        return;
      }
      
      // Paso 2: Autenticación exitosa - Cargar datos persistentes
      
      // Cargar favoritos guardados previamente
      loadFavorites();
      
      // Obtener y guardar el access token desde localStorage
      const token = localStorage.getItem('spotify_token');
      if (token) {
        setAccessToken(token);
      }
      
      // Paso 3: Finalizar carga y mostrar dashboard
      setUser(profile);
      setLoading(false);
    };

    // Ejecutar autenticación al montar el componente
    authenticate();
  }, [router]); // Dependencia: router (no cambia, pero es requerida por el linter)

  // ============================================================================
  // Función: Gestión de Favoritos
  // ============================================================================
  
  /**
   * Maneja la acción de marcar/desmarcar elementos como favoritos
   * Soporta artistas, canciones (tracks) y géneros
   * Persiste los cambios en localStorage automáticamente
   * 
   * @param {string} type - Tipo de elemento ('artist', 'track', 'genre')
   * @param {Object} item - Objeto del elemento con al menos una propiedad 'id'
   */
  const handleToggleFavorite = (type, item) => {
        setFavoriteSeeds(prev => {
            // Construir el nombre de la clave dinámicamente
            // Ejemplo: type='track' => key='favoriteTracks'
            const key = `favorite${type.charAt(0).toUpperCase() + type.slice(1)}s`; 
            
            // Obtener la lista actual de ese tipo de favoritos
            const currentList = prev[key] || [];
            
            let newList;
            // Verificar si el elemento ya está en favoritos (comparar por ID)
            if (currentList.some(i => i.id === item.id)) {
                // Si existe, removerlo (toggle off)
                newList = currentList.filter(i => i.id !== item.id);
            } else {
                // Si no existe, agregarlo (toggle on)
                newList = [...currentList, item];
            }

            // Crear el nuevo estado con la lista actualizada
            const updatedState = { ...prev, [key]: newList };
            
            // Persistir en localStorage con manejo de errores
            try {
                localStorage.setItem('favorite_seeds', JSON.stringify(updatedState));
            } catch (e) {
                console.error("Error al guardar favoritos en localStorage:", e);
            }
            
            // Retornar el nuevo estado para actualizar el componente
            return updatedState;
        });
    };

  /**
   * Guarda la playlist generada en la cuenta de Spotify del usuario
   * Crea una nueva playlist con el nombre especificado (o generado automáticamente)
   * y añade todas las canciones de la playlist actual
   */
  const handleSavePlaylist = async () => {
        // Validación: verificar que hay canciones en la playlist
        if (playlist.length === 0) {
        alert("La playlist está vacía. Genera canciones primero.");
        return;
        }

        // Obtener ID del usuario de Spotify (necesario para crear playlist)
        const userId = user?.id;
        if (!userId) {
        alert("No se pudo obtener el ID de usuario.");
        setIsSaving(false);
        return;
        }

        // Activar indicador de carga
        setIsSaving(true);
    
    // Obtener tokens de autenticación desde localStorage
    // Ambos tokens son necesarios: access token para la petición y refresh token por si expira
    const accessToken = localStorage.getItem('spotify_token');
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    
    // Validar que los tokens existen
    if (!accessToken || !refreshToken) {
        alert("Tokens de autenticación no encontrados. Inicia sesión de nuevo.");
        setIsSaving(false);
        return;
    }

    // Convertir IDs de canciones al formato URI requerido por Spotify
    // Formato: "spotify:track:{id}"
    const trackUris = playlist.map(track => `spotify:track:${track.id}`);
    
    // Generar nombre de playlist: usar el nombre personalizado o crear uno automático
    const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    const finalPlaylistName = playlistName.trim() || `Taste Mixer (${date} - ${playlist.length} tracks)`;

    try {
      // Llamar a la API Route del servidor que maneja la creación de playlist en Spotify
      // Se envían los tokens desde el cliente por seguridad (no se exponen client_secret)
      const response = await fetch('/api/save-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,              // ID del usuario de Spotify
          playlistName: finalPlaylistName,  // Nombre de la playlist
          trackUris,           // URIs de las canciones
          accessToken,         // Token de acceso
          refreshToken,        // Token de refresco
        }),
      });

        // Parsear respuesta del servidor
        const data = await response.json();

        // Manejar errores de la API
        if (!response.ok) {
            throw new Error(data.error || 'Error desconocido al guardar.');
        }

        // Éxito: mostrar confirmación y abrir playlist en Spotify
        alert(`¡Playlist "${finalPlaylistName}" guardada en Spotify!`);
        
        // Abrir la playlist guardada en una nueva pestaña
        window.open(data.playlistUrl, '_blank');
        
        // Limpiar el campo de nombre para la próxima playlist
        setPlaylistName('');

        } catch (error) {
        // Manejar errores y mostrar mensaje al usuario
        console.error('Error al guardar playlist:', error);
        alert(`Fallo al guardar playlist: ${error.message}`);
        } finally {
        // Siempre desactivar el indicador de carga
        setIsSaving(false);
        }
    };

  // ============================================================================
  // Funciones: Gestión de Preferencias (Seeds y Mood)
  // ============================================================================
  
  /**
   * Actualiza una preferencia específica (artistas, géneros o tracks)
   * 
   * @param {string} key - Clave de la preferencia a actualizar ('artists', 'genres', 'tracks')
   * @param {*} value - Nuevo valor para esa preferencia
   */
  const updatePreferences = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Limpia todas las selecciones de preferencias y las resetea a valores por defecto
   * Requiere confirmación del usuario para evitar pérdida accidental de datos
   */
  const handleClearSelections = () => {
    if (confirm('¿Estás seguro de que quieres limpiar todas las selecciones?')) {
      // Resetear todas las preferencias a estado inicial
      setPreferences({
        artists: [],
        genres: [],
        tracks: [],
        mood: {
          energy: 0.5,        // Valores neutrales en el punto medio
          valence: 0.5,
          danceability: 0.5,
          acousticness: 0.5,
        },
      });
    }
  };

  /**
   * Añade nuevas canciones a la playlist existente sin duplicados
   * Filtra canciones que ya están en la playlist usando un Set para eficiencia
   * 
   * @param {Array} tracks - Array de canciones a añadir
   */
  const handleAddTracksToPlaylist = (tracks) => {
    setPlaylist(prev => {
      // Crear Set con IDs existentes para búsqueda rápida O(1)
      const existingIds = new Set(prev.map(t => t.id));
      // Filtrar solo las canciones que no están ya en la playlist
      const newTracks = tracks.filter(t => !existingIds.has(t.id));
      // Añadir las nuevas canciones al final
      return [...prev, ...newTracks];
    });
  };

  // ============================================================================
  // Función: Filtrado de Canciones por Mood
  // ============================================================================
  
  /**
   * Filtra canciones basadas en los parámetros de mood seleccionados
   * Compara las características de audio de cada canción con las preferencias del usuario
   * Usa una tolerancia de ±0.15 para permitir cierta flexibilidad en el matching
   * 
   * @param {Array} tracks - Array de canciones a filtrar
   * @param {Object} moodPrefs - Objeto con preferencias de mood (energy, valence, danceability, acousticness)
   * @param {Array} audioFeatures - Array con las características de audio de las canciones obtenidas de Spotify API
   * @returns {Array} Canciones filtradas que coinciden con los parámetros de mood
   */
  const filterByMood = (tracks, moodPrefs, audioFeatures) => {
    // Si no hay datos de audio features, retornar todas las canciones sin filtrar
    if (!audioFeatures || audioFeatures.length === 0) return tracks;

    return tracks.filter(track => {
      // Buscar las características de audio de esta canción específica
      const features = audioFeatures.find(f => f && f.id === track.id);
      // Si no se encontraron features para esta canción, excluirla
      if (!features) return false;
      
      // Extraer los valores de las características de audio
      const { energy, valence, danceability, acousticness } = features;
      
      // Definir tolerancia para el matching (permite ±0.15 de diferencia)
      // Esto hace que el filtrado no sea tan estricto
      const TOLERANCE = 0.15;
      
      // Verificar que cada parámetro esté dentro del rango de tolerancia
      const matchesEnergy = Math.abs(energy - moodPrefs.energy) <= TOLERANCE;
      const matchesValence = Math.abs(valence - moodPrefs.valence) <= TOLERANCE;
      const matchesDanceability = Math.abs(danceability - moodPrefs.danceability) <= TOLERANCE;
      // Acousticness usa sólo límite superior (más flexible)
      const matchesAcousticness = acousticness <= moodPrefs.acousticness + TOLERANCE;

      // La canción debe coincidir con TODOS los parámetros para pasar el filtro
      return matchesEnergy && matchesValence && matchesDanceability && matchesAcousticness;
    });
  };

  /**
   * Actualiza un parámetro específico de mood
   * 
   * @param {string} key - Parámetro de mood a actualizar ('energy', 'valence', 'danceability', 'acousticness')
   * @param {number} value - Nuevo valor del parámetro (0.0 a 1.0)
   */
    const handleMoodUpdate = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            mood: {
                ...prev.mood,
                [key]: value
            }
        }));
    };

  // ============================================================================
  // Función Principal: Generación de Playlist
  // ============================================================================
  
  /**
   * Genera una playlist personalizada basada en las preferencias del usuario
   * 
   * Proceso:
   * 1. Obtiene canciones de los artistas seleccionados (top tracks)
   * 2. Añade las canciones seleccionadas directamente
   * 3. Busca canciones de los géneros seleccionados
   * 4. Elimina duplicados
   * 5. Filtra por parámetros de mood usando audio features de Spotify
   * 6. Limita a 50 canciones máximo
   * 
   * @param {boolean} append - Si es true, añade a la playlist existente; si es false, reemplaza la playlist
   */
  const handleGeneratePlaylist = async (append = false) => {
    // Extraer todas las preferencias actuales
    const { artists, genres, tracks, mood } = preferences;
    
    // Validación: verificar que el usuario seleccionó al menos algo
    if (artists.length === 0 && genres.length === 0 && tracks.length === 0) {
      alert("Por favor, selecciona al menos un Artista, Canción o Género.");
      return;
    }

    // Activar indicador de carga
    setIsGenerating(true);
    
    // Array temporal para acumular todas las canciones antes de filtrar
    let rawTracks = [];
    
    // ========================================================================
    // FASE 1: Obtener canciones de Artistas y Tracks
    // ========================================================================
    
    // Array para almacenar todas las promesas de peticiones asíncronas
    const seedPromises = [];

    // Para cada artista seleccionado, obtener sus top tracks
    artists.forEach(artist => {
      seedPromises.push(getArtistTopTracks(artist.id));
    });

    // Añadir directamente las canciones que el usuario buscó y seleccionó
    // Estas canciones necesitan ser transformadas al formato correcto
    tracks.forEach(track => {
      rawTracks.push({
          ...track,
          duration_ms: track.duration_ms || 200000,  // Duración por defecto: 3:20 minutos
          album: { images: [{ url: track.image }] }, // Adaptar formato de imagen
          artists: [{ name: track.artist }]          // Adaptar formato de artista
      }); 
    });

    // Esperar a que todas las peticiones de top tracks de artistas se completen
    const artistTracksResults = await Promise.all(seedPromises);
    // Añadir todos los resultados al array de canciones crudas
    artistTracksResults.forEach(trackList => {
      rawTracks.push(...trackList);
    });

    // ========================================================================
    // FASE 2: Obtener canciones de Géneros
    // ========================================================================
    
    const genrePromises = [];
    genres.forEach(genre => {
        // Construir query de búsqueda para este género
        const q = `genre:"${genre}"`; 
        // Buscar 10 canciones populares por cada género para tener un buen pool de opciones
        genrePromises.push(searchSpotify(q, 'track')); 
    });

    // Esperar a que todas las búsquedas de géneros se completen
    const genreResults = await Promise.all(genrePromises);
    // Añadir los resultados al array de canciones crudas
    genreResults.forEach(result => {
        if (result && result.tracks && result.tracks.items) {
            rawTracks.push(...result.tracks.items);
        }
    });
    
    // ========================================================================
    // FASE 3: Limpieza y Deduplicación
    // ========================================================================
    
    // Usar un Map para eliminar duplicados basándose en el ID de la canción
    // Map garantiza que cada ID aparezca solo una vez
    let uniqueTracksMap = new Map();
    rawTracks.forEach(track => {
        // Solo añadir si la canción tiene un ID válido
        if (track && track.id) {
            uniqueTracksMap.set(track.id, track);
        }
    });
    // Convertir el Map de vuelta a un Array
    let finalTracks = Array.from(uniqueTracksMap.values());
    
    // ========================================================================
    // FASE 4: Aplicar Filtro de Mood usando Audio Features
    // ========================================================================
    
    // Extraer todos los IDs de las canciones para obtener sus audio features
    const trackIdsToFilter = finalTracks.map(t => t.id).filter(id => id !== null);
    // Obtener las características de audio de Spotify API
    const audioFeatures = await getAudioFeatures(trackIdsToFilter);

    // Filtrar la lista usando las preferencias de mood del usuario
    const filteredTracks = filterByMood(finalTracks, mood, audioFeatures);
    
    // ========================================================================
    // FASE 5: Limitar tamaño y actualizar estado
    // ========================================================================
    
    // Límite máximo de canciones en la playlist
    const MAX_PLAYLIST_SIZE = 50;
    // Tomar solo las primeras 50 canciones
    let newTracks = filteredTracks.slice(0, MAX_PLAYLIST_SIZE); 
    
    if (append) {
      // Modo "Añadir Más": agregar a la playlist existente sin duplicados
      setPlaylist(prev => {
        // Crear Set con IDs existentes para evitar duplicados
        const existingIds = new Set(prev.map(t => t.id));
        // Filtrar solo canciones nuevas
        const toAppend = newTracks.filter(t => !existingIds.has(t.id));
        // Añadir al final de la playlist actual
        return [...prev, ...toAppend];
      });
    } else {
      // Modo "Generar/Refrescar": reemplazar completamente la playlist
      setPlaylist(newTracks);
    }

    // Desactivar indicador de carga
    setIsGenerating(false);
  };
  
  // ============================================================================
  // UI: Estados y Configuración de Pestañas
  // ============================================================================
  
  // Estado para controlar qué pestaña de widget está activa
  const [activeTab, setActiveTab] = useState('artists');

  /**
   * Mapa de configuración de widgets para renderizado dinámico
   * Cada clave representa una pestaña con su título y componente asociado
   * Esto facilita agregar/quitar widgets sin cambiar mucho código
   */
  const widgetMap = {
    // Pestaña de Artistas
    artists: { 
      title: 'Artistas', 
      component: <ArtistWidget selectedItems={preferences.artists} onSelect={(items) => updatePreferences('artists', items)} /> 
    },
    // Pestaña de Géneros
    genres: { 
      title: 'Géneros', 
      component: <GenreWidget selectedItems={preferences.genres} onSelect={(items) => updatePreferences('genres', items)} /> 
    },
    // Pestaña de Canciones
    tracks: { 
      title: 'Canciones', 
      component: <TrackWidget selectedItems={preferences.tracks} onSelect={(items) => updatePreferences('tracks', items)} /> 
    },
    // Pestaña de Mood con manejo especial para reset
    mood: { 
      title: 'Mood', 
      component: (
        <MoodWidget 
          preferences={preferences.mood} 
          onUpdate={(keyOrObject, value) => {
            // Manejar tanto actualizaciones individuales como reset completo
            if (keyOrObject === 'reset' && typeof value === 'object') {
              // Reset completo: reemplazar todo el objeto mood
              setPreferences(prev => ({ ...prev, mood: value }));
            } else {
              // Actualización individual: actualizar solo una propiedad
              setPreferences(prev => ({ ...prev, mood: { ...prev.mood, [keyOrObject]: value } }));
            }
          }} 
        />
      )
    },
  };
  
  // ============================================================================
  // Renderizado: Estado de Carga
  // ============================================================================
  
  // Mientras se está autenticando, mostrar pantalla de carga
  if (loading) {
    return (
      // Pantalla centrada con spinner y mensaje
      <div className="flex justify-center items-center min-h-screen bg-[#121212]">
        <div className="text-lg text-green-400 flex items-center space-x-3">
            {/* Icono de carga animado */}
            <Loader size={24} className="animate-spin" />
            <span>Conectando con Spotify...</span>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Renderizado: Dashboard Principal
  // ============================================================================
  
  return (
    // Contenedor principal del dashboard
    <div className="min-h-screen">
      {/* Header con información del usuario y botón de logout */}
      <Header user={user} />

      {/* Barra de canciones favoritas destacadas (solo se muestra si hay favoritos) */}
      <FavoriteHeader 
        favoriteSeeds={favoriteSeeds} // Objeto con todos los favoritos
        onToggleFavorite={handleToggleFavorite} // Función para eliminar favoritos desde aquí
      />
      
      <main className="p-4 md:p-8">
        <Background />
        
        {/* Título y Botón de Generación */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">
            Aleatoriza tu música basandote en tus gustos
            {user && <span className="text-xl text-green-400 block lg:inline ml-2">({user.display_name})</span>}
          </h1>
            <div className="flex flex-wrap gap-4 items-center">
              {/* Campo para nombre de playlist */}
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Nombre de playlist (opcional)"
                className="py-2 px-4 bg-gray-700 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
              />
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
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">   
                {/* ENCABEZADO (No necesita border-b) */}
                <h2 className="text-2xl font-bold text-white">Ajusta tus Preferencias (Seeds y Mood)</h2>
                
                {/* BOTÓN (Alineado a la derecha) */}
                <button
                    onClick={handleClearSelections}
                    // Clases ajustadas para ser más compacto y usar el color de "peligro"
                    className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-full transition-all duration-300 transform hover:scale-105 flex items-center space-x-1"
                    title="Limpiar todas las selecciones"
                >
                    <span>Limpiar</span>
                    <span className="text-lg">🧹</span>
                </button>
            </div>
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
                onClearPlaylist={() => setPlaylist([])}
                favoriteTracks={favoriteSeeds.favoriteTracks} 
                onToggleFavorite={(track) => handleToggleFavorite('track', track)}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-8">
              <div className="lg:col-span-1">
                <WrappedWidget 
                    accessToken={accessToken}
                    onAddToPlaylist={handleAddTracksToPlaylist}
                />
              </div>
          </div>
      </main>
    </div>
  );
}