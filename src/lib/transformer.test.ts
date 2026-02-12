import { describe, it, expect } from 'vitest';
import { keepOnlyNewlineEscapes, toSingleLine, toMultiLine } from './transformer';
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
});
