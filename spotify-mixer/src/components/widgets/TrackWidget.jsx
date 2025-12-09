// src/components/widgets/TrackWidget.jsx
'use client';

import { useState, useEffect } from 'react';
import { searchSpotify } from '@/lib/spotify'; // Reusa la función de búsqueda
import { Search, Loader } from 'lucide-react'; 

const MAX_TRACKS = 5; // Límite de canciones "seed"

// Hook de Debouncing (reutilizado del Artist Widget)
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};


export default function TrackWidget({ selectedItems, onSelect }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  // 1. Efecto de búsqueda (se dispara cuando el query debounced cambia)
  useEffect(() => {
    if (debouncedQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const fetchTracks = async () => {
      setIsLoading(true);
      // 💥 Llamamos a searchSpotify con el tipo 'track' 💥
      const data = await searchSpotify(debouncedQuery, 'track'); 
      
      if (data && data.tracks && data.tracks.items) {
        setSearchResults(data.tracks.items);
      } else {
        setSearchResults([]);
      }
      setIsLoading(false);
    };

    fetchTracks();
  }, [debouncedQuery]);

  // 2. Función para manejar la selección de canciones
  const handleToggleTrack = (track) => {
    const isSelected = selectedItems.some(item => item.id === track.id);
    let newSelection;

    if (isSelected) {
      newSelection = selectedItems.filter(item => item.id !== track.id);
    } else {
      if (selectedItems.length < MAX_TRACKS) {
        // Guardamos solo la información esencial de la canción
        newSelection = [...selectedItems, { 
            id: track.id, 
            name: track.name,
            artist: track.artists[0]?.name,
            image: track.album.images[0]?.url
        }];
      } else {
        alert(`Solo puedes seleccionar un máximo de ${MAX_TRACKS} canciones.`);
        return;
      }
    }
    onSelect(newSelection);
  };

  return (
    <div className="bg-[#181818] rounded-xl shadow-xl p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white">🎧 Canciones de Semilla (Seed)</h3>
      
      {/* Indicador de límite */}
      <div className="text-sm text-gray-400">
        Seleccionadas: <span className="font-bold text-green-400">{selectedItems.length}/{MAX_TRACKS}</span>
      </div>

      {/* Campo de Búsqueda */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar canción o track..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 pl-10 bg-[#282828] text-white border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-colors"
        />
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Resultados y Seleccionados */}
      <div className="space-y-3 h-64 overflow-y-auto pr-2" style={{ maxHeight: '20rem' }}>
        
        {/* Lista de Resultados de Búsqueda */}
        {isLoading && (
            <div className="flex justify-center items-center py-4">
                <Loader size={24} className="animate-spin text-green-500" />
            </div>
        )}
        
        {!isLoading && searchResults.map(track => {
          const isSelected = selectedItems.some(item => item.id === track.id);
          const trackImage = track.album.images[2]?.url || track.album.images[1]?.url || track.album.images[0]?.url || '/placeholder_track.jpg';
          const artistNames = track.artists.map(a => a.name).join(', ');

          return (
            <div
              key={track.id}
              onClick={() => handleToggleTrack(track)}
              className={`
                flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-150
                ${isSelected ? 'bg-[#1ed760] text-white' : 'hover:bg-[#282828]'}
                ${!isSelected && selectedItems.length >= MAX_TRACKS && 'opacity-50 cursor-not-allowed'}
              `}
            >
              <img 
                src={trackImage} 
                alt={track.name} 
                className="w-8 h-8 rounded mr-3" 
              />
              <div className="min-w-0 flex-grow">
                <p className="font-semibold truncate">{track.name}</p>
                <p className="text-xs text-gray-400 truncate">{artistNames}</p>
              </div>
            </div>
          );
        })}
        
        {!isLoading && debouncedQuery !== '' && searchResults.length === 0 && (
            <p className="text-gray-500 text-center mt-8">No se encontraron canciones con "{debouncedQuery}".</p>
        )}
      </div>
    </div>
  );
}