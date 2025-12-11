// src/components/FavoriteHeader.js (Código CORREGIDO)

import React from 'react';
import { Heart, X } from 'lucide-react';

export default function FavoriteHeader({ favoriteSeeds, onToggleFavorite }) {
    
    // Mostrar todas las canciones favoritas (sin límite)
    const favoriteTracks = favoriteSeeds.favoriteTracks || [];
    const displayItems = favoriteTracks; // Mostrar todas

    console.log("DEBUG: favoriteTracks length:", favoriteTracks.length);
    console.log("DEBUG: displayItems length:", displayItems.length);

    if (displayItems.length === 0) {
        return (
            <div className="bg-gray-800 p-4 text-center text-gray-400">
                Añade algunas canciones a favoritos para verlas destacadas aquí.
            </div>
        );
    }

    return (
        <div className="w-full bg-gradient-to-r from-green-900/50 to-gray-900/50 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Heart className="mr-2 text-red-400 fill-red-400" size={24} />
                Tus Canciones Favoritas Destacadas
            </h3>
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {displayItems.map(track => {

                    // 🚩 VALIDACIÓN: Si el track no tiene ID o nombre, no lo renderizamos.
                    if (!track || !track.id || !track.name) {
                        return null; 
                    }
                    
                    // --- CORRECCIÓN DE EXTRACCIÓN DE DATOS ---
                    const artistNames = track.artists?.map(artist => artist.name).join(', ') || 'Artista Desconocido';
                    const albumImage = track.album?.images?.[0]?.url || '/placeholder-music.jpg';
                    // ----------------------------------------

                    return (
                        <div 
                            key={track.id} 
                            className="shrink-0 w-40 p-3 bg-gray-900 rounded-lg shadow-md group hover:bg-gray-700 transition-colors relative"
                        >
                            {/* Botón para eliminar de favoritos */}
                            <button
                                onClick={() => onToggleFavorite('track', track)}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                title="Eliminar de favoritos"
                            >
                                <X size={16} className="text-red-400" />
                            </button>
                            
                            <img 
                                src={albumImage}
                                alt={track.name} 
                                className="w-full h-auto aspect-square rounded mb-2 object-cover"
                            />
                            <p className="text-sm font-semibold text-white truncate" title={track.name}>
                                {track.name}
                            </p>
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