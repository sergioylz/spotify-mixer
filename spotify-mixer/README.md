# 🎵 Spotify Taste Mixer

**Generador de Playlists Personalizadas con Next.js 14 y Spotify Web API (OAuth 2.0)**

Este proyecto es una aplicación web full-stack moderna construida con el App Router de Next.js. Permite a los usuarios autenticarse con su cuenta de Spotify y generar playlists dinámicas mezclando preferencias de artistas, géneros y características de audio (mood, energía).

---

## 🎯 Objetivos del Proyecto

* **Autenticación Segura:** Implementación completa del flujo OAuth 2.0 (Authorization Code Flow) con gestión segura de tokens en API Routes.
* **Gestión de Tokens:** Refresco automático de tokens de acceso expirados sin intervención del usuario.
* **API Dinámica:** Interacción con múltiples endpoints de Spotify (`/search`, `/artists/top-tracks`, `/audio-features`, `/users/{id}/playlists`).
* **Arquitectura Modular:** Desarrollo de componentes React reutilizables (Widgets) y separación de lógica (librerías de auth y spotify).
* **Persistencia:** Uso de `localStorage` para guardar tokens y tracks favoritos del usuario.

## ⚙️ Tecnologías Utilizadas

| Categoría | Tecnología | Uso Principal |
| :--- | :--- | :--- |
| **Frontend** | React, Next.js 14 (App Router) | Componentes de UI, Routing del lado del cliente. |
| **Estilos** | Tailwind CSS | Diseño *utility-first* y estética *Dark Mode* inspirada en Spotify. |
| **Backend** | Next.js API Routes | Servidor proxy para manejo seguro de `Client Secret` y OAuth. |
| **API** | Spotify Web API | Obtención de datos de perfil, búsqueda de música, creación de playlists. |

## 🔒 Flujo de Autenticación (OAuth 2.0)

El proyecto utiliza el flujo de Código de Autorización para garantizar la seguridad de las credenciales de la aplicación.

1.  **Login Page:** El usuario hace clic en "Iniciar Sesión".
2.  **Auth Route:** Se genera la URL de Spotify con el parámetro `state` (para prevención de CSRF).
3.  **Spotify:** El usuario autoriza la aplicación.
4.  **Callback Route (`/auth/callback`):** Recibe el `code` y el `state`. Valida el `state`.
5.  **Token Exchange (API Route):** El cliente llama a `/api/spotify-token` (servidor) para intercambiar el `code` por el `access_token` y el `refresh_token`. El **`Client Secret`** permanece seguro en el servidor.
6.  **Redirección:** Los tokens se guardan en `localStorage` y el usuario es redirigido al `/dashboard`.

## 🛠️ Funcionalidades Implementadas

### Widgets de Preferencia
* **🎤 Artist Widget:** Búsqueda con *debouncing* y selección múltiple de artistas.
* **🎵 Track Widget:** Búsqueda de canciones favoritas.
* **🎸 Genre Widget:** Selección múltiple de géneros musicales.
* **😊 Mood Widget:** Sliders para controlar parámetros de audio de Spotify (Energía, Valencia, Bailabilidad, Acústica).

### Gestión de Playlist
* **Generación de Playlist:** Algoritmo que combina tracks de artistas, géneros, y luego los filtra usando los parámetros del Mood Widget y el *endpoint* `/audio-features`.
* **Persistencia Local:** Funcionalidad para marcar canciones como **Favoritas** (guardadas en `localStorage`).
* **Gestión de Pista:** Eliminar tracks individuales de la playlist generada.
* **Refrescar/Añadir Más:** Botones para regenerar la playlist o añadir más canciones usando las mismas preferencias.
* **✨ Guardar en Spotify (Opcional Completa):** Crea una nueva playlist en la cuenta del usuario y añade todas las canciones generadas, usando una API Route para la operación de escritura segura.

## 🚀 Configuración y Ejecución Local

### Prerrequisitos

* Node.js (18+)
* Cuenta de desarrollador de Spotify (para obtener Client ID y Secret).

### 1. Clonar e Instalar

```bash
git clone [TU REPO] spotify-taste-mixer
cd spotify-taste-mixer
npm install