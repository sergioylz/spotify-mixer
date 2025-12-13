// src/components/widgets/WrappedWidget.jsx
'use client';

import { useState, useEffect } from 'react';
import { getTopItems } from '@/lib/spotify'; 
import { Loader, User, Music, PlusCircle } from 'lucide-react';

export default function WrappedWidget({ accessToken, onAddToPlaylist }) {
    const [topArtists, setTopArtists] = useState(null);
    const [topTracks, setTopTracks] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadWrappedData = async () => {
            setIsLoading(true);

            // Usamos directamente el accessToken que viene del Dashboard
            const token = accessToken; 
            
            // Cargar Artistas (Top 5 en los últimos 6 meses)
            const artistsData = await getTopItems(token, 'artists', 'medium_term', 5);
            setTopArtists(artistsData?.items);
            
            // Cargar Tracks (Top 5 en los últimos 6 meses)
            const tracksData = await getTopItems(token, 'tracks', 'medium_term', 5);
            setTopTracks(tracksData?.items);

            setIsLoading(false);
        };

        // Solo cargamos si el token está presente
        if (accessToken) {
            loadWrappedData();
        } else {
            setIsLoading(false);
        }
    }, [accessToken]);

    const handleAddAllTracksToPlaylist = () => {
        if (topTracks && topTracks.length > 0) {
            onAddToPlaylist(topTracks);
            alert(`${topTracks.length} canciones añadidas a la playlist!`);
        }
    };


    if (isLoading) {
        return (
             <div className="bg-[#181818] rounded-xl shadow-2xl p-4 h-full min-h-[300px] flex justify-center items-center">
                 <Loader size={32} className="animate-spin text-green-500" />
                 <span className="ml-3 text-gray-400">Cargando tu resumen...</span>
             </div>
        );
    }
    
    // Verificar si hay al menos algunos datos
    const hasArtists = topArtists && topArtists.length > 0;
    const hasTracks = topTracks && topTracks.length > 0;
    
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
        <div className="bg-[#181818] rounded-xl shadow-2xl p-4 space-y-4 border border-gray-800 min-h-[300px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                    Spotify Wrapped: Tu Resumen ✨
                </h3>
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
            
            <div className="grid grid-cols-2 gap-4">
                {/* Contenedor de Top Artistas */}
                <div>
                    <h4 className="text-lg font-semibold text-gray-400 flex items-center mb-3 border-b border-gray-700 pb-1">
                        <User size={18} className="mr-2 text-green-500" /> Top Artistas
                    </h4>
                    
                    {hasArtists ? (
                        <ol className="space-y-2">
                            {topArtists.map((artist, index) => (
                                <li key={artist.id} className="flex items-center text-sm p-2 bg-[#282828] hover:bg-[#383838] rounded-lg transition-colors">
                                    <span className="font-bold w-6 text-green-400">{index + 1}.</span>
                                    <img 
                                        src={artist.images[2]?.url || artist.images[1]?.url || '/placeholder_artist.jpg'} 
                                        alt={artist.name} 
                                        className="w-8 h-8 rounded-full mr-2 object-cover flex-shrink-0"
                                    />
                                    <span className="truncate text-white" title={artist.name}>{artist.name}</span>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="text-gray-500 text-sm text-center py-4">No hay datos disponibles</p>
                    )}
                </div>

                {/* Contenedor de Top Canciones */}
                <div>
                    <h4 className="text-lg font-semibold text-gray-400 flex items-center mb-3 border-b border-gray-700 pb-1">
                        <Music size={18} className="mr-2 text-green-500" /> Top Canciones
                    </h4>
                    
                    {hasTracks ? (
                        <ol className="space-y-2">
                            {topTracks.map((track, index) => (
                                <li key={track.id} className="flex items-center text-sm p-2 bg-[#282828] hover:bg-[#383838] rounded-lg transition-colors">
                                    <span className="font-bold w-6 text-green-400">{index + 1}.</span>
                                    <span className="truncate text-white" title={track.name}>{track.name}</span>
                                    {/* Opcional: Mostrar el artista de la canción */}
                                    <span className="text-xs text-gray-500 ml-1 truncate hidden sm:block"> 
                                        ({track.artists[0]?.name})
                                    </span>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="text-gray-500 text-sm text-center py-4">No hay datos disponibles</p>
                    )}
                </div>
            </div>
            
        </div>
    );
}