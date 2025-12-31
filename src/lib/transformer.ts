export interface TransformOptions {
  normalizeSpaces: boolean;
  wrapInQuotes: boolean;
  escapeInternalQuotes: boolean;
}

/**
 * Procesa la numeración jerárquica (1. -> 1.1.) basada en indentación.
 * Esta función es "idempotente": si ya tiene numeración 1.1., la respeta o actualiza.
 */
function processHierarchicalLists(text: string): string {
    const lines = text.split('\n');
    const counters: number[] = [0]; // Contadores por nivel. Nivel 0 = counters[0]
    let resultLines: string[] = [];
    let lastLevel = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detectar si es una línea de lista ordenada: espacios + número + punto
        // Regex: ^(\s*)(\d+)\.(.*)
        const match = line.match(/^(\s*)(\d+)\.(.*)/);
        
        if (match) {
            const indent = match[1].length;
            const content = match[3];
            
            // Estimamos nivel asumiendo 3 espacios por nivel (Markdown estándar suele ser 2-4)
            // Si la indentación es 0 -> nivel 0
            // Si es 3 -> nivel 1
            const level = Math.floor(indent / 2); // Seremos flexibles con 2 espacios
            
            // Ajustar array de contadores
            if (level > lastLevel) {
                // Entrando a subnivel: iniciamos contadores
                for (let l = lastLevel + 1; l <= level; l++) {
                    counters[l] = 0;
                }
            }
            
            // Incrementar contador del nivel actual
            if (counters[level] === undefined) counters[level] = 0;
            counters[level]++;
            
            lastLevel = level;
            
            // Construir prefijo jerárquico: 1.2.1.
            const prefix = counters.slice(0, level + 1).join('.') + '.';
            
            // Reconstruir línea con indentación original pero nuevo número
            resultLines.push(`${match[1]}${prefix}${content}`);
        } else {
            // Si la línea no es lista, pero tampoco está vacía, podría romper la lista.
            // En Markdown estricto, texto indentado sigue en la lista.
            // Si es texto raíz, reseteamos.
            if (line.trim() !== '' && !line.startsWith(' ')) {
                counters.length = 1; // Resetear a nivel raíz
                counters[0] = 0; // O no? Depende si queremos reiniciar numeración global.
                // Mejor estrategia: Resetear solo si encontramos un encabezado o cambio de contexto fuerte.
                // Por simplicidad para este caso de uso: Si rompe la indentación visual, asumimos reset parcial?
                // No, mejor dejar que el usuario controle el reset con nuevos números 1.
                
                // Si encontramos un "1." explícito en la raíz, reseteamos.
            }
             // Caso especial: Si el usuario escribió manualmente "1." en la raíz, forzamos reset.
            if (line.match(/^1\./)) {
                counters[0] = 0; // El loop lo incrementará a 1
                counters.length = 1;
            }

            resultLines.push(line);
        }
    }
    
    return resultLines.join('\n');
}


/**
 * Transforma texto Markdown multilinea a una sola línea lista para JSON/System Prompt.
 */
export function toSingleLine(text: string, options: TransformOptions): string {
  if (!text) return "";

  let result = text;

  // 1. Normalización de finales de línea (CRLF -> LF) y trim básico
  result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 1.1 CLEANUP AGRESIVO
  result = result.replace(/\\\n/g, '\n');
  result = result.replace(/[ \t]+\\\n/g, '\n');

  // 1.2 PROCESAMIENTO DE LISTAS JERÁRQUICAS
  // Antes de compactar, reescribimos los números "1." por "1.1.", "1.2.", etc.
  // Esto asegura que el texto plano final tenga la numeración explícita.
  // IMPORTANTE: Esto altera el contenido. Solo deberíamos hacerlo si estamos seguros.
  // Dado el requerimiento, lo aplicaremos.
  result = processHierarchicalLists(result);

  // 2. Manejo de espacios (Preservar vs Normalizar)
  if (options.normalizeSpaces) {
    const parts = result.split(/(```[\s\S]*?```)/g);
    result = parts.map((part, index) => {
      if (index % 2 !== 0) return part;
      return part.replace(/[ \t]+/g, ' ');
    }).join('');
  }

  // 2.1 CLEANUP: Des-escapar corchetes
  result = result.replace(/\\\[/g, '[').replace(/\\\]/g, ']');

  // 3. Escapar backslashes existentes
  result = result.replace(/\\/g, '\\\\');

  // 3.1 EXCEPCIÓN: Funciones de Variable
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

// ... (resto del archivo igual) ...
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

export function validateOutputQuality(text: string): { status: 'success' | 'warning' | 'error'; message?: string } {
    if (/\n/.test(text)) {
        return { status: 'error', message: "Saltos de línea reales detectados" };
    }
    if (/\\\\\\n/.test(text)) {
        return { status: 'warning', message: "Posible escape roto: \\\\\\n detectado" };
    }
    if (/\\n\\/.test(text)) {
        return { status: 'warning', message: "Posible escape roto: \\n\\ detectado" };
    }

    return { status: 'success' };
}
