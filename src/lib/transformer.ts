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

  // 1.1 CLEANUP PRE-ESCAPE: Eliminar "Hard Breaks" de Markdown (Shift+Enter)
  // Markdown representa Shift+Enter como un backslash al final de la línea.
  // Si no lo quitamos, se convierte en \\n (literal backslash + literal n).
  // Queremos que sea solo \n.
  // Regex: Backslash seguido inmediatamente de newline -> newline
  result = result.replace(/\\\n/g, '\n');

  // 2. Manejo de espacios (Preservar vs Normalizar)
  if (options.normalizeSpaces) {
    const parts = result.split(/(```[\s\S]*?```)/g);
    result = parts.map((part, index) => {
      if (index % 2 !== 0) return part;
      return part.replace(/[ \t]+/g, ' ');
    }).join('');
  }

  // 3. Escapar backslashes existentes
  result = result.replace(/\\/g, '\\\\');

  // 3.1 EXCEPCIÓN: Funciones de Variable {{ '\{\{... \}\}' }}
  result = result.replace(/{{\s*'\\\\{\\\\{(.+?)\\\\}\\\\}'\s*}}/g, "{{ '\\{\\{$1\\}\\}' }}");

  // 3.2 EXCEPCIÓN: Corchetes simples [texto]
  result = result.replace(/\\\[/g, '[').replace(/\\\]/g, ']');

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
 * Transforma texto de una sola línea de vuelta a Markdown.
 */
export function toMultiLine(text: string, options: TransformOptions): string {
  if (!text) return "";
  let result = text;

  const hasOuterQuotes = result.length >= 2 && result.startsWith('"') && result.endsWith('"');
  if (hasOuterQuotes) {
      result = result.substring(1, result.length - 1);
  }

  if (options.escapeInternalQuotes || result.includes('\\"')) {
    result = result.replace(/\\"/g, '"');
  }

  result = result.replace(/\\n/g, '\n');
  result = result.replace(/\\\\/g, '\\');

  return result;
}

/**
 * Validación Avanzada del Output
 */
export function validateOutputQuality(text: string): { status: 'success' | 'warning' | 'error'; message?: string } {
    // 1. Check saltos reales (Error crítico)
    if (/\n/.test(text)) {
        return { status: 'error', message: "Saltos de línea reales detectados" };
    }

    // 2. Check artifacts de escape prohibidos (Warning)
    // \\\n -> Tres backslashes y una n (visualmente \\\n)
    // \n\  -> \n seguido de backslash
    if (/\\\\\\n/.test(text)) {
        return { status: 'warning', message: "Posible escape roto: \\\\\\n detectado" };
    }
    if (/\\n\\/.test(text)) {
        return { status: 'warning', message: "Posible escape roto: \\n\\ detectado" };
    }

    return { status: 'success' };
}
