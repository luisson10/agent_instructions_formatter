export interface TransformOptions {
  normalizeSpaces: boolean;
  wrapInQuotes: boolean;
  escapeInternalQuotes: boolean;
}

/**
 * Transforma texto Markdown multilinea a una sola línea lista para JSON/System Prompt.
 */
export function toSingleLine(text: string, options: TransformOptions): string {
  if (!text) return "";

  let result = text;

  // 1. Normalización de finales de línea (CRLF -> LF) y trim básico
  result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Manejo de espacios (Preservar vs Normalizar)
  if (options.normalizeSpaces) {
    // Dividimos por bloques de código (```) para no tocar lo que hay dentro
    const parts = result.split(/(```[\s\S]*?```)/g);
    result = parts.map((part, index) => {
      // Si es un bloque de código (índice impar en split por regex con captura), lo dejamos igual
      if (index % 2 !== 0) return part;
      // Si es texto normal, colapsamos espacios
      return part.replace(/[ \t]+/g, ' ');
    }).join('');
  }

  // 3. Escapar backslashes existentes
  // Importante: Si el usuario escribe C:\Path, queremos que salga C:\\Path en el string final
  // para que al parsearse sea C:\Path.
  result = result.replace(/\\/g, '\\\\');

  // 3.1 EXCEPCIÓN: Funciones de Variable {{ '\{\{... \}\}' }}
  // El usuario quiere que estas aparezcan con backslash simple en el output final,
  // no con doble backslash. Revertimos el escape SOLO para este patrón específico.
  // Buscamos: {{ '\\{\\{...\\}\\}' }} y lo convertimos a {{ '\{\{...\}\}' }}
  result = result.replace(/{{\s*'\\\\{\\\\{(.+?)\\\\}\\\\}'\s*}}/g, "{{ '\\{\\{$1\\}\\}' }}");

  // 4. Convertir saltos de línea reales a literal \n
  result = result.replace(/\n/g, '\\n');

  // 5. Escapar comillas internas si se solicita
  if (options.escapeInternalQuotes) {
    result = result.replace(/"/g, '\\"');
  }

  // 6. Envolver en comillas si se solicita
  if (options.wrapInQuotes) {
    result = `"${result}"`;
  }

  return result;
}

/**
 * Transforma texto de una sola línea (con \n literales) de vuelta a Markdown multilinea.
 */
export function toMultiLine(text: string, options: TransformOptions): string {
  if (!text) return "";

  let result = text;

  // 1. Quitar comillas externas si existen y están balanceadas
  // Solo si options.wrapInQuotes está activado o si detectamos que empieza y termina con comillas
  const hasOuterQuotes = result.length >= 2 && result.startsWith('"') && result.endsWith('"');
  
  if (hasOuterQuotes) {
      // Verificación simple: Si el usuario activó wrapInQuotes o parece un string JSON
      // Intentamos quitar las comillas. 
      // Nota: Si el usuario NO activó wrapInQuotes pero pega algo con comillas, 
      // la UX dice "Si el texto está envuelto en comillas externas ... quítalas"
      result = result.substring(1, result.length - 1);
  }

  // 2. Desescapar comillas internas 
  // Si estaba escapado como \", se convierte en "
  if (options.escapeInternalQuotes || result.includes('\\"')) {
    result = result.replace(/\\"/g, '"');
  }

  // 3. Convertir \n literal a salto de línea real
  // Ojo: \\n significa un \ literal seguido de n. \n significa salto.
  // Aquí estamos revirtiendo el paso 4 de toSingleLine.
  // La entrada tiene "\\n" (literal backslash + n) que representa un salto.
  result = result.replace(/\\n/g, '\n');

  // 4. Desescapar backslashes
  // \\ -> \
  result = result.replace(/\\\\/g, '\\');

  return result;
}

/**
 * Valida si el texto es apto para single line (no tiene saltos reales).
 */
export function validateSingleLine(text: string): { valid: boolean; error?: string } {
  if (/\n/.test(text)) {
    return { valid: false, error: "El texto contiene saltos de línea reales." };
  }
  return { valid: true };
}

