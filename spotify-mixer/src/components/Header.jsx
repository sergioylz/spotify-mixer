'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header({ user }) {
    const router = useRouter();

    const handleLogout = () => {
        // Limpiar tokens de localStorage
        localStorage.removeItem('spotify_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiration');
        localStorage.removeItem('favorite_tracks');

        router.push('/');
    };

    return (
        <header className='flex justify-between items-center p-4 bg-[#181818] shadow-lg sticky top-0 z-10'>
            <Link href="/dashboard" className="text-2xl font-bold text-[#1DB954] hover:text-white transition-colors">
            Taste Mixer 🎵
            </Link>
            
            <div className="flex items-center space-x-4">
                {user && (
                <div className="text-sm text-gray-300 flex items-center space-x-2">
                    {/* Opcional: Mostrar imagen de perfil del usuario */}
                    {user.images && user.images[0] && (
                        <img 
                            src={user.images[0].url} 
                            alt={user.display_name} 
                            className="w-8 h-8 rounded-full" 
                        />
                    )}
                    <span>Hola, **{user.display_name}**</span>
                </div>
                )}

                <button
                onClick={handleLogout}
                className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-full text-sm font-semibold transition-colors"
                >
                Cerrar Sesión
                </button>
            </div>
        </header>   
    );
}