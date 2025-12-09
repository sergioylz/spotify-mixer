// src/app/layout.js
import '@/styles/globals.css'; // <-- ¡IMPORTACIÓN CRÍTICA!

export const metadata = {
  title: 'Spotify Taste Mixer',
  description: 'Generador de playlists personalizado con Next.js y Spotify API',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      {/* Aplicamos el fondo con gradiente y el texto blanco */}
      <body className="spotify-gradient-bg text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}