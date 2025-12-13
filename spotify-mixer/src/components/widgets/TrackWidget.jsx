// src/components/widgets/TrackWidget.jsx
'use client';

import { useState, useEffect } from 'react';
import { searchSpotify } from '@/lib/spotify'; // Reusa la función de búsqueda
import { Search, Loader } from 'lucide-react'; 

// Límite máximo de canciones que se pueden seleccionar como "seeds" para generar playlist
const MAX_TRACKS = 5; // Límite de canciones "seed"

/**
 * Hook personalizado para aplicar debouncing a un valor
 * Útil para evitar hacer peticiones a la API en cada tecla presionada
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
 * Componente TrackWidget
 * Permite buscar y seleccionar canciones para usar como "seeds" en la generación de playlists
 * Limita la selección a un máximo de 5 canciones
 * 
 * @param {Array} selectedItems - Array de canciones ya seleccionadas
 * @param {Function} onSelect - Callback para actualizar las canciones seleccionadas
 */
export default function TrackWidget({ selectedItems, onSelect }) {
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
   * Realiza la búsqueda de canciones en la API de Spotify
   */
  useEffect(() => {
    // Si el query está vacío, limpiar los resultados y salir
    if (debouncedQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    /**
     * Función asíncrona que busca canciones en Spotify
     * Usa el tipo 'track' para buscar solo canciones
     */
    const fetchTracks = async () => {
      setIsLoading(true);
      // Llamar a la API de Spotify para buscar canciones
      const data = await searchSpotify(debouncedQuery, 'track'); 
      
      // Validar y extraer los resultados de la respuesta
      if (data && data.tracks && data.tracks.items) {
        setSearchResults(data.tracks.items);
      } else {
        setSearchResults([]);
      }
      setIsLoading(false);
    };

    fetchTracks();
  }, [debouncedQuery]); // Se re-ejecuta cuando cambia el query debounced

  /**
   * Maneja la selección/deselección de una canción
   * - Si ya está seleccionada, la elimina
   * - Si no está seleccionada y no se ha alcanzado el límite, la añade
   * - Si se alcanzó el límite, muestra una alerta
   * 
   * @param {Object} track - Objeto de canción de Spotify con toda la información
   */
  const handleToggleTrack = (track) => {
    // Verificar si la canción ya está seleccionada
    const isSelected = selectedItems.some(item => item.id === track.id);
    let newSelection;

    if (isSelected) {
      // Deseleccionar: filtrar la canción del array
      newSelection = selectedItems.filter(item => item.id !== track.id);
    } else {
      // Seleccionar: verificar que no se supere el límite
      if (selectedItems.length < MAX_TRACKS) {
        // Guardar solo la información esencial de la canción (optimización)
        newSelection = [...selectedItems, { 
            id: track.id, 
            name: track.name,
            artist: track.artists[0]?.name,
            image: track.album.images[0]?.url
        }];
      } else {
        // Mostrar alerta si se intenta seleccionar más del límite permitido
        alert(`Solo puedes seleccionar un máximo de ${MAX_TRACKS} canciones.`);
        return;
      }
    }
    // Notificar al componente padre sobre la nueva selección
    onSelect(newSelection);
  };

  return (
    // Contenedor principal del widget
    <div className="bg-[#181818] rounded-xl shadow-xl p-4 space-y-4">
      {/* Título del widget */}
      <h3 className="text-lg font-semibold text-white">🎧 Canciones</h3>
      
      {/* Indicador de cantidad seleccionada vs límite máximo */}
      <div className="text-sm text-gray-400">
        Seleccionadas: <span className="font-bold text-green-400">{selectedItems.length}/{MAX_TRACKS}</span>
      </div>

      {/* Campo de búsqueda con icono de lupa */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar canción o track..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 pl-10 bg-[#282828] text-white border border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 transition-colors"
        />
        {/* Icono de búsqueda posicionado dentro del input */}
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Área de resultados con scroll vertical */}
      <div className="space-y-3 h-64 overflow-y-auto pr-2" style={{ maxHeight: '20rem' }}>
        
        {/* Spinner de carga mientras se buscan canciones */}
        {isLoading && (
            <div className="flex justify-center items-center py-4">
                <Loader size={24} className="animate-spin text-green-500" />
            </div>
        )}
        
        {/* Mapear y renderizar cada canción de los resultados de búsqueda */}
        {!isLoading && searchResults.map(track => {
          // Verificar si esta canción ya está seleccionada
          const isSelected = selectedItems.some(item => item.id === track.id);
          // Obtener la imagen más pequeña disponible del álbum para optimizar carga
          const trackImage = track.album.images[2]?.url || track.album.images[1]?.url || track.album.images[0]?.url || '/placeholder_track.jpg';
          // Unir todos los nombres de artistas con comas
          const artistNames = track.artists.map(a => a.name).join(', ');

          return (
            // Tarjeta clickeable de canción con estilos condicionales
            <div
              key={track.id}
              onClick={() => handleToggleTrack(track)}
              className={`
                flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-150
                ${isSelected ? 'bg-[#1ed760] text-white' : 'hover:bg-[#282828]'}
                ${!isSelected && selectedItems.length >= MAX_TRACKS && 'opacity-50 cursor-not-allowed'}
              `}
            >
              {/* Imagen de portada del álbum */}
              <img 
                src={trackImage} 
                alt={track.name} 
                className="w-8 h-8 rounded mr-3" 
              />
              {/* Información de la canción */}
              <div className="min-w-0 grow">
                {/* Nombre de la canción (truncado si es muy largo) */}
                <p className="font-semibold truncate">{track.name}</p>
                {/* Nombres de los artistas (truncado si es muy largo) */}
                <p className="text-xs text-gray-400 truncate">{artistNames}</p>
              </div>
            </div>
          );
        })}
        
        {/* Mensaje cuando no hay resultados para la búsqueda */}
        {!isLoading && debouncedQuery !== '' && searchResults.length === 0 && (
            <p className="text-gray-500 text-center mt-8">No se encontraron canciones con "{debouncedQuery}".</p>
        )}
      </div>
    </div>
  );
}