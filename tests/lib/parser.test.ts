import { parseJsonTree, parseTextTree, parseYamlTree } from '../../src/lib/parser';
import { EOL } from 'os';
import chalk from 'chalk';

// Mocking chalk module
jest.mock('chalk', () => ({
  green: jest.fn((text) => `[green]${text}[/green]`),
  red: jest.fn((text) => `[red]${text}[/red]`),
  yellow: jest.fn((text) => `[yellow]${text}[/yellow]`),
  blue: jest.fn((text) => `[blue]${text}[/blue]`),
}));

describe('parser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseJsonTree', () => {
    it('parses valid JSON tree', () => {
      const json = '{"file.txt": null}';
      const result = parseJsonTree(json);
      expect(result).toEqual({ 'file.txt': null });
    });

    it('throws on invalid JSON', () => {
      const invalidJson = '{file: null';
      expect(() => parseJsonTree(invalidJson)).toThrow('Invalid JSON:');
    });
  });

  describe('parseYamlTree', () => {
    it('parses valid YAML tree', () => {
      const yaml = 'file.txt: null';
      const result = parseYamlTree(yaml);
      expect(result).toEqual({ 'file.txt': null });
    });

    it('throws on invalid YAML', () => {
      const invalidYaml = 'file.txt: : invalid';
      expect(() => parseYamlTree(invalidYaml)).toThrow('Invalid YAML:');
    });
  });

  describe('parseTextTree', () => {
    describe('valid structures', () => {
      it('parses basic text tree', () => {
        const text = `├── file.txt${EOL}└── dir${EOL}│   └── sub.txt`;
        const result = parseTextTree(text);
        expect(result).toEqual({ 'file.txt': null, 'dir': { 'sub.txt': null } });
      });

      it('parses complex tree with content', () => {
        const textTree = `├── folder1${EOL}│   ├── file1: content1${EOL}│   └── file2: content2${EOL}└── folder2${EOL}│   ├── file3: content3`;
        expect(parseTextTree(textTree)).toEqual({
          folder1: { file1: 'content1', file2: 'content2' },
          folder2: { file3: 'content3' },
        });
      });

      it('handles empty input', () => {
        const text = '';
        const result = parseTextTree(text);
        expect(result).toEqual({});
      });

      it('parses single file with no nesting', () => {
        const text = `└── file.txt`;
        const result = parseTextTree(text);
        expect(result).toEqual({ 'file.txt': null });
      });

      it('parses deep nesting', () => {
        const text = `├── top${EOL}│   ├── middle${EOL}│   │   └── bottom: deep${EOL}│   └── file.txt${EOL}└── root.txt`;
        const result = parseTextTree(text);
        expect(result).toEqual({
          'top': {
            'middle': { 'bottom': 'deep' },
            'file.txt': null,
          },
          'root.txt': null,
        });
      });

      it('parses mixed items at same level', () => {
        const text = `├── file1.txt${EOL}├── dir${EOL}│   └── sub.txt${EOL}└── file2.txt: content`;
        const result = parseTextTree(text);
        expect(result).toEqual({
          'file1.txt': null,
          'dir': { 'sub.txt': null },
          'file2.txt': 'content',
        });
      });

      it('ignores trailing whitespace and empty lines', () => {
        const text = `${EOL}├── file.txt${EOL}  ${EOL}└── dir${EOL}│   └── sub.txt${EOL}  `;
        const result = parseTextTree(text);
        expect(result).toEqual({ 'file.txt': null, 'dir': { 'sub.txt': null } });
      });

      it('parses directory with no immediate children followed by same-level item', () => {
        const text = `├── dir${EOL}├── file.txt`;
        const result = parseTextTree(text);
        expect(result).toEqual({
          'dir': null,
          'file.txt': null,
        });
      });
    });

    describe('error cases', () => {
      it('throws on invalid structure', () => {
        const invalidText = 'invalid-line';
        expect(() => parseTextTree(invalidText)).toThrow('Invalid tree structure at line 1');
      });

      it('throws on invalid depth jump', () => {
        const text = `├── file.txt${EOL}│   │   └── sub.txt`;
        expect(() => parseTextTree(text)).toThrow('Invalid nesting at line 2');
      });

      it('throws on malformed indentation', () => {
        const text = `├── file.txt${EOL}    └── sub.txt`;
        expect(() => parseTextTree(text)).toThrow('Invalid indentation at line 2');
      });
    });
  });
});