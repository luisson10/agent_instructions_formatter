import { describe, it, expect } from 'vitest';
import { toSingleLine, toMultiLine } from './transformer';
import type { TransformOptions } from './transformer';

const defaultOptions: TransformOptions = {
  normalizeSpaces: false,
  wrapInQuotes: false,
  escapeInternalQuotes: false,
};

describe('Transformer Logic', () => {
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
  });
});

