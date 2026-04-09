# Prompt Architect

## Descripcion

Herramienta profesional para prompt engineers y desarrolladores de LLMs. Permite la transformacion bidireccional entre Markdown legible para humanos y formato single-line optimizado para maquinas (JSON, system prompts, APIs). Incluye una libreria de prompts con backend en PostgreSQL para organizar, versionar y reutilizar tus instrucciones.

## Screenshots

`[TODO: agregar screenshots]`

## Stack Tecnologico

| Tecnologia | Version | Rol |
|---|---|---|
| React | ^19.2.0 | UI framework |
| TypeScript | ~5.9.3 | Type safety |
| Vite | ^7.2.4 | Build tool y dev server |
| Tailwind CSS | ^4.1.18 | Estilos utility-first |
| @tiptap/react | ^3.14.0 | Editor visual WYSIWYG |
| @tiptap/starter-kit | ^3.14.0 | Extensiones base de Tiptap |
| @tiptap/extension-typography | ^3.14.0 | Tipografia inteligente |
| tiptap-markdown | ^0.9.0 | Serializacion Markdown para Tiptap |
| Zustand | ^5.0.9 | State management |
| react-resizable-panels | ^3.0.6 | Paneles redimensionables |
| lucide-react | ^0.562.0 | Iconografia |
| clsx | ^2.1.1 | Class names condicionales |
| tailwind-merge | ^3.4.0 | Merge inteligente de clases Tailwind |
| react-markdown | ^10.1.0 | Renderizado Markdown |
| remark-gfm | ^4.0.1 | Soporte GitHub Flavored Markdown |
| @tailwindcss/typography | ^0.5.19 | Plugin de prosa tipografica |
| Vitest | ^4.0.16 | Testing framework |
| ESLint | ^9.39.1 | Linting |

## Funcionalidades

### Editor Bidireccional

La aplicacion presenta dos paneles lado a lado:

- **Panel izquierdo -- "Humano (visual)"**: Editor rich-text basado en Tiptap con toolbar completa (negrita, cursiva, headings H1-H3, listas ordenadas/desordenadas). Soporta Markdown nativo con serializacion automatica.
- **Panel derecho -- "Maquina (single line)"**: Textarea para el formato single-line que consumen las APIs de LLMs. Muestra el resultado transformado con validacion en tiempo real (badges de estado: Valido/Revisar/Error).
- **Transformacion bidireccional en tiempo real**: Cada cambio en el editor visual se transforma automaticamente al formato single-line. El boton "Reconstruir" permite importar texto single-line de vuelta al editor visual.

#### Opciones de transformacion

- **Normalizar espacios**: Colapsa multiples espacios/tabs en uno solo.
- **Envolver en comillas**: Wrappea la salida en comillas dobles (`"..."`).

### Compuertas Logicas (Pseudocodigo)

Sistema de keywords que representan logica condicional dentro de los prompts. Se renderizan como chips visuales azul/indigo en el editor.

| Keyword | Descripcion | Ejemplo |
|---|---|---|
| `IF` | Evalua si se cumple una condicion | `IF hora_local < entrega_minima` |
| `AND` | Une multiples condiciones que deben cumplirse | `IF hora > minima AND hora < cierre` |
| `ELSE` | Se ejecuta si la condicion IF no se cumple | `ELSE -> USE horario_entrega` |
| `THEN` | Accion que sigue despues de una condicion | `IF cliente confirma THEN ejecutar pedido` |
| `DO` | Accion imperativa -- ejecuta algo especifico | `DO verificar disponibilidad` |
| `OMIT` | El agente NO debe realizar esta accion | `OMIT prometer entrega sin confirmacion` |
| `USE` | Indica que dato o valor utilizar | `USE entrega_minima_cilindro` |
| `SAY` | El agente debe verbalizar exactamente este texto | `SAY "Muy bien, espere en la linea"` |
| `GOTO` | Salta a un paso especifico del flujo | `GOTO paso_3` |
| `WAIT` | Pausa hasta que ocurra un evento | `WAIT cliente_responde` |
| `CALL` | Invoca una funcion o tool | `CALL generar_pedido_gas` |

Cada keyword se renderiza como un nodo atomico inline (`LogicGateNode`) que serializa al keyword en texto plano durante la exportacion Markdown.

### Slash Command Menu

Menu contextual al estilo VS Code / Notion para insertar compuertas logicas y variables:

- Escribi `/` en el editor para abrir el menu.
- Filtra escribiendo despues del `/` (busca en keyword, label y descripcion).
- Navegacion con flechas arriba/abajo y Enter para seleccionar.
- Panel de tooltip a la derecha con descripcion detallada y ejemplo de uso.
- Escape para cerrar sin insertar.

### Variables

- Sintaxis `{{ nombre_variable }}` para representar datos dinamicos.
- Se renderizan como chips verdes en el editor visual (`VariableNode`).
- Insercion via toolbar (boton `{ }`) o Slash Command (`/variable`).
- Sobreviven la serializacion JSON -- se escapan como `{{ '\{\{nombre\}\}' }}` en el formato single-line.

### Listas Jerarquicas

- Soporte de 3 niveles de profundidad: `1.` -> `1.1.` -> `1.1.1.`
- La numeracion jerarquica se calcula automaticamente segun la indentacion.
- CSS counters para la visualizacion numerada en el editor.
- Extension `CustomOrderedList` que respeta el atributo `start` del `<ol>`, asegurando que los counters CSS arranquen en el numero correcto.
- Funcion `normalizeHierarchicalNumbering()` para hidratar listas jerarquicas de vuelta al editor.

### Libreria de Prompts

Sidebar estilo VS Code para organizar y gestionar prompts:

- **Colecciones (carpetas)**: CRUD completo -- crear, renombrar (doble click inline), eliminar.
- **Prompts dentro de colecciones**: Guardar, cargar, actualizar, renombrar y eliminar.
- **Context menu** (boton `...`): Opciones de renombrar y eliminar para cada item.
- **Indicador de prompt activo**: Border indigo en el prompt seleccionado.
- **Footer dinamico**: "Guardar prompt" cuando no hay prompt activo, "Actualizar" cuando hay uno cargado.
- **Conectado a backend PostgreSQL** via API REST (`/api/collections`, `/api/prompts`).

## Requisitos

- **Node.js** 18+
- **Backend API** corriendo ([prompt-architect-api](https://github.com/aaronjimenez22/prompt-architect-api)) -- necesario para la libreria de prompts.

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
# 1. Levantar el backend primero (ver prompt-architect-api README)
# 2. Arrancar el frontend
npm run dev  # http://localhost:5173
```

## Variables de Entorno

| Variable | Descripcion | Default |
|---|---|---|
| `VITE_API_URL` | URL del backend API | `http://localhost:3001` |

Crear un archivo `.env` en la raiz:

```bash
VITE_API_URL=http://localhost:3001
```

## Estructura del Proyecto

```
agent_instructions_formatter/
├── src/
│   ├── App.tsx                         # Layout principal -- PanelGroup con sidebar + 2 editores
│   ├── main.tsx                        # Entry point React
│   ├── index.css                       # Estilos globales + CSS counters para listas
│   ├── components/
│   │   ├── editor/
│   │   │   ├── LeftEditor.tsx          # Panel izquierdo -- editor visual con undo/redo/clear
│   │   │   ├── RichTextEditor.tsx      # Editor Tiptap con toolbar y extensiones custom
│   │   │   ├── RightEditor.tsx         # Panel derecho -- textarea single-line con validacion
│   │   │   └── extensions/
│   │   │       ├── CustomOrderedList.ts    # OL con counter-reset que respeta start
│   │   │       ├── LogicGateNode.ts        # Nodo atomico para keywords logicos
│   │   │       ├── LogicGateComponent.tsx  # Componente visual del chip logico
│   │   │       ├── VariableNode.ts         # Nodo atomico para variables {{ }}
│   │   │       ├── VariableComponent.tsx   # Componente visual del chip variable
│   │   │       ├── VariableMark.ts         # Mark alternativo para variables
│   │   │       ├── SlashCommand.tsx        # Extension + menu React del slash command
│   │   │       └── logicGateKeywords.ts    # Definicion de los 11 keywords
│   │   ├── library/
│   │   │   ├── PromptLibrary.tsx       # Sidebar con arbol de colecciones/prompts
│   │   │   └── SavePromptDialog.tsx    # Dialog para guardar nuevo prompt
│   │   └── ui/
│   │       ├── Button.tsx              # Componente boton reutilizable
│   │       └── Toggle.tsx              # Componente toggle/switch
│   ├── lib/
│   │   ├── transformer.ts             # Logica pura de transformacion MD <-> single-line
│   │   ├── transformer.test.ts        # Tests unitarios del transformer
│   │   └── api.ts                     # Cliente fetch para el backend REST
│   ├── store/
│   │   ├── useAppStore.ts             # Estado global -- markdown, singleLine, historial, opciones
│   │   └── useLibraryStore.ts         # Estado de la libreria -- colecciones, prompts, sidebar
│   └── types/
│       └── library.ts                 # Tipos TypeScript para Collection y Prompt
├── public/                            # Assets estaticos
├── server.js                          # Servidor Node.js para produccion (sirve dist/)
├── vite.config.ts                     # Configuracion Vite
├── railway.json                       # Configuracion de deploy en Railway
├── tailwind.config.js                 # Configuracion Tailwind
├── tsconfig.json                      # Configuracion TypeScript
├── eslint.config.js                   # Configuracion ESLint
└── package.json
```

## Arquitectura

### Capas

| Capa | Responsabilidad | Archivos |
|---|---|---|
| **Presentacion** | Componentes React, UI, interaccion | `src/components/` |
| **Estado** | Zustand stores con persistencia | `src/store/useAppStore.ts`, `src/store/useLibraryStore.ts` |
| **Logica** | Funciones puras de transformacion | `src/lib/transformer.ts` |
| **API** | Cliente fetch para el backend | `src/lib/api.ts` |

### Flujo de datos

```
Editor Visual (Tiptap)
    │
    ▼
tiptap-markdown (serializa a MD)
    │
    ▼
toHierarchicalMarkdown() ─── procesa numeracion jerarquica
    │
    ▼
Zustand Store (useAppStore) ─── markdown + opciones
    │
    ▼
toSingleLine() ─── escapa \n, normaliza, wrappea
    │
    ▼
Editor Single-Line (textarea)
```

El flujo inverso (single-line -> visual) se activa con el boton "Reconstruir":

```
Textarea (pegar/editar)
    │
    ▼
keepOnlyNewlineEscapes() ─── sanitiza escapes invalidos
    │
    ▼
toMultiLine() ─── revierte escapes, reconstruye saltos de linea
    │
    ▼
Zustand Store ─── setMarkdown() con historial
    │
    ▼
normalizeHierarchicalNumbering() + hidratacion de variables/gates
    │
    ▼
Tiptap setContent() ─── renderiza el rich text
```

### Extensiones Tiptap

| Extension | Tipo | Descripcion |
|---|---|---|
| StarterKit | Bundle | Headings, listas, bold, italic, code, blockquote |
| CustomOrderedList | Node | `<ol>` con `counter-reset` que respeta `start` |
| VariableNode | Node (inline, atom) | Chips verdes para `{{ variable }}` |
| LogicGateNode | Node (inline, atom) | Chips azules para keywords logicos |
| SlashCommandExtension | Extension + ProseMirror Plugin | Menu `/` con filtrado y navegacion por teclado |
| Markdown | Extension | Serializacion bidireccional Markdown via tiptap-markdown |
| Typography | Extension | Reemplazos tipograficos automaticos |

## Testing

```bash
npm run test     # Vitest -- modo watch
```

Los tests cubren la logica de transformacion en `src/lib/transformer.test.ts`:

- Transformacion `toSingleLine()` y `toMultiLine()` (ida y vuelta).
- Procesamiento de listas jerarquicas (`toHierarchicalMarkdown()`).
- Normalizacion de numeracion (`normalizeHierarchicalNumbering()`).
- Sanitizacion de escapes (`keepOnlyNewlineEscapes()`).
- Validacion de output (`validateOutputQuality()`).
- Preservacion de variables `{{ }}` a traves de transformaciones.

## Build y Deploy

```bash
npm run build    # tsc -b + vite build → dist/
npm start        # Node.js static server (server.js) → produccion
```

El servidor de produccion (`server.js`) sirve los archivos estaticos desde `dist/` con SPA fallback (cualquier ruta no encontrada devuelve `index.html`).

### Deploy en Railway

- Usa **Nixpacks** como builder.
- `railway.json` configura el build (`npm run build`) y el start (`npm start`).
- Configurar la variable de entorno `VITE_API_URL` apuntando a la URL del backend desplegado.
- El servidor escucha en el puerto definido por `PORT` (Railway lo asigna automaticamente).

## Scripts Disponibles

| Script | Comando | Descripcion |
|---|---|---|
| `dev` | `vite` | Servidor de desarrollo con HMR en `localhost:5173` |
| `build` | `tsc -b && vite build` | Type-check + build de produccion a `dist/` |
| `start` | `node server.js` | Servidor estatico Node.js para produccion |
| `preview` | `vite preview` | Preview local del build de produccion |
| `lint` | `eslint .` | Linting del codigo fuente |
| `test` | `vitest` | Tests unitarios con Vitest (modo watch) |
