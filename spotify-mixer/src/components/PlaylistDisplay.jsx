// src/components/PlaylistDisplay.jsx
'use client';

import TrackCard from './TrackCard';
import { RefreshCw, PlusCircle, Trash2 } from 'lucide-react';

/**
 * Componente PlaylistDisplay
 * Muestra la lista de canciones generadas y controles para gestionar la playlist
 * 
 * @param {Array} playlist - Array de canciones en la playlist actual
 * @param {Function} setPlaylist - Función para actualizar el estado de la playlist
 * @param {Function} onRefreshPlaylist - Callback para regenerar la playlist con las mismas preferencias
 * @param {Function} onAddMoreTracks - Callback para añadir más canciones a la playlist existente
 * @param {Function} onClearPlaylist - Callback para limpiar todas las canciones
 * @param {Array} favoriteTracks - Array de canciones marcadas como favoritas (por defecto vacío)
 * @param {Function} onToggleFavorite - Callback para marcar/desmarcar una canción como favorita
 */
export default function PlaylistDisplay({ playlist, setPlaylist, onRefreshPlaylist, onAddMoreTracks, onClearPlaylist, favoriteTracks = [], onToggleFavorite }) {

  /**
   * Elimina una canción específica de la playlist
   * Filtra el array quitando la canción con el ID especificado
   * 
   * @param {string} trackId - ID de la canción a eliminar
   */
  const handleRemoveTrack = (trackId) => {
    const newPlaylist = playlist.filter(track => track.id !== trackId);
    setPlaylist(newPlaylist);
  };

  /**
   * Limpia todas las canciones de la playlist después de confirmar
   * Muestra un diálogo de confirmación antes de ejecutar la acción
   */
  const handleClearAll = () => {
    if (confirm('¿Estás seguro de que quieres eliminar todas las canciones?')) {
      onClearPlaylist();
    }
  };

  return (
    // Contenedor principal de la playlist con fondo oscuro y bordes redondeados
    <div className="bg-[#181818] rounded-xl shadow-2xl p-6 min-h-[500px] space-y-4 border border-gray-800">
      
      {/* Barra de botones para gestionar la playlist (Refrescar, Añadir, Limpiar) */}
      <div className="flex justify-start space-x-3 border-b border-gray-700 pb-4 flex-wrap gap-2">
        
        {/* Botón para regenerar la playlist completa con las mismas preferencias */}
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
        
        {/* Botón para añadir más canciones sin reemplazar las existentes */}
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

        {/* Botón para eliminar todas las canciones (con confirmación) */}
        <button
          onClick={handleClearAll} 
          className="py-2 px-4 flex items-center space-x-2 
                    bg-red-600 hover:bg-red-700 text-white rounded-full 
                    text-sm font-semibold transition-colors disabled:opacity-50"
          title="Eliminar todas las canciones de la playlist"
          disabled={playlist.length === 0}
        >
          <Trash2 size={16} />
          <span>Limpiar Todo</span>
        </button>

      </div>

      {/* Área principal que muestra la lista de canciones con scroll */}
      <div className="space-y-3 h-[400px] lg:h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
        {playlist.length === 0 ? (
          // Estado vacío: muestra instrucciones cuando no hay canciones
          <div className="text-center py-20 text-gray-500 bg-[#121212] rounded-lg border border-dashed border-gray-700">
            <p className="text-lg font-semibold">Usa los widgets de la izquierda para generar música.</p>
            <p className="text-sm mt-2">Selecciona artistas, géneros o moods y haz clic en 'Generar Playlist'.</p>
          </div>
        ) : (
          // Renderiza cada canción como una TrackCard
          playlist.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onRemove={handleRemoveTrack}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favoriteTracks.some(f => f.id === track.id)} // Verifica si está en favoritos
            />
          ))
        )}
      </div>
    </div>
  );
}