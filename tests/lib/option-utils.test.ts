// Mock the errors module before any imports
jest.mock('../../src/lib/errors', () => ({
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  }
}));

import {
  processPatterns,
  validateExportFormat,
  getDepthValue,
  validateTreeMode,
  validateSortOption
} from '../../src/lib/option-utils';

describe('option-utils', () => {
  describe('processPatterns', () => {
    it('processes comma-separated patterns', () => {
      expect(processPatterns('*.ts,*.js')).toEqual(['*.ts', '*.js']);
      expect(processPatterns(' file.txt , README.md ')).toEqual(['file.txt', 'README.md']);
    });

    it('handles undefined patterns', () => {
      expect(processPatterns(undefined)).toEqual([]);
    });

    it('handles empty patterns', () => {
      // The current implementation actually returns an empty array for an empty string
      expect(processPatterns('')).toEqual([]);
    });
  });

  describe('validateExportFormat', () => {
    it('accepts valid export formats', () => {
      expect(() => validateExportFormat('text')).not.toThrow();
      expect(() => validateExportFormat('json')).not.toThrow();
      expect(() => validateExportFormat('yaml')).not.toThrow();
      expect(() => validateExportFormat(undefined)).not.toThrow();
    });

    it('throws for invalid export formats', () => {
      expect(() => validateExportFormat('invalid')).toThrow();
      expect(() => validateExportFormat('csv')).toThrow();
      expect(() => validateExportFormat('xml')).toThrow();
    });
  });

  describe('getDepthValue', () => {
    it('returns the provided depth value', () => {
      expect(getDepthValue(5)).toBe(5);
      expect(getDepthValue(0)).toBe(0);
      expect(getDepthValue(-1)).toBe(-1);
    });

    it('returns Infinity when depth is undefined', () => {
      expect(getDepthValue(undefined)).toBe(Infinity);
    });
  });

  describe('validateTreeMode', () => {
    it('accepts valid tree modes', () => {
      expect(() => validateTreeMode('tree')).not.toThrow();
      expect(() => validateTreeMode('graph')).not.toThrow();
      expect(() => validateTreeMode('list')).not.toThrow();
      expect(() => validateTreeMode('interactive')).not.toThrow();
      expect(() => validateTreeMode(undefined)).not.toThrow();
    });

    it('throws for invalid tree modes', () => {
      expect(() => validateTreeMode('invalid')).toThrow();
      expect(() => validateTreeMode('ascii')).toThrow();
      expect(() => validateTreeMode('html')).toThrow();
    });
  });

  describe('validateSortOption', () => {
    it('accepts valid sort options', () => {
      expect(() => validateSortOption('size')).not.toThrow();
      expect(() => validateSortOption('count')).not.toThrow();
      expect(() => validateSortOption(undefined)).not.toThrow();
    });

    it('throws for invalid sort options', () => {
      expect(() => validateSortOption('invalid')).toThrow();
      expect(() => validateSortOption('name')).toThrow();
      expect(() => validateSortOption('date')).toThrow();
    });
  });
}); 