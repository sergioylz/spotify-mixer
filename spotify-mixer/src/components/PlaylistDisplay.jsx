// src/components/PlaylistDisplay.jsx
'use client';

import TrackCard from './TrackCard';
import { RefreshCw, PlusCircle } from 'lucide-react';

export default function PlaylistDisplay({ playlist, setPlaylist, onRefreshPlaylist, onAddMoreTracks, favoriteTracks = [], onToggleFavorite }) {

  const handleRemoveTrack = (trackId) => {
    const newPlaylist = playlist.filter(track => track.id !== trackId);
    setPlaylist(newPlaylist);
  };

  return (
    <div className="bg-[#181818] rounded-xl shadow-2xl p-6 min-h-[500px] space-y-4 border border-gray-800">
      
      {/* Botones de Gestión (Guardar / Refrescar / Añadir) */}
      <div className="flex justify-start space-x-3 border-b border-gray-700 pb-4">
        
        {/* Botón Refrescar Playlist */}
        <button
          onClick={onRefreshPlaylist} 
          className="py-2 px-4 flex items-center space-x-2 
                    bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-full 
                    text-sm font-bold transition-colors disabled:opacity-50 shadow-md"
          title="Regenerar playlist con las mismas preferencias"
          disabled={playlist.length === 0}
        >
          <RefreshCw size={16} />
          <span>Refrescar</span>
        </button>
        
        {/* Botón Añadir Más Canciones */}
        <button
          onClick={onAddMoreTracks} 
          className="py-2 px-4 flex items-center space-x-2 
                    bg-gray-700 hover:bg-gray-600 text-white rounded-full 
                    text-sm font-semibold transition-colors disabled:opacity-50"
          title="Añadir más canciones a la lista actual"
          disabled={playlist.length === 0}
        >
          <PlusCircle size={16} />
          <span>Añadir Más</span>
        </button>

      </div>

      {/* Lista de Canciones */}
      <div className="space-y-3 h-[400px] lg:h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
        {playlist.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-[#121212] rounded-lg border border-dashed border-gray-700">
            <p className="text-lg font-semibold">Usa los widgets de la izquierda para generar música.</p>
            <p className="text-sm mt-2">Selecciona artistas, géneros o moods y haz clic en 'Generar Playlist'.</p>
          </div>
        ) : (
          playlist.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onRemove={handleRemoveTrack}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favoriteTracks.some(f => f.id === track.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}