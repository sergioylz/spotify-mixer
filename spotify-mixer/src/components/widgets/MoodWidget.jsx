// src/components/widgets/MoodWidget.jsx
'use client';

/**
 * Parámetros de audio de Spotify que se pueden ajustar para controlar el mood de la playlist
 * Cada parámetro tiene:
 * - key: identificador usado por la API de Spotify
 * - label: nombre descriptivo mostrado al usuario
 * - description: explicación de qué controla el parámetro
 * - color: clase de Tailwind para el indicador de color
 * 
 * Todos los valores van de 0.0 (mínimo) a 1.0 (máximo)
 */
const MOOD_PARAMETERS = [
  { 
    key: 'energy', 
    label: 'Energía', 
    description: 'De relajado (0.0) a rápido/activo (1.0).',
    color: 'bg-red-500' 
  },
  { 
    key: 'valence', 
    label: 'Alegría', 
    description: 'De triste/negativo (0.0) a feliz/positivo (1.0).',
    color: 'bg-yellow-500' 
  },
  { 
    key: 'danceability', 
    label: 'Perreabilidad', 
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

/**
 * Componente MoodSlider
 * Slider individual que permite ajustar un parámetro de audio específico
 * 
 * @param {Object} param - Objeto con la configuración del parámetro (key, label, description, color)
 * @param {number} value - Valor actual del parámetro (0.0 a 1.0)
 * @param {Function} onUpdate - Callback para actualizar el valor cuando el slider cambia
 */
function MoodSlider({ param, value, onUpdate }) {
  
  /**
    * Maneja el cambio del slider y notifica al componente padre
    * @param {Event} e - Evento del input range
    */
  const handleChange = (e) => {
    // Convertir el valor string del input a número decimal
    const newValue = parseFloat(e.target.value);
    // Enviar la clave del parámetro y el nuevo valor al padre
    onUpdate(param.key, newValue);
  };

  return (
    // Contenedor del slider con fondo oscuro y hover effect
    <div className="space-y-2 p-3 bg-[#282828] rounded-lg border border-gray-700 transition-shadow hover:shadow-lg">
      {/* Fila superior: nombre del parámetro con indicador de color y valor actual */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
        {/* Círculo de color que identifica visualmente el parámetro */}
        <span className={`w-3 h-3 rounded-full ${param.color}`}></span>
        <span>{param.label}</span>
        </h4>
        {/* Valor numérico actual con 2 decimales */}
        <span className="text-xl font-bold text-green-400">{value.toFixed(2)}</span>
      </div>
      
      {/* Descripción del parámetro */}
      <p className="text-xs text-gray-400 mb-3">{param.description}</p>

      {/* Slider de rango con barra de progreso gradiente */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01" // Permite ajustes precisos de centésimas
        value={value}
        onChange={handleChange}
        className={`w-full h-2 rounded-full appearance-none cursor-pointer range-lg transition-colors duration-150 slider-thumb-green`}
        style={{
          WebkitAppearance: 'none',
          // Gradiente dinámico: verde hasta el valor actual, gris después
          background: `linear-gradient(to right, #1DB954 0%, #1DB954 ${value * 100}%, #4b5563 ${value * 100}%, #4b5563 100%)`,
          borderRadius: '5px'
        }}
      />
      
      {/* Etiquetas de mínimo y máximo en los extremos del slider */}
      <div className="flex justify-between text-xs text-gray-500 pt-1">
        <span>0.0 (Bajo)</span>
        <span>1.0 (Alto)</span>
      </div>
    </div>
  );
}

/**
 * Componente MoodWidget
 * Widget principal que contiene todos los sliders de parámetros de audio
 * Permite al usuario ajustar las características de mood/vibe de la playlist
 * 
 * @param {Object} preferences - Objeto con los valores actuales de todos los parámetros de mood
 * @param {Function} onUpdate - Callback para actualizar los valores de preferencias
 */
export default function MoodWidget({ preferences, onUpdate }) {
  
  /**
    * Restablece todos los parámetros de mood a su valor por defecto (0.5)
    * Usa un indicador especial 'reset' para forzar la actualización de todos los valores a la vez
    */
  const handleReset = () => {
      // Construir objeto con todos los parámetros en 0.5 (punto medio)
      const resetMood = {};
      MOOD_PARAMETERS.forEach(param => {
          // Establecer cada parámetro a 0.5 (valor neutral)
          resetMood[param.key] = 0.5;
      });

      // Enviar indicador 'reset' y objeto completo al Dashboard
      // Esto asegura que todos los valores se actualicen simultáneamente
      onUpdate('reset', resetMood); 
  };

  return (
    // Contenedor principal del widget
    <div className="bg-[#181818] rounded-xl shadow-2xl p-4 space-y-4 border border-gray-800">
      {/* Header con título y botón de reset */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">😊 Mood & Vibe</h3> 
        {/* Botón para restablecer todos los sliders a 0.5 */}
        <button
          onClick={handleReset}
          className="text-sm py-1 px-3 bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 transition-colors" 
        >
          Restablecer
        </button>
      </div>
    
      {/* Descripción del widget */}
      <p className="text-sm text-gray-400 border-b border-gray-700 pb-3">
        Define las características de audio de tu playlist.
      </p>

      {/* Contenedor de todos los sliders */}
      <div className="space-y-4">
        {/* Renderizar un MoodSlider por cada parámetro definido */}
        {MOOD_PARAMETERS.map(param => (
          <MoodSlider
            key={param.key}
            param={param}
            value={preferences[param.key] ?? 0.5} // Usar 0.5 como valor por defecto si no existe
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
}