// src/components/TrackCard.jsx
'use client';

import { Star, Trash2 } from 'lucide-react'; 

export default function TrackCard({ track, onRemove, onToggleFavorite, isFavorite }) {

  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  };

  const artistNames = track.artists?.map(artist => artist.name).join(', ') || 'Artista Desconocido';
  const albumImage = track.album?.images[0]?.url || '/placeholder_album.jpg';

  return (
    <div className="flex items-center p-3 
                    bg-[#282828] hover:bg-[#383838] rounded-lg 
                    transition-colors shadow-md border border-transparent hover:border-gray-700">
      
      {/* Portada */}
      <img 
        src={albumImage} 
        alt={`Portada de ${track.name}`} 
        className="w-14 h-14 rounded mr-4 flex-shrink-0 object-cover"
      />

      {/* Detalles del Track */}
      <div className="flex-grow min-w-0">
        <p className="text-base text-white font-bold truncate" title={track.name}>
          {track.name}
        </p>
        <p className="text-sm text-gray-400 truncate" title={artistNames}>
          {artistNames}
        </p>
      </div>
      
      {/* Duración */}
      <span className="text-sm text-gray-400 ml-4 hidden md:block">
        {formatDuration(track.duration_ms || 200000)} {/* Usar 200s como fallback si falta */}
      </span>

      {/* Acciones */}
      <div className="flex items-center space-x-3 ml-4">
        
        {/* Favorito */}
        <button
          onClick={() => onToggleFavorite(track)}
          className={`
            p-1 rounded-full transition-colors duration-150
            ${isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-500 hover:text-white'}
          `}
          title={isFavorite ? 'Eliminar de favoritos' : 'Añadir a favoritos'}
        >
          <Star size={20} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        {/* Eliminar */}
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