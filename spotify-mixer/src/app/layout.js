// src/app/layout.js
import '@/styles/globals.css';

export const metadata = {
    title: 'Spotify Taste Mixer',
    description: 'Generador de playlists personalizado con Next.js y Spotify API',
};

export default function RootLayout({ children }) {
    return (
        <html lang="es">
        {/* Aplicamos un fondo oscuro de Spotify y el color de texto primario */}
        <body className="bg-[#121212] text-white min-h-screen">
            {children}
        </body>
        </html>
    );
}