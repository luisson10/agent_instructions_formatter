import { describe, it, expect } from 'vitest';
import { keepOnlyNewlineEscapes, toSingleLine, toMultiLine, normalizeHierarchicalNumbering } from './transformer';
import type { TransformOptions } from './transformer';

const defaultOptions: TransformOptions = {
  normalizeSpaces: false,
  wrapInQuotes: false,
  escapeInternalQuotes: false,
};

describe('Transformer Logic', () => {
  describe('keepOnlyNewlineEscapes', () => {
    it('keeps only \\n escapes and removes other backslash escapes', () => {
      const input = 'line\\nvalue\\tpath\\\\name\\q';
      const output = keepOnlyNewlineEscapes(input);
      expect(output).toBe('line\\nvaluetpath\\nameq');
    });

    it('preserves variable tokens while cleaning other escapes', () => {
      const input = "{{ '\\{\\{direccion_cliente\\}\\}' }}\\tEND\\nNEXT";
      const output = keepOnlyNewlineEscapes(input);
      expect(output).toBe("{{ '\\{\\{direccion_cliente\\}\\}' }}tEND\\nNEXT");
    });
  });

  describe('toSingleLine', () => {
    it('converts newlines to literal \\n', () => {
      const input = 'Hello\nWorld';
      const output = toSingleLine(input, defaultOptions);
      expect(output).toBe('Hello\\nWorld');
    });

    it('preserves spaces by default', () => {
      const input = 'Hello    World';
      const output = toSingleLine(input, defaultOptions);
      expect(output).toBe('Hello    World');
    });

    it('normalizes spaces when requested', () => {
      const input = 'Hello    World';
      const output = toSingleLine(input, { ...defaultOptions, normalizeSpaces: true });
      expect(output).toBe('Hello World');
    });

    it('escapes quotes when requested', () => {
      const input = 'Say "Hello"';
      const output = toSingleLine(input, { ...defaultOptions, escapeInternalQuotes: true });
      expect(output).toBe('Say \\"Hello\\"');
    });

    it('wraps in quotes when requested', () => {
      const input = 'Hello';
      const output = toSingleLine(input, { ...defaultOptions, wrapInQuotes: true });
      expect(output).toBe('"Hello"');
    });

    it('handles backslashes correctly', () => {
      const input = 'C:\\Path\\To\\File';
      const output = toSingleLine(input, defaultOptions);
      // Backslashes should be escaped so they survive JSON parsing
      expect(output).toBe('C:\\\\Path\\\\To\\\\File');
    });
    
    it('combines all options', () => {
      const input = 'Line 1\nLine "2"';
      const output = toSingleLine(input, {
        normalizeSpaces: true,
        escapeInternalQuotes: true,
        wrapInQuotes: true
      });
      // 1. Newline -> \n
      // 2. Quotes -> \"
      // 3. Wrap -> "..."
      expect(output).toBe('"Line 1\\nLine \\"2\\""');
    });

    it('builds hierarchical numbering from indented lists', () => {
      const input = [
        '1. Parent',
        '    1. Child',
        '        1. Grandchild',
        '    1. Sibling'
      ].join('\n');
      const output = toSingleLine(input, defaultOptions);
      expect(output).toBe(
        '1. Parent\\n    1.1. Child\\n        1.1.1. Grandchild\\n    1.2. Sibling'
      );
    });

    it('preserves explicit list numbers when provided', () => {
      const input = [
        '2. Top',
        '  3. Child',
        '    4. Grandchild'
      ].join('\n');
      const output = toSingleLine(input, defaultOptions);
      expect(output).toBe('2. Top\\n  2.3. Child\\n    2.3.4. Grandchild');
    });

    it('preserves hierarchical numbering when already explicit', () => {
      const input = [
        '1. Parent',
        '1.1. Child',
        '1.1.1. Grandchild',
        '1.1.2. Sibling'
      ].join('\n');
      const output = toSingleLine(input, defaultOptions);
      expect(output).toBe('1. Parent\\n1.1. Child\\n1.1.1. Grandchild\\n1.1.2. Sibling');
    });

    it('does not double-escape markdown bracket escapes', () => {
      const input = 'Texto con \\] y \\[';
      const output = toSingleLine(input, defaultOptions);
      expect(output).toBe('Texto con ] y [');
    });

    it('normalizes markdown hard-breaks to a single \\n', () => {
      const input = 'Linea 1\\\nLinea 2';
      const output = toSingleLine(input, defaultOptions);
      expect(output).toBe('Linea 1\\nLinea 2');
    });
  });

  describe('toMultiLine', () => {
    it('converts literal \\n to real newlines', () => {
      const input = 'Hello\\nWorld';
      const output = toMultiLine(input, defaultOptions);
      expect(output).toBe('Hello\nWorld');
    });

    it('removes wrapping quotes', () => {
      const input = '"Hello World"';
      const output = toMultiLine(input, defaultOptions); // Auto-detects quotes
      expect(output).toBe('Hello World');
    });

    it('unescapes internal quotes', () => {
      const input = 'Say \\"Hello\\"';
      const output = toMultiLine(input, defaultOptions);
      expect(output).toBe('Say "Hello"');
    });

    it('handles complex restoration', () => {
      const input = '"Line 1\\nLine \\"2\\""';
      const output = toMultiLine(input, defaultOptions);
      expect(output).toBe('Line 1\nLine "2"');
    });

    it('preserves literal backslashes correctly', () => {
        // Input represents: C:\\Path (escaped in string as C:\\\\Path)
        const input = 'C:\\\\Path'; 
        const output = toMultiLine(input, defaultOptions);
        expect(output).toBe('C:\\Path');
    });

    it('converts hierarchical numbering into nested ordered lists', () => {
      const input = [
        '1. Parent',
        '1.2. Child',
        '1.2.1. Grandchild'
      ].join('\n');
      const output = toMultiLine(input, defaultOptions);
      expect(output).toBe('1. Parent\n1.2. Child\n1.2.1. Grandchild');
    });

    it('preserves blank lines between nested list items', () => {
      const input = [
        '1. Parent',
        '',
        '1.1. Child',
        '',
        '1.1.1. Grandchild',
        '',
        '2. Next Parent'
      ].join('\n');
      const output = toMultiLine(input, defaultOptions);
      expect(output).toBe('1. Parent\n\n1.1. Child\n\n1.1.1. Grandchild\n\n2. Next Parent');
    });

    it('keeps explicit list numbers in nested reconstruction', () => {
      const input = '2.3.4. Deep item';
      const output = toMultiLine(input, defaultOptions);
      expect(output).toBe('2.3.4. Deep item');
    });
  });

  describe('normalizeHierarchicalNumbering', () => {
    it('converts hierarchical numbers to indented markdown preserving start values', () => {
      const input = [
        '3.2.2. Item A',
        '3.2.3. Item B',
      ].join('\n');
      const output = normalizeHierarchicalNumbering(input);
      // Depth-3 items should be indented 8 spaces, with correct start numbers
      // Parent placeholders should be emitted for depth 1 (3.) and depth 2 (2.)
      const lines = output.split('\n');
      // Should have placeholder parents + actual items
      expect(lines).toContain('3. \u200B');
      expect(lines).toContain('    2. \u200B');
      expect(lines).toContain('        2. Item A');
      expect(lines).toContain('        3. Item B');
    });

    it('does not emit placeholders when parents already exist', () => {
      const input = [
        '1. Parent',
        '1.1. Child A',
        '1.2. Child B',
      ].join('\n');
      const output = normalizeHierarchicalNumbering(input);
      const lines = output.split('\n');
      expect(lines).toEqual([
        '1. Parent',
        '    1. Child A',
        '    2. Child B',
      ]);
    });

    it('handles simple non-hierarchical numbers unchanged', () => {
      const input = [
        '1. First',
        '2. Second',
        '3. Third',
      ].join('\n');
      const output = normalizeHierarchicalNumbering(input);
      expect(output).toBe('1. First\n2. Second\n3. Third');
    });

    it('preserves bullet lines without interference', () => {
      const input = [
        '1. First',
        '- bullet',
        '2. Second',
      ].join('\n');
      const output = normalizeHierarchicalNumbering(input);
      expect(output).toBe('1. First\n- bullet\n2. Second');
    });

    it('does not emit duplicate placeholders when text interrupts hierarchical items', () => {
      const input = [
        '3. Parent',
        '3.1. Child A',
        '3.2. Child B',
        '',
        '3.2.1. Deep item',
        '',
        '→ Some text here',
        '',
        '3.2.2. Next deep item',
      ].join('\n');
      const output = normalizeHierarchicalNumbering(input);
      // Regular text should NOT cause placeholder re-emission
      expect(output).not.toContain('\u200B');
      expect(output).toContain('        2. Next deep item');
    });

    it('resets tracking on heading lines', () => {
      const input = [
        '3. Third item',
        '## New Section',
        '1. First in new section',
      ].join('\n');
      const output = normalizeHierarchicalNumbering(input);
      expect(output).toBe('3. Third item\n## New Section\n1. First in new section');
    });

    it('handles real-world mixed hierarchical + bullet content', () => {
      const input = [
        '3. Cálculo de entrega',
        '3.1. Paso uno',
        '3.2. Ajustes:',
        '3.2.1. Si condición A:',
        '- bullet uno',
        '- bullet dos',
        '→ Resultado',
        '3.2.2. Si condición B:',
        '- bullet tres',
        '3.2.3. Si condición C:',
      ].join('\n');
      const output = normalizeHierarchicalNumbering(input);
      const lines = output.split('\n');
      // No phantom placeholders anywhere
      expect(output).not.toContain('\u200B');
      // Correct indentation and numbering
      expect(lines[0]).toBe('3. Cálculo de entrega');
      expect(lines[1]).toBe('    1. Paso uno');
      expect(lines[2]).toBe('    2. Ajustes:');
      expect(lines[3]).toBe('        1. Si condición A:');
      expect(lines[7]).toBe('        2. Si condición B:');
      expect(lines[9]).toBe('        3. Si condición C:');
    });
  });

  describe('mixed numbered and bullet lists', () => {
    it('bullet points do not reset numbered list counters in toSingleLine', () => {
      const input = [
        '1. First',
        '2. Second',
        '- bullet item',
        '3. Third',
      ].join('\n');
      const output = toSingleLine(input, defaultOptions);
      // The numbered list should continue: 1, 2, then 3 (not reset to 1)
      expect(output).toBe('1. First\\n2. Second\\n- bullet item\\n3. Third');
    });

    it('bullet points between hierarchical items preserve continuity', () => {
      const input = [
        '1. Parent',
        '    1. Child',
        '- interruption',
        '    2. Next child',
      ].join('\n');
      const output = toSingleLine(input, defaultOptions);
      expect(output).toContain('1.2. Next child');
    });
  });

  describe('round-trip fidelity', () => {
    it('single-line → multi-line → single-line preserves hierarchical numbering', () => {
      const original = '1. Parent\\n1.1. Child\\n1.1.1. Grandchild\\n1.2. Sibling';
      const multiLine = toMultiLine(original, defaultOptions);
      const backToSingle = toSingleLine(multiLine, defaultOptions);
      expect(backToSingle).toBe(original);
    });

    it('round-trip preserves numbering with higher start values', () => {
      const original = '3. Third\\n3.1. Sub A\\n3.2. Sub B';
      const multiLine = toMultiLine(original, defaultOptions);
      const backToSingle = toSingleLine(multiLine, defaultOptions);
      expect(backToSingle).toBe(original);
    });
  });
});
