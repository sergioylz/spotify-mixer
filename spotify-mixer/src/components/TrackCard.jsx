// src/components/TrackCard.jsx
'use client';

import { Star, Trash2 } from 'lucide-react'; 

/**
 * Componente TrackCard
 * Muestra una tarjeta con la información de una canción y controles de interacción
 * 
 * @param {Object} track - Objeto con los datos de la canción (nombre, artistas, álbum, duración, etc.)
 * @param {Function} onRemove - Callback para eliminar la canción de la playlist
 * @param {Function} onToggleFavorite - Callback para marcar/desmarcar la canción como favorita
 * @param {boolean} isFavorite - Indica si la canción está marcada como favorita
 */
export default function TrackCard({ track, onRemove, onToggleFavorite, isFavorite }) {

  /**
   * Convierte milisegundos a formato MM:SS
   * @param {number} ms - Duración en milisegundos
   * @returns {string} Duración formateada (ej: "3:45")
   */
  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    // Añadir cero delante si los segundos son menores a 10
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  };

  // Obtener nombres de todos los artistas separados por comas
  const artistNames = track.artists?.map(artist => artist.name).join(', ') || 'Artista Desconocido';
  
  // Obtener la imagen de mayor resolución del álbum o usar placeholder
  const albumImage = track.album?.images[0]?.url || '/placeholder_album.jpg';

  return (
    // Contenedor principal de la tarjeta con hover y estilos responsivos
    <div className="flex items-center p-3 bg-[#282828] hover:bg-[#383838] rounded-lg transition-colors shadow-md border border-transparent hover:border-gray-700">     
      {/* Portada del álbum */}
      <img 
        src={albumImage} 
        alt={`Portada de ${track.name}`} 
        className="w-14 h-14 rounded mr-4 flex-shrink-0 object-cover"
      />

      {/* Sección con información de la canción */}
      <div className="flex-grow min-w-0">
        {/* Nombre de la canción (truncado si es muy largo) */}
        <p className="text-base text-white font-bold truncate" title={track.name}>
          {track.name}
        </p>
        {/* Nombre(s) de los artistas (truncado si es muy largo) */}
        <p className="text-sm text-gray-400 truncate" title={artistNames}>
          {artistNames}
        </p>
      </div>
      
      {/* Duración de la canción (oculta en móviles) */}
      <span className="text-sm text-gray-400 ml-4 hidden md:block">
        {formatDuration(track.duration_ms || 200000)} {/* Usar 200s como fallback si falta */}
      </span>

      {/* Botones de acción (favorito y eliminar) */}
      <div className="flex items-center space-x-3 ml-4">
        
        {/* Botón para marcar/desmarcar como favorito */}
        <button
          onClick={() => onToggleFavorite(track)}
          className={`
            p-1 rounded-full transition-colors duration-150
            ${isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-500 hover:text-white'}
          `}
          title={isFavorite ? 'Eliminar de favoritos' : 'Añadir a favoritos'}
        >
          {/* Icono de estrella, rellena si es favorito */}
          <Star size={20} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        {/* Botón para eliminar la canción de la playlist */}
        <button
          onClick={() => onRemove(track.id)}
          className="text-gray-500 hover:text-red-500 transition-colors duration-150 p-1 rounded-full"
          title="Eliminar de la playlist"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}