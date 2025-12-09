// src/components/widgets/MoodWidget.jsx
'use client';

// Definición de los parámetros de audio de Spotify que queremos controlar
const MOOD_PARAMETERS = [
 { 
  key: 'energy', 
  label: 'Energía (Tempo/Intensidad)', 
  description: 'De relajado (0.0) a rápido/activo (1.0).',
  color: 'bg-red-500' 
 },
 { 
  key: 'valence', 
  label: 'Valencia (Felicidad/Positividad)', 
  description: 'De triste/negativo (0.0) a feliz/positivo (1.0).',
  color: 'bg-yellow-500' 
 },
 { 
  key: 'danceability', 
  label: 'Bailabilidad', 
  description: 'Qué tan adecuada es una pista para bailar. De 0.0 a 1.0.',
  color: 'bg-blue-500' 
 },
 { 
  key: 'acousticness', 
  label: 'Acústica', 
  description: 'Probabilidad de ser acústica pura. De 0.0 a 1.0.',
  color: 'bg-green-500' 
 },
];

// Componente individual del Slider
function MoodSlider({ param, value, onUpdate }) {
 
 const handleChange = (e) => {
  const newValue = parseFloat(e.target.value);
  // Envía la clave y el valor (actualización simple)
  onUpdate(param.key, newValue);
 };

 return (
  <div className="space-y-2 p-3 bg-[#282828] rounded-lg border border-gray-700 transition-shadow hover:shadow-lg">
   <div className="flex justify-between items-center">
    <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
     <span className={`w-3 h-3 rounded-full ${param.color}`}></span>
     <span>{param.label}</span>
    </h4>
    <span className="text-xl font-bold text-green-400">{value.toFixed(2)}</span>
   </div>
   
   <p className="text-xs text-gray-400 mb-3">{param.description}</p>

   {/* Input de rango (Slider) */}
   <input
    type="range"
    min="0"
    max="1"
    step="0.01" 
    value={value}
    onChange={handleChange}
    className={`w-full h-2 rounded-full appearance-none cursor-pointer range-lg transition-colors duration-150 slider-thumb-green`}
    style={{
      WebkitAppearance: 'none',
      background: `linear-gradient(to right, #1DB954 0%, #1DB954 ${value * 100}%, #4b5563 ${value * 100}%, #4b5563 100%)`,
      borderRadius: '5px'
    }}
   />
   
   {/* Etiqueta para el mínimo y máximo */}
   <div className="flex justify-between text-xs text-gray-500 pt-1">
    <span>0.0 (Bajo)</span>
    <span>1.0 (Alto)</span>
   </div>
  </div>
 );
}

// Componente principal
export default function MoodWidget({ preferences, onUpdate }) {
 
 // FUNCIÓN DE RESET CORREGIDA
 const handleReset = () => {
    const resetMood = {};
    MOOD_PARAMETERS.forEach(param => {
        // 1. Construye el objeto completo: { energy: 0.5, valence: 0.5, ... }
        resetMood[param.key] = 0.5;
    });

    // 2. Envía un indicador especial ('reset') y el objeto completo.
    // Esto fuerza al Dashboard a aplicar todos los cambios a la vez.
    onUpdate('reset', resetMood); 
 };

 return (
  <div className="bg-[#181818] rounded-xl shadow-2xl p-4 space-y-4 border border-gray-800">
   <div className="flex justify-between items-center">
    <h3 className="text-xl font-bold text-white">😊 Mood & Vibe</h3> 
    <button
     onClick={handleReset}
     className="text-sm py-1 px-3 bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 transition-colors" 
    >
     Restablecer
    </button>
   </div>
   
   <p className="text-sm text-gray-400 border-b border-gray-700 pb-3">
    Define las características de audio de tu playlist.
   </p>

   {/* Contenedor de Sliders */}
   <div className="space-y-4">
    {MOOD_PARAMETERS.map(param => (
     <MoodSlider
      key={param.key}
      param={param}
      value={preferences[param.key] ?? 0.5} 
      onUpdate={onUpdate}
     />
    ))}
   </div>
  </div>
 );
}