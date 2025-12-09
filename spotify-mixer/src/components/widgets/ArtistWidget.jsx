// src/components/widgets/ArtistWidget.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { searchSpotify } from '@/lib/spotify'; 
import { Search, Loader, X } from 'lucide-react'; // Añadimos X para cerrar selección

const MAX_ARTISTS = 5;

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};


export default function ArtistWidget({ selectedItems, onSelect }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    // ... (lógica de fetchArtists, sin cambios) ...
    if (debouncedQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const fetchArtists = async () => {
      setIsLoading(true);
      const data = await searchSpotify(debouncedQuery, 'artist');
      if (data && data.artists && data.artists.items) {
        setSearchResults(data.artists.items);
      } else {
        setSearchResults([]);
      }
      setIsLoading(false);
    };
    fetchArtists();
  }, [debouncedQuery]);

  const handleToggleArtist = (artist) => {
    const isSelected = selectedItems.some(item => item.id === artist.id);
    let newSelection;

    if (isSelected) {
      newSelection = selectedItems.filter(item => item.id !== artist.id);
    } else {
      if (selectedItems.length < MAX_ARTISTS) {
        newSelection = [...selectedItems, { 
            id: artist.id, 
            name: artist.name,
            image: artist.images[0]?.url 
        }];
      } else {
        alert(`Solo puedes seleccionar un máximo de ${MAX_ARTISTS} artistas.`);
        return;
      }
    }
    onSelect(newSelection);
  };

  return (
    <div className="bg-[#181818] rounded-xl shadow-2xl p-4 space-y-4 border border-gray-800">
      <h3 className="text-xl font-bold text-white flex justify-between items-center">
          Artistas Favoritos 🎤
          <span className="text-sm text-gray-400 font-normal">
              {selectedItems.length}/{MAX_ARTISTS}
          </span>
      </h3>
      
      {/* Campo de Búsqueda */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar artista..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 pl-10 bg-[#282828] text-white border border-gray-600 rounded-full focus:ring-green-500 focus:border-green-500 transition-colors placeholder:text-gray-500"
        />
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Artistas Seleccionados (Chips) */}
      {selectedItems.length > 0 && (
          <div className="pt-2 border-t border-gray-700">
              <p className="text-xs font-semibold text-gray-400 mb-2">Elegidos:</p>
              <div className="flex flex-wrap gap-2">
                  {selectedItems.map(artist => (
                      <span 
                          key={artist.id}
                          // CLASES MEJORADAS PARA EL CHIP DE SELECCIÓN
                          className="flex items-center space-x-1 p-1 pr-2 bg-[#1DB954] text-white rounded-full text-sm cursor-pointer hover:bg-[#1ed760]"
                          onClick={() => handleToggleArtist(artist)}
                      >
                          <img 
                              src={artist.image || '/placeholder_artist.jpg'} 
                              alt={artist.name} 
                              className="w-5 h-5 rounded-full object-cover" 
                          />
                          <span>{artist.name}</span>
                          <X size={12} className="ml-1" />
                      </span>
                  ))}
              </div>
          </div>
      )}

      {/* Lista de Resultados de Búsqueda */}
      <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
        {isLoading && (
            <div className="flex justify-center items-center py-8">
                <Loader size={24} className="animate-spin text-green-500" />
                <span className="ml-2 text-gray-400">Buscando...</span>
            </div>
        )}
        
        {!isLoading && debouncedQuery !== '' && searchResults.map(artist => {
          const isSelected = selectedItems.some(item => item.id === artist.id);
          const artistImage = artist.images[2]?.url || artist.images[1]?.url || artist.images[0]?.url || '/placeholder_artist.jpg';

          return (
            <div
              key={artist.id}
              onClick={() => handleToggleArtist(artist)}
              // CLASES MEJORADAS PARA EL RESULTADO INDIVIDUAL
              className={`
                flex items-center p-2 my-1 rounded-lg cursor-pointer transition-colors duration-150
                ${isSelected 
                    ? 'bg-[#1ed760] text-black font-semibold' 
                    : 'hover:bg-[#282828]'}
                ${!isSelected && selectedItems.length >= MAX_ARTISTS && 'opacity-50 cursor-not-allowed'}
              `}
            >
              <img 
                src={artistImage} 
                alt={artist.name} 
                className="w-10 h-10 rounded-full mr-3 object-cover" 
              />
              <div className="min-w-0 flex-grow">
                <p className="font-semibold truncate">{artist.name}</p>
                <p className="text-xs text-gray-400 truncate">{artist.followers.total.toLocaleString()} seguidores</p>
              </div>
            </div>
          );
        })}
        
        {!isLoading && debouncedQuery !== '' && searchResults.length === 0 && (
            <p className="text-gray-500 text-center mt-8">No se encontraron artistas con "{debouncedQuery}".</p>
        )}
      </div>
    </div>
  );
}