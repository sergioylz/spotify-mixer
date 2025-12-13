// src/components/widgets/GenreWidget.jsx
'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

/**
 * Lista completa de géneros musicales soportados por la API de Spotify
 * Estos IDs son específicos de Spotify y se usan para generar recomendaciones
 * Fuente: https://developer.spotify.com/documentation/web-api/reference/get-recommendation-genres
 */
const AVAILABLE_GENRES = [
  // Lista completa de géneros disponibles en Spotify
  'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'anime', 'black-metal', 'bluegrass',
  'blues', 'bossanova', 'brazil', 'breakbeat', 'british', 'cantopop', 'chicago-house', 'children', 
  'chill', 'classical', 'club', 'comedy', 'country', 'dance', 'dancehall', 'death-metal', 
  'deep-house', 'detroit-techno', 'disco', 'disney', 'drum-and-bass', 'dub', 'dubstep', 'edm', 
  'electro', 'electronic', 'emo', 'folk', 'forro', 'french', 'funk', 'garage', 'german', 'gospel', 
  'goth', 'grindcore', 'groove', 'grunge', 'guitar', 'happy', 'hard-rock', 'hardcore', 'hardstyle', 
  'heavy-metal', 'hip-hop', 'house', 'idm', 'indian', 'indie', 'indie-pop', 'industrial', 'iranian', 
  'j-dance', 'j-idol', 'j-pop', 'j-rock', 'jazz', 'k-pop', 'kids', 'latin', 'latino', 'malay', 
  'mandopop', 'metal', 'metal-misc', 'metalcore', 'minimal-techno', 'movies', 'mpb', 'new-age', 
  'new-release', 'opera', 'pagode', 'party', 'philippines-opm', 'piano', 'pop', 'pop-film', 
  'post-dubstep', 'power-pop', 'progressive-house', 'psych-rock', 'punk', 'punk-rock', 'r-n-b', 
  'rainy-day', 'reggae', 'reggaeton', 'road-trip', 'rock', 'rock-n-roll', 'rockabilly', 'romance', 
  'sad', 'salsa', 'samba', 'sertanejo', 'show-tunes', 'singer-songwriter', 'ska', 'sleep', 
  'songwriter', 'soul', 'soundtracks', 'spanish', 'study', 'summer', 'swedish', 'synth-pop', 
  'tango', 'techno', 'trance', 'trip-hop', 'turkish', 'work-out', 'world-music'
];

// Límite máximo de géneros que se pueden seleccionar (restricción de Spotify API)
const MAX_GENRES = 5; 

/**
 * Componente GenreWidget
 * Permite al usuario buscar y seleccionar géneros musicales para generar playlists
 * Limita la selección a un máximo de 5 géneros según las restricciones de Spotify
 * 
 * @param {Array} selectedItems - Array de géneros ya seleccionados
 * @param {Function} onSelect - Callback para actualizar los géneros seleccionados
 */
export default function GenreWidget({ selectedItems, onSelect }) {
  // Estado para el término de búsqueda/filtro
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Maneja la selección/deselección de un género
   * - Si ya está seleccionado, lo elimina
   * - Si no está seleccionado y no se ha alcanzado el límite, lo añade
   * - Si se alcanzó el límite, muestra una alerta
   * 
   * @param {string} genre - ID del género a seleccionar/deseleccionar
   */
  const handleToggleGenre = (genre) => {
    // Verificar si el género ya está en la selección
    const isSelected = selectedItems.includes(genre);
    let newSelection;

    if (isSelected) {
      // Deseleccionar: eliminar del array
      newSelection = selectedItems.filter(item => item !== genre);
    } else {
      // Seleccionar: verificar límite antes de añadir
      if (selectedItems.length < MAX_GENRES) {
        newSelection = [...selectedItems, genre];
      } else {
        // Mostrar alerta si se intenta superar el límite
        alert(`Solo puedes seleccionar un máximo de ${MAX_GENRES} géneros.`);
        return;
      }
    }
    // Notificar al componente padre sobre la nueva selección
    onSelect(newSelection);
  };

  // Filtrar géneros según el término de búsqueda (case-insensitive)
  const filteredGenres = AVAILABLE_GENRES.filter(genre => 
    genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // Contenedor principal del widget
    <div className="bg-[#181818] rounded-xl shadow-2xl p-4 space-y-4 border border-gray-800">
      {/* Encabezado con título y contador de géneros seleccionados */}
      <h3 className="text-xl font-bold text-white flex justify-between items-center">
        Géneros Musicales 🎸
        {/* Indicador de cantidad seleccionada vs límite máximo */}
        <span className="text-sm text-gray-400 font-normal">
            {selectedItems.length}/{MAX_GENRES}
        </span>
      </h3>
      
      {/* Campo de búsqueda para filtrar géneros */}
      <div className="relative">
          <input
              type="text"
              placeholder="Filtrar géneros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 bg-[#282828] text-white border border-gray-600 rounded-full focus:ring-green-500 focus:border-green-500 transition-colors placeholder:text-gray-500"
          />
          {/* Icono de búsqueda posicionado dentro del input */}
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Área de géneros con scroll vertical */}
      <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
        {filteredGenres.length > 0 ? (
          // Grid responsive de géneros (2 columnas en móvil, 3 en escritorio)
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {filteredGenres.map(genre => {
              // Verificar si este género está seleccionado
              const isSelected = selectedItems.includes(genre);
              return (
                // Botón individual de género con estilos condicionales
                <button
                  key={genre}
                  onClick={() => handleToggleGenre(genre)}
                  disabled={!isSelected && selectedItems.length >= MAX_GENRES} // Deshabilitar si se alcanzó el límite
                  className={`
                    p-2 text-sm rounded-lg text-center transition-all duration-150 transform hover:scale-[1.02]
                    ${isSelected
                      ? 'bg-[#1DB954] text-black font-semibold shadow-lg' // Estilo seleccionado (verde Spotify)
                      : 'bg-[#282828] text-gray-300 hover:bg-[#383838] border border-[#383838]'} // Estilo no seleccionado
                    ${!isSelected && selectedItems.length >= MAX_GENRES && 'opacity-50 cursor-not-allowed hover:bg-[#282828]'} // Estilo deshabilitado
                  `}
                >
                  {/* Capitalizar primera letra del género para mejor presentación */}
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </button>
              );
            })}
          </div>
        ) : (
          // Mensaje cuando no hay resultados en la búsqueda
          <p className="text-gray-500 text-center mt-8">No se encontraron géneros.</p>
        )}
      </div>
    </div>
  );
}