export interface TransformOptions {
  normalizeSpaces: boolean;
  wrapInQuotes: boolean;
  escapeInternalQuotes: boolean;
}

/**
 * Procesa la numeración jerárquica (1. -> 1.1.) basada en indentación.
 * Esta función es "idempotente": si ya tiene numeración 1.1., la respeta o actualiza.
 */
function countIndentSize(rawIndent: string): number {
    let count = 0;
    for (let i = 0; i < rawIndent.length; i++) {
        const ch = rawIndent[i];
        if (ch === ' ') {
            count += 1;
        } else if (ch === '\t') {
            count += 2;
        } else {
            break;
        }
    }
    return count;
}

function gcd(a: number, b: number): number {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
        const t = y;
        y = x % y;
        x = t;
    }
    return x;
}

function detectIndentUnit(lines: string[]): number {
    const indents: number[] = [];
    const counts = new Map<number, number>();
    for (const line of lines) {
        const match = line.match(/^(\s*)(\d+(?:\.\d+)*)(?:\.)?\s+/);
        if (!match) continue;
        const indent = countIndentSize(match[1]);
        if (indent > 0) {
            indents.push(indent);
            counts.set(indent, (counts.get(indent) ?? 0) + 1);
        }
    }

    if (indents.length === 0) return 4;
    let mostCommon = indents[0];
    let highest = 0;
    for (const [indent, count] of counts) {
        if (count > highest || (count === highest && indent > mostCommon)) {
            mostCommon = indent;
            highest = count;
        }
    }
    if (mostCommon >= 2) return mostCommon;

    let unit = indents[0];
    for (let i = 1; i < indents.length; i++) {
        unit = gcd(unit, indents[i]);
    }

    return unit >= 2 ? unit : 4;
}

function processHierarchicalLists(text: string): string {
    const lines = text.split('\n');
    const counters: number[] = [0];
    const resultLines: string[] = [];
    const indentUnit = detectIndentUnit(lines);
    let lastLevel = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(\s*)(\d+(?:\.\d+)*)(?:\.)?\s+(.*)$/);

        if (match) {
            const rawIndent = match[1];
            const numbering = match[2];
            const content = match[3];
            const parts = numbering.split('.').map((part) => Number.parseInt(part, 10));
            const indent = countIndentSize(rawIndent);
            const isHierarchical = parts.length > 1;

            let level = 0;
            if (isHierarchical) {
                level = parts.length - 1;
                counters.length = parts.length;
                for (let l = 0; l < parts.length; l++) {
                    counters[l] = Number.isNaN(parts[l]) ? 1 : parts[l];
                }
            } else {
                level = Math.floor(indent / indentUnit);
                if (level > lastLevel + 1) level = lastLevel + 1;
                if (counters[level] === undefined) counters[level] = 0;

                const explicitNumber = parts[0];
                if (explicitNumber !== 1) {
                    counters[level] = explicitNumber;
                } else {
                    counters[level]++;
                }

                counters.length = level + 1;
            }

            lastLevel = level;
            const prefix = counters.slice(0, level + 1).join('.') + '.';
            resultLines.push(`${rawIndent}${prefix} ${content}`);
            continue;
        }

        if (line.trim() !== '' && !line.startsWith(' ')) {
            counters.length = 1;
            counters[0] = 0;
        }
        if (line.match(/^1\./)) {
            counters[0] = 0;
            counters.length = 1;
        }

        resultLines.push(line);
    }

    return resultLines.join('\n');
}

/**
 * Convierte numeración jerárquica explícita (ej: 1.2.3.) a listas anidadas Markdown.
 * Esto ayuda al editor visual a reconstruir correctamente las listas.
 */
export function normalizeHierarchicalNumbering(text: string): string {
    const lines = text.split('\n');
    const converted = lines.map((line) => {
        const match = line.match(/^\s*(\d+(?:\.\d+)*)(?:\.)?\s+(.*)$/);
        if (!match) return line;

        const numbering = match[1];
        const content = match[2];
        const parts = numbering.split('.');
        const depth = parts.length;
        const indent = ' '.repeat((depth - 1) * 4);
        const lastNumber = parts[parts.length - 1];

        return `${indent}${lastNumber}. ${content}`;
    });

    return converted.join('\n');
}

export function toHierarchicalMarkdown(text: string): string {
  if (!text) return "";
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return processHierarchicalLists(normalized);
}

function removeBlankLinesBetweenListItems(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];

  const isListLine = (line: string) => /^\s*\d+(?:\.\d+)*\.?\s+/.test(line);
  const nextNonEmptyIndex = (start: number) => {
    for (let i = start; i < lines.length; i++) {
      if (lines[i].trim() !== '') return i;
    }
    return -1;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      const prev = result.length > 0 ? result[result.length - 1] : '';
      const nextIndex = nextNonEmptyIndex(i + 1);
      const next = nextIndex >= 0 ? lines[nextIndex] : '';

      if (isListLine(prev) && isListLine(next)) {
        continue;
      }
    }
    result.push(line);
  }

  return result.join('\n');
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

  // 3. Evitar que los saltos de línea rompan listas jerárquicas en el parseo del editor
  result = removeBlankLinesBetweenListItems(result);

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
