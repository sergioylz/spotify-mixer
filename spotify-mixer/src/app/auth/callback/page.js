// src/app/auth/callback/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { validateAuthState } from '@/lib/auth';

export default function CallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('Procesando autenticación...');

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // 1. Manejar error si el usuario deniega el acceso
        if (error) {
        setStatus(`Error de autenticación: ${error}. Redirigiendo al login...`);
        setTimeout(() => router.push('/'), 3000);
        return;
        }

        // 2. Validar CSRF (Crucial)
        if (!validateAuthState(state)) {
        setStatus('Error de seguridad (CSRF). Intenta de nuevo.');
        setTimeout(() => router.push('/'), 3000);
        return;
        }

        // 3. Intercambiar código por tokens
        if (code) {
        const exchangeToken = async () => {
            setStatus('Intercambiando código por tokens...');
            try {
            // Llama a la API Route del servidor
            const response = await fetch('/api/spotify-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fallo en el intercambio de tokens');
            }

            const data = await response.json();
            
            // 4. Guardar los tokens y la expiración en localStorage (CLIENTE)
            const expirationTime = Date.now() + data.expires_in * 1000;
            
            localStorage.setItem('spotify_token', data.access_token);
            localStorage.setItem('spotify_token_expiration', expirationTime.toString());
            if (data.refresh_token) {
                localStorage.setItem('spotify_refresh_token', data.refresh_token);
            }

            setStatus('¡Autenticación exitosa! Redirigiendo al dashboard...');
            // 5. Redirigir al dashboard
            setTimeout(() => router.push('/dashboard'), 1500);

            } catch (err) {
            console.error('Error durante el Token Exchange:', err);
            setStatus(`Fallo: ${err.message}. Redirigiendo al login.`);
            setTimeout(() => router.push('/'), 3000);
            }
        };

        exchangeToken();
        } else {
        setStatus('Código de autorización no encontrado. Redirigiendo al login...');
        setTimeout(() => router.push('/'), 3000);
        }
    }, [searchParams, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold text-green-400">
            {status}
        </div>
        </div>
    );
}