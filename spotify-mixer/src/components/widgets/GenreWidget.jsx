// src/components/widgets/GenreWidget.jsx
'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

const AVAILABLE_GENRES = [
  // ... (tu lista completa de géneros) ...
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

const MAX_GENRES = 5; 

export default function GenreWidget({ selectedItems, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggleGenre = (genre) => {
    const isSelected = selectedItems.includes(genre);
    let newSelection;

    if (isSelected) {
      newSelection = selectedItems.filter(item => item !== genre);
    } else {
      if (selectedItems.length < MAX_GENRES) {
        newSelection = [...selectedItems, genre];
      } else {
        alert(`Solo puedes seleccionar un máximo de ${MAX_GENRES} géneros.`);
        return;
      }
    }
    onSelect(newSelection);
  };

  const filteredGenres = AVAILABLE_GENRES.filter(genre => 
    genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#181818] rounded-xl shadow-2xl p-4 space-y-4 border border-gray-800">
      <h3 className="text-xl font-bold text-white flex justify-between items-center">
        Géneros Musicales 🎸
        <span className="text-sm text-gray-400 font-normal">
            {selectedItems.length}/{MAX_GENRES}
        </span>
      </h3>
      
      {/* Campo de Búsqueda/Filtro */}
      <div className="relative">
          <input
              type="text"
              placeholder="Filtrar géneros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 bg-[#282828] text-white border border-gray-600 rounded-full focus:ring-green-500 focus:border-green-500 transition-colors placeholder:text-gray-500"
          />
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Lista de Géneros */}
      <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
        {filteredGenres.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2"> {/* Responsive grid */}
            {filteredGenres.map(genre => {
              const isSelected = selectedItems.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => handleToggleGenre(genre)}
                  disabled={!isSelected && selectedItems.length >= MAX_GENRES}
                  className={`
                    p-2 text-sm rounded-lg text-center transition-all duration-150 transform hover:scale-[1.02]
                    ${isSelected
                      ? 'bg-[#1DB954] text-black font-semibold shadow-lg' // Estilo seleccionado
                      : 'bg-[#282828] text-gray-300 hover:bg-[#383838] border border-[#383838]'} // Estilo no seleccionado
                    ${!isSelected && selectedItems.length >= MAX_GENRES && 'opacity-50 cursor-not-allowed hover:bg-[#282828]'}
                  `}
                >
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center mt-8">No se encontraron géneros.</p>
        )}
      </div>
    </div>
  );
}