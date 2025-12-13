// src/components/FavoriteHeader.js (Código CORREGIDO)

import React from 'react';
import { Heart, X } from 'lucide-react';

/**
 * Componente FavoriteHeader
 * Muestra una barra horizontal con las canciones marcadas como favoritas
 * Permite eliminar canciones de favoritos con un botón que aparece al hacer hover
 * 
 * @param {Object} favoriteSeeds - Objeto que contiene los favoritos (tracks, artistas, géneros)
 * @param {Array} favoriteSeeds.favoriteTracks - Array de canciones favoritas
 * @param {Function} onToggleFavorite - Callback para añadir/quitar elementos de favoritos
 */
export default function FavoriteHeader({ favoriteSeeds, onToggleFavorite }) {
    
    // Extraer el array de canciones favoritas del objeto favoriteSeeds
    const favoriteTracks = favoriteSeeds.favoriteTracks || [];
    // Mostrar todas las canciones favoritas (sin límite)
    const displayItems = favoriteTracks; // Mostrar todas

    // Si no hay canciones favoritas, mostrar un mensaje informativo
    if (displayItems.length === 0) {
        return (
            <div className="bg-gray-800 p-4 text-center text-gray-400">
                Añade algunas canciones a favoritos para verlas destacadas aquí.
            </div>
        );
    }

    return (
        // Contenedor principal con gradiente de fondo verde a gris
        <div className="w-full bg-gradient-to-r from-green-900/50 to-gray-900/50 p-6 shadow-2xl">
            {/* Título de la sección con icono de corazón */}
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Heart className="mr-2 text-red-400 fill-red-400" size={24} />
                Tus Canciones Favoritas Destacadas
            </h3>
            
            {/* Contenedor con scroll horizontal para las tarjetas de canciones */}
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {displayItems.map(track => {

                    // Validación: Si el track no tiene ID o nombre, no lo renderizamos
                    if (!track || !track.id || !track.name) {
                        return null; 
                    }
                    
                    // Extraer datos de la canción con valores por defecto
                    // Unir todos los nombres de artistas separados por comas
                    const artistNames = track.artists?.map(artist => artist.name).join(', ') || 'Artista Desconocido';
                    // Obtener la primera imagen del álbum o usar placeholder
                    const albumImage = track.album?.images?.[0]?.url || '/placeholder-music.jpg';

                    return (
                        // Tarjeta individual de canción favorita con hover effect
                        <div 
                            key={track.id} 
                            className="shrink-0 w-40 p-3 bg-gray-900 rounded-lg shadow-md group hover:bg-gray-700 transition-colors relative"
                        >
                            {/* Botón X para eliminar de favoritos (aparece al hacer hover) */}
                            <button
                                onClick={() => onToggleFavorite('track', track)}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                title="Eliminar de favoritos"
                            >
                                <X size={16} className="text-red-400" />
                            </button>
                            
                            {/* Imagen de portada del álbum */}
                            <img 
                                src={albumImage}
                                alt={track.name} 
                                className="w-full h-auto aspect-square rounded mb-2 object-cover"
                            />
                            {/* Nombre de la canción (truncado si es muy largo) */}
                            <p className="text-sm font-semibold text-white truncate" title={track.name}>
                                {track.name}
                            </p>
                            {/* Nombres de los artistas (truncado si es muy largo) */}
                            <p className="text-xs text-gray-400 truncate" title={artistNames}>
                                {artistNames}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}