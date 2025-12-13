// src/components/widgets/ArtistWidget.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { searchSpotify } from '@/lib/spotify'; 
import { Search, Loader, X } from 'lucide-react'; 

// Límite máximo de artistas que se pueden seleccionar como "seeds" (restricción de Spotify API)
const MAX_ARTISTS = 5;

/**
 * Hook personalizado para aplicar debouncing a un valor
 * Evita hacer peticiones a la API en cada tecla presionada
 * 
 * @param {string} value - Valor a debounce (query de búsqueda)
 * @param {number} delay - Tiempo de espera en milisegundos antes de actualizar el valor
 * @returns {string} Valor debounced
 */
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    // Crear un timeout que actualiza el valor después del delay
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    // Limpiar el timeout si el valor cambia antes del delay (cleanup)
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

/**
 * Componente ArtistWidget
 * Permite buscar y seleccionar artistas para usar como "seeds" en la generación de playlists
 * Limita la selección a un máximo de 5 artistas según las restricciones de Spotify
 * 
 * @param {Array} selectedItems - Array de artistas ya seleccionados
 * @param {Function} onSelect - Callback para actualizar los artistas seleccionados
 */
export default function ArtistWidget({ selectedItems, onSelect }) {
  // Estado para el texto de búsqueda del usuario
  const [query, setQuery] = useState('');
  // Estado para los resultados de búsqueda de la API de Spotify
  const [searchResults, setSearchResults] = useState([]);
  // Estado para controlar el spinner de carga
  const [isLoading, setIsLoading] = useState(false);
  // Aplicar debounce al query para evitar demasiadas peticiones a la API (espera 500ms)
  const debouncedQuery = useDebounce(query, 500);

  /**
   * Effect que se ejecuta cuando cambia el query debounced
   * Realiza la búsqueda de artistas en la API de Spotify
   */
  useEffect(() => {
    // Si el query está vacío, limpiar los resultados y salir
    if (debouncedQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    /**
     * Función asíncrona que busca artistas en Spotify
     * Usa el tipo 'artist' para buscar solo artistas
     */
    const fetchArtists = async () => {
      setIsLoading(true);
      // Llamar a la API de Spotify para buscar artistas
      const data = await searchSpotify(debouncedQuery, 'artist');
      // Validar y extraer los resultados de la respuesta
      if (data && data.artists && data.artists.items) {
        setSearchResults(data.artists.items);
      } else {
        setSearchResults([]);
      }
      setIsLoading(false);
    };
    fetchArtists();
  }, [debouncedQuery]); // Se re-ejecuta cuando cambia el query debounced

  /**
   * Maneja la selección/deselección de un artista
   * - Si ya está seleccionado, lo elimina
   * - Si no está seleccionado y no se ha alcanzado el límite, lo añade
   * - Si se alcanzó el límite, muestra una alerta
   * 
   * @param {Object} artist - Objeto de artista de Spotify con toda la información
   */
  const handleToggleArtist = (artist) => {
    // Verificar si el artista ya está seleccionado
    const isSelected = selectedItems.some(item => item.id === artist.id);
    let newSelection;

    if (isSelected) {
      // Deseleccionar: filtrar el artista del array
      newSelection = selectedItems.filter(item => item.id !== artist.id);
    } else {
      // Seleccionar: verificar que no se supere el límite
      if (selectedItems.length < MAX_ARTISTS) {
        // Guardar solo la información esencial del artista (optimización)
        newSelection = [...selectedItems, { 
            id: artist.id, 
            name: artist.name,
            image: artist.images[0]?.url 
        }];
      } else {
        // Mostrar alerta si se intenta seleccionar más del límite permitido
        alert(`Solo puedes seleccionar un máximo de ${MAX_ARTISTS} artistas.`);
        return;
      }
    }
    // Notificar al componente padre sobre la nueva selección
    onSelect(newSelection);
  };

  return (
    // Contenedor principal del widget
    <div className="bg-[#181818] rounded-xl shadow-2xl p-4 space-y-4 border border-gray-800">
      {/* Encabezado con título y contador de artistas seleccionados */}
      <h3 className="text-xl font-bold text-white flex justify-between items-center">
          Artistas Favoritos 🎤
          {/* Indicador de cantidad seleccionada vs límite máximo */}
          <span className="text-sm text-gray-400 font-normal">
              {selectedItems.length}/{MAX_ARTISTS}
          </span>
      </h3>
      
      {/* Campo de búsqueda con icono de lupa */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar artista..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 pl-10 bg-[#282828] text-white border border-gray-600 rounded-full focus:ring-green-500 focus:border-green-500 transition-colors placeholder:text-gray-500"
        />
        {/* Icono de búsqueda posicionado dentro del input */}
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Sección de artistas seleccionados mostrados como chips (solo si hay selección) */}
      {selectedItems.length > 0 && (
          <div className="pt-2 border-t border-gray-700">
              <p className="text-xs font-semibold text-gray-400 mb-2">Elegidos:</p>
              {/* Contenedor flexible de chips con wrap */}
              <div className="flex flex-wrap gap-2">
                  {selectedItems.map(artist => (
                      // Chip individual de artista seleccionado (clickeable para eliminar)
                      <span 
                          key={artist.id}
                          className="flex items-center space-x-1 p-1 pr-2 bg-[#1DB954] text-white rounded-full text-sm cursor-pointer hover:bg-[#1ed760]"
                          onClick={() => handleToggleArtist(artist)}
                      >
                          {/* Imagen circular del artista */}
                          <img 
                              src={artist.image || '/placeholder_artist.jpg'} 
                              alt={artist.name} 
                              className="w-5 h-5 rounded-full object-cover" 
                          />
                          {/* Nombre del artista */}
                          <span>{artist.name}</span>
                          {/* Icono X para indicar que se puede eliminar */}
                          <X size={12} className="ml-1" />
                      </span>
                  ))}
              </div>
          </div>
      )}

      {/* Área de resultados de búsqueda con scroll vertical */}
      <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
        {/* Spinner de carga mientras se buscan artistas */}
        {isLoading && (
            <div className="flex justify-center items-center py-8">
                <Loader size={24} className="animate-spin text-green-500" />
                <span className="ml-2 text-gray-400">Buscando...</span>
            </div>
        )}
        
        {/* Mapear y renderizar cada artista de los resultados de búsqueda */}
        {!isLoading && debouncedQuery !== '' && searchResults.map(artist => {
          // Verificar si este artista ya está seleccionado
          const isSelected = selectedItems.some(item => item.id === artist.id);
          // Obtener la imagen más pequeña disponible del artista para optimizar carga
          const artistImage = artist.images[2]?.url || artist.images[1]?.url || artist.images[0]?.url || '/placeholder_artist.jpg';

          return (
            // Tarjeta clickeable de artista con estilos condicionales
            <div
              key={artist.id}
              onClick={() => handleToggleArtist(artist)}
              className={`
                flex items-center p-2 my-1 rounded-lg cursor-pointer transition-colors duration-150
                ${isSelected 
                    ? 'bg-[#1ed760] text-black font-semibold' // Estilo seleccionado (verde claro)
                    : 'hover:bg-[#282828]'} // Estilo hover no seleccionado
                ${!isSelected && selectedItems.length >= MAX_ARTISTS && 'opacity-50 cursor-not-allowed'} // Estilo deshabilitado
              `}
            >
              {/* Imagen circular del artista */}
              <img 
                src={artistImage} 
                alt={artist.name} 
                className="w-10 h-10 rounded-full mr-3 object-cover" 
              />
              {/* Información del artista */}
              <div className="min-w-0 flex-grow">
                {/* Nombre del artista (truncado si es muy largo) */}
                <p className="font-semibold truncate">{artist.name}</p>
                {/* Número de seguidores formateado con separadores de miles */}
                <p className="text-xs text-gray-400 truncate">{artist.followers.total.toLocaleString()} seguidores</p>
              </div>
            </div>
          );
        })}
        
        {/* Mensaje cuando no hay resultados para la búsqueda */}
        {!isLoading && debouncedQuery !== '' && searchResults.length === 0 && (
            <p className="text-gray-500 text-center mt-8">No se encontraron artistas con "{debouncedQuery}".</p>
        )}
      </div>
    </div>
  );
}