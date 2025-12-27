# Prompt Architect

**Prompt Architect** es una herramienta profesional diseñada para ingenieros de prompts y desarrolladores de LLMs. Permite transformar instrucciones estructuradas y legibles por humanos (Markdown) en formatos compactos y optimizados para "System Prompts" (Single Line JSON-ready), y viceversa.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18-blue)
![TypeScript](https://img.shields.io/badge/typescript-5-blue)
![Vite](https://img.shields.io/badge/vite-5-purple)

## 🚀 Características

- **Editor Dual:**
  - **Izquierda (Humano):** Editor Markdown con resaltado de sintaxis y vista previa renderizada.
  - **Derecha (Máquina):** Vista compacta "Single Line" con escape automático de caracteres especiales (`\n`, `\"`).
- **Transformación Bidireccional:**
  - Convierte estructuras complejas (listas, encabezados, bloques de código) a una sola línea preservando la semántica.
  - Reconstruye Markdown legible desde strings compactos.
- **Herramientas de Limpieza:** Normalización de espacios, escape de comillas internas, y validación de JSON.
- **Historial Local:** Deshacer/Rehacer y persistencia automática en el navegador.
- **Modo Oscuro:** Interfaz optimizada para largas sesiones de trabajo.

## 📋 Requisitos Previos

Para ejecutar este proyecto localmente necesitas:

- **Node.js**: Versión 18 o superior (se recomienda v20 LTS).
- **npm**: Generalmente incluido con Node.js.

## 🛠️ Instalación y Ejecución Local

Sigue estos pasos para poner en marcha la aplicación en tu máquina:

1.  **Clonar el repositorio (o descargar):**
    ```bash
    git clone <tu-repo-url>
    cd prompt-architect
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:5173`.

4.  **Ejecutar pruebas (Tests):**
    Para validar la lógica de transformación:
    ```bash
    npm run test
    ```

## 📦 Construcción para Producción

Para generar los archivos estáticos optimizados para producción:

```bash
npm run build
```

Los archivos resultantes estarán en la carpeta `dist/`. Puedes servir esta carpeta con cualquier servidor web estático.

To preview the build locally:
```bash
npm run preview
```

## ☁️ Despliegue en Railway

Este proyecto está configurado para ser desplegado fácilmente en [Railway](https://railway.app/).

### Opción A: Despliegue Automático (Recomendado)
1. Sube este código a GitHub.
2. Crea un nuevo proyecto en Railway y selecciona "Deploy from GitHub repo".
3. Railway detectará automáticamente que es un proyecto Vite y configurará el build.
4. Si necesitas configuración manual, el `Dockerfile` incluido asegura un entorno consistente usando Nginx.

### Opción B: Uso del Dockerfile
El repositorio incluye un `Dockerfile` multi-stage optimizado.
1. En Railway, asegúrate de que el despliegue apunte al `Dockerfile`.
2. Railway construirá la imagen y expondrá el puerto 80 automáticamente.

## 🔧 Estructura del Proyecto

```text
src/
├── components/
│   ├── editor/       # Lógica de los editores (Izquierda/Derecha)
│   ├── ui/           # Componentes base reutilizables
│   └── ...
├── lib/
│   └── transformer.ts # Lógica CORE de transformación (sin dependencias de UI)
├── store/            # Estado global con Zustand
└── App.tsx           # Layout principal
```

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue o un pull request para discutir cambios mayores.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
