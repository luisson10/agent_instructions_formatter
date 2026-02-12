export interface TransformOptions {
  normalizeSpaces: boolean;
  wrapInQuotes: boolean;
  escapeInternalQuotes: boolean;
}

/**
 * Mantiene solo escapes válidos de salto de línea (\n).
 * Cualquier otro escape (\x) se normaliza eliminando la barra invertida.
 */
export function keepOnlyNewlineEscapes(text: string): string {
  if (!text) return "";

  const protectedBlocks: string[] = [];
  const withProtectedBlocks = text.replace(
    /{{\s*'\\\{\\\{[\s\S]+?\\\}\\\}'\s*}}/g,
    (match) => {
      const marker = `__VAR_BLOCK_${protectedBlocks.length}__`;
      protectedBlocks.push(match);
      return marker;
    }
  );

  let result = "";
  for (let i = 0; i < withProtectedBlocks.length; i++) {
    const ch = withProtectedBlocks[i];
    if (ch !== '\\') {
      result += ch;
      continue;
    }

    const next = withProtectedBlocks[i + 1];
    if (next === 'n') {
      result += '\\n';
      i += 1;
      continue;
    }

    if (!next) {
      continue;
    }

    result += next;
    i += 1;
  }

  return result.replace(/__VAR_BLOCK_(\d+)__/g, (_, index) => {
    const parsed = Number.parseInt(index, 10);
    return protectedBlocks[parsed] ?? "";
  });
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
  for (const line of lines) {
    const match = line.match(/^(\s*)(\d+(?:\.\d+)*)(?:\.)?\s+/);
    if (!match) continue;
    const indent = countIndentSize(match[1]);
    if (indent > 0) indents.push(indent);
  }

  if (indents.length === 0) return 4;

  let unit = indents[0];
  for (let i = 1; i < indents.length; i++) {
    unit = gcd(unit, indents[i]);
  }

  return unit > 0 ? unit : 4;
}

function processHierarchicalLists(text: string): string {
  const lines = text.split('\n');
  const counters: number[] = [];
  const resultLines: string[] = [];
  const indentUnit = detectIndentUnit(lines);
  let lastLevel = 0;
  let previousWasList = false;

  const setCounterAtLevel = (level: number, explicitNumber: number) => {
    while (counters.length <= level) counters.push(0);
    counters.length = level + 1;

    if (explicitNumber > 1) {
      counters[level] = explicitNumber;
      return;
    }

    if (counters[level] <= 0) {
      counters[level] = 1;
      return;
    }

    counters[level] += 1;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)(\d+(?:\.\d+)*)(?:\.)?\s+(.*)$/);

    if (!match) {
      if (line.trim() !== '' && !line.startsWith(' ')) {
        counters.length = 0;
        lastLevel = 0;
      }
      previousWasList = false;
      resultLines.push(line);
      continue;
    }

    const rawIndent = match[1];
    const numbering = match[2];
    const content = match[3];
    const parts = numbering.split('.').map((part) => Number.parseInt(part, 10));
    const isHierarchical = parts.length > 1;

    if (isHierarchical) {
      counters.length = parts.length;
      for (let level = 0; level < parts.length; level++) {
        counters[level] = Number.isNaN(parts[level]) ? 1 : parts[level];
      }
      const prefix = counters.join('.') + '.';
      resultLines.push(`${rawIndent}${prefix} ${content}`);
      lastLevel = parts.length - 1;
      previousWasList = true;
      continue;
    }

    const indent = countIndentSize(rawIndent);
    let level = Math.floor(indent / indentUnit);
    if (level > lastLevel + 1) level = lastLevel + 1;
    if (!previousWasList && level === 0) counters.length = 0;

    const explicitNumber = Number.isNaN(parts[0]) ? 1 : parts[0];
    setCounterAtLevel(level, explicitNumber);

    const prefix = counters.slice(0, level + 1).join('.') + '.';
    resultLines.push(`${rawIndent}${prefix} ${content}`);
    lastLevel = level;
    previousWasList = true;
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

/**
 * Transforma texto Markdown multilinea a una sola línea lista para JSON/System Prompt.
 */
export function toSingleLine(text: string, options: TransformOptions): string {
  if (!text) return "";

  let result = text;

  // 1. Normalización de finales de línea (CRLF -> LF) y trim básico
  result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 1.1 PROCESAMIENTO DE LISTAS JERÁRQUICAS
  // Antes de compactar, reescribimos los números "1." por "1.1.", "1.2.", etc.
  // Esto asegura que el texto plano final tenga la numeración explícita.
  result = processHierarchicalLists(result);

  // 2. Manejo de espacios (Preservar vs Normalizar)
  if (options.normalizeSpaces) {
    const parts = result.split(/(```[\s\S]*?```)/g);
    result = parts.map((part, index) => {
      if (index % 2 !== 0) return part;
      return part.replace(/[ \t]+/g, ' ');
    }).join('');
  }

  // Markdown serializers may emit escaped brackets (\[ or \]).
  // We keep literal brackets in single-line output to avoid accidental \\] artifacts.
  result = result.replace(/\\([\[\]])/g, '$1');

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

    const sanitized = text.replace(/{{\s*'\\\{\\\{[\s\S]+?\\\}\\\}'\s*}}/g, '{{VAR}}');

    for (let i = 0; i < sanitized.length; i++) {
        if (sanitized[i] !== '\\') continue;
        const next = sanitized[i + 1];
        if (!next) {
            return { status: 'warning', message: "Escape inválido: \\ al final" };
        }
        if (next !== 'n') {
            return { status: 'warning', message: `Escape inválido: \\${next}` };
        }
        i += 1;
    }

    return { status: 'success' };
}
