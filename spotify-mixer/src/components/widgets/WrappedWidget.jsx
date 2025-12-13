// src/components/widgets/WrappedWidget.jsx
'use client';

import { useState, useEffect } from 'react';
import { getTopItems } from '@/lib/spotify'; 
import { Loader, User, Music, PlusCircle } from 'lucide-react';

/**
 * Componente WrappedWidget
 * Muestra un resumen estilo "Spotify Wrapped" con los artistas y canciones más escuchados
 * del usuario en los últimos 6 meses (medium_term)
 * 
 * @param {string} accessToken - Token de acceso de Spotify para hacer peticiones a la API
 * @param {Function} onAddToPlaylist - Callback para añadir canciones a la playlist
 */
export default function WrappedWidget({ accessToken, onAddToPlaylist }) {
    // Estado para almacenar los top 5 artistas más escuchados
    const [topArtists, setTopArtists] = useState(null);
    // Estado para almacenar las top 5 canciones más escuchadas
    const [topTracks, setTopTracks] = useState(null);
    // Estado para controlar la carga de datos
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Effect que carga los datos de Wrapped cuando el accessToken está disponible
     * Se ejecuta cada vez que cambia el accessToken
     */
    useEffect(() => {
        /**
         * Función asíncrona que obtiene los top artistas y canciones de Spotify
         * Usa el rango de tiempo 'medium_term' (últimos 6 meses) para ambos
         */
        const loadWrappedData = async () => {
            setIsLoading(true);

            // Usamos directamente el accessToken que viene del Dashboard
            const token = accessToken; 
            
            // Cargar Top 5 Artistas en los últimos 6 meses
            // 'medium_term' = últimos 6 meses aproximadamente
            const artistsData = await getTopItems(token, 'artists', 'medium_term', 5);
            setTopArtists(artistsData?.items);
            
            // Cargar Top 5 Canciones en los últimos 6 meses
            const tracksData = await getTopItems(token, 'tracks', 'medium_term', 5);
            setTopTracks(tracksData?.items);

            setIsLoading(false);
        };

        // Solo cargamos si el token está presente (usuario autenticado)
        if (accessToken) {
            loadWrappedData();
        } else {
            setIsLoading(false);
        }
    }, [accessToken]); // Se re-ejecuta cuando cambia el accessToken

    /**
     * Añade todas las canciones top a la playlist actual
     * Muestra una alerta confirmando cuántas canciones se añadieron
     */
    const handleAddAllTracksToPlaylist = () => {
        if (topTracks && topTracks.length > 0) {
            onAddToPlaylist(topTracks);
            alert(`${topTracks.length} canciones añadidas a la playlist!`);
        }
    };


    // Mostrar spinner de carga mientras se obtienen los datos de Spotify
    if (isLoading) {
        return (
             <div className="bg-[#181818] rounded-xl shadow-2xl p-4 h-full min-h-[300px] flex justify-center items-center">
                 <Loader size={32} className="animate-spin text-green-500" />
                 <span className="ml-3 text-gray-400">Cargando tu resumen...</span>
             </div>
        );
    }
    
    // Verificar si hay al menos algunos datos para mostrar
    const hasArtists = topArtists && topArtists.length > 0;
    const hasTracks = topTracks && topTracks.length > 0;
    
    // Si no hay artistas ni canciones, mostrar mensaje informativo
    if (!hasArtists && !hasTracks) {
        return (
             <div className="bg-[#181818] rounded-xl shadow-2xl p-4 h-full min-h-[300px] text-center flex flex-col justify-center items-center space-y-3 border border-gray-800">
                 <Music size={40} className="text-gray-600"/>
                 <p className="text-gray-400 font-semibold">
                    No hay suficientes datos de Top Items disponibles en este rango de tiempo.
                 </p>
             </div>
        );
    }

    return (
        // Contenedor principal del widget Wrapped
        <div className="bg-[#181818] rounded-xl shadow-2xl p-4 space-y-4 border border-gray-800 min-h-[300px]">
            {/* Encabezado con título y botón para añadir todas las canciones */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                    Spotify Wrapped: Tu Resumen ✨
                </h3>
                {/* Botón solo visible si hay canciones y la función onAddToPlaylist está disponible */}
                {hasTracks && onAddToPlaylist && (
                    <button
                        onClick={handleAddAllTracksToPlaylist}
                        className="py-2 px-4 flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-semibold transition-colors"
                        title="Añadir todas las canciones a la playlist"
                    >
                        <PlusCircle size={16} />
                        <span>Añadir a Playlist</span>
                    </button>
                )}
            </div>
            
            {/* Grid de 2 columnas: Artistas a la izquierda, Canciones a la derecha */}
            <div className="grid grid-cols-2 gap-4">
                {/* Columna izquierda: Top Artistas */}
                <div>
                    <h4 className="text-lg font-semibold text-gray-400 flex items-center mb-3 border-b border-gray-700 pb-1">
                        <User size={18} className="mr-2 text-green-500" /> Top Artistas
                    </h4>
                    
                    {hasArtists ? (
                        // Lista ordenada de artistas con numeración
                        <ol className="space-y-2">
                            {topArtists.map((artist, index) => (
                                <li key={artist.id} className="flex items-center text-sm p-2 bg-[#282828] hover:bg-[#383838] rounded-lg transition-colors">
                                    {/* Número de ranking (1, 2, 3...) */}
                                    <span className="font-bold w-6 text-green-400">{index + 1}.</span>
                                    {/* Imagen del artista (usa imagen más pequeña disponible o placeholder) */}
                                    <img 
                                        src={artist.images[2]?.url || artist.images[1]?.url || '/placeholder_artist.jpg'} 
                                        alt={artist.name} 
                                        className="w-8 h-8 rounded-full mr-2 object-cover flex-shrink-0"
                                    />
                                    {/* Nombre del artista (truncado si es muy largo) */}
                                    <span className="truncate text-white" title={artist.name}>{artist.name}</span>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        // Mensaje cuando no hay datos de artistas
                        <p className="text-gray-500 text-sm text-center py-4">No hay datos disponibles</p>
                    )}
                </div>

                {/* Columna derecha: Top Canciones */}
                <div>
                    <h4 className="text-lg font-semibold text-gray-400 flex items-center mb-3 border-b border-gray-700 pb-1">
                        <Music size={18} className="mr-2 text-green-500" /> Top Canciones
                    </h4>
                    
                    {hasTracks ? (
                        // Lista ordenada de canciones con numeración
                        <ol className="space-y-2">
                            {topTracks.map((track, index) => (
                                <li key={track.id} className="flex items-center text-sm p-2 bg-[#282828] hover:bg-[#383838] rounded-lg transition-colors">
                                    {/* Número de ranking (1, 2, 3...) */}
                                    <span className="font-bold w-6 text-green-400">{index + 1}.</span>
                                    {/* Nombre de la canción (truncado si es muy largo) */}
                                    <span className="truncate text-white" title={track.name}>{track.name}</span>
                                    {/* Nombre del artista entre paréntesis (oculto en móviles) */}
                                    <span className="text-xs text-gray-500 ml-1 truncate hidden sm:block"> 
                                        ({track.artists[0]?.name})
                                    </span>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        // Mensaje cuando no hay datos de canciones
                        <p className="text-gray-500 text-sm text-center py-4">No hay datos disponibles</p>
                    )}
                </div>
            </div>
            
        </div>
    );
}