// src/app/auth/callback/page.js
// ============================================
// PÁGINA DE CALLBACK DE AUTENTICACIÓN OAUTH 2.0
// ============================================
// Esta página maneja el callback de Spotify después de que el usuario
// autoriza la aplicación. Procesa el código de autorización, lo intercambia
// por tokens de acceso y redirecciona al dashboard.

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { validateAuthState } from '@/lib/auth';

/**
 * Página de callback de OAuth 2.0 de Spotify
 * 
 * Flujo de autenticación:
 * 1. Usuario hace login en Spotify
 * 2. Spotify redirige aquí con código/estado o error
 * 3. Validamos CSRF con el estado guardado
 * 4. Intercambiamos el código por tokens (access + refresh)
 * 5. Guardamos tokens en localStorage
 * 6. Redirigimos al dashboard
 * 
 * @returns {JSX.Element} Pantalla de carga con estado de autenticación
 */
export default function CallbackPage() {
    // Hook para navegación programática
    const router = useRouter();
    
    // Parámetros de URL enviados por Spotify
    const searchParams = useSearchParams();
    
    // Estado para mostrar progreso de autenticación al usuario
    const [status, setStatus] = useState('Procesando autenticación...');

    // ============================================
    // EFECTO: Procesar callback de OAuth 2.0
    // ============================================
    useEffect(() => {
        // Extraer parámetros de URL que envía Spotify
        const code = searchParams.get('code');        // Código de autorización (si éxito)
        const state = searchParams.get('state');      // Estado CSRF para validación
        const error = searchParams.get('error');      // Error (si usuario denegó)      // Error (si usuario denegó)

        // ============================================
        // PASO 1: Manejar error si el usuario deniega el acceso
        // ============================================
        // Spotify envía ?error=access_denied si el usuario rechaza los permisos
        if (error) {
        setStatus(`Error de autenticación: ${error}. Redirigiendo al login...`);
        setTimeout(() => router.push('/'), 3000);
        return;
        }

        // ============================================
        // PASO 2: Validar CSRF (Crucial para seguridad)
        // ============================================
        // Verificamos que el 'state' recibido coincida con el que generamos
        // Esto previene ataques CSRF donde un atacante intenta usar su propio código
        if (!validateAuthState(state)) {
        setStatus('Error de seguridad (CSRF). Intenta de nuevo.');
        setTimeout(() => router.push('/'), 3000);
        return;
        }

        // ============================================
        // PASO 3: Intercambiar código por tokens
        // ============================================
        // Si tenemos un código válido, lo enviamos a nuestro servidor para
        // que lo intercambie por access_token y refresh_token
        if (code) {
        const exchangeToken = async () => {
            setStatus('Intercambiando código por tokens...');
            try {
            // Llamar a nuestra API Route del servidor (/api/spotify-token)
            // El servidor maneja las credenciales de forma segura
            const response = await fetch('/api/spotify-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })  // Enviamos el código de autorización
            });

            // Si la API responde con error, lanzar excepción
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fallo en el intercambio de tokens');
            }

            // Respuesta contiene: access_token, refresh_token, expires_in
            const data = await response.json();
            
            // ============================================
            // PASO 4: Guardar tokens en localStorage
            // ============================================
            // Calculamos cuándo expira el token (expires_in está en segundos)
            const expirationTime = Date.now() + data.expires_in * 1000;
            
            // Guardar access_token (necesario para todas las peticiones a la API)
            localStorage.setItem('spotify_token', data.access_token);
            
            // Guardar timestamp de expiración (para renovar antes de que expire)
            localStorage.setItem('spotify_token_expiration', expirationTime.toString());
            
            // Guardar refresh_token (para obtener nuevos access_tokens sin re-login)
            if (data.refresh_token) {
                localStorage.setItem('spotify_refresh_token', data.refresh_token);
            }

            setStatus('¡Autenticación exitosa! Redirigiendo al dashboard...');
            
            // ============================================
            // PASO 5: Redirigir al dashboard
            // ============================================
            // Esperamos 1.5 segundos para que el usuario vea el mensaje de éxito
            setTimeout(() => router.push('/dashboard'), 1500);

            } catch (err) {
            // Si algo falla en el proceso, mostrar error y volver al login
            console.error('Error durante el Token Exchange:', err);
            setStatus(`Fallo: ${err.message}. Redirigiendo al login.`);
            setTimeout(() => router.push('/'), 3000);
            }
        };

        // Ejecutar la función de intercambio de tokens
        exchangeToken();
        } else {
        // Si no hay código, algo salió mal en el flujo OAuth
        setStatus('Código de autorización no encontrado. Redirigiendo al login...');
        setTimeout(() => router.push('/'), 3000);
        }
    }, [searchParams, router]);  // Re-ejecutar si cambian los parámetros  // Re-ejecutar si cambian los parámetros

    // ============================================
    // RENDERIZADO: Pantalla de carga
    // ============================================
    // Mostramos el estado actual del proceso de autenticación
    // mientras procesamos el callback en segundo plano
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold text-green-400">
            {status}
        </div>
        </div>
    );
}