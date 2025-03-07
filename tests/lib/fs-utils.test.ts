import { buildTree, generateStructure, computeStats, searchTree, } from '../../src/lib/fs-utils';
import { readdirSync, statSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { baseTestDir } from '../setup';
import { FileNode } from '../../src/types';

// Mock fs module
jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// Mock process.exit globally and ensure it throws
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
  throw new Error(`process.exit called with code ${code}`);
});

describe('fs-utils', () => {
  const testDir = join(baseTestDir, 'fs-utils');

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks but keep mockExit intact
    (mkdirSync as jest.Mock).mockImplementation(() => { });
    (existsSync as jest.Mock).mockReturnValue(false); // Default: files don’t exist
    (writeFileSync as jest.Mock).mockImplementation(() => { });
    (readFileSync as jest.Mock).mockImplementation((path) => 'mocked content');
  });

  afterAll(() => {
    mockExit.mockRestore(); // Clean up global mock
  });

  describe('buildTree', () => {
    it('builds a tree with files and directories', () => {
      (readdirSync as jest.Mock).mockImplementation((path) => {
        if (path === testDir) return ['file1.txt', 'dir1'];
        if (path === join(testDir, 'dir1')) return ['file2.txt'];
        return [];
      });
      (statSync as jest.Mock).mockImplementation((path) => ({
        isDirectory: () => path.endsWith('dir1'),
        size: path.endsWith('file1.txt') ? 10 : 20,
        mtime: new Date('2023-01-01'),
      }));

      const tree = buildTree(testDir, {});
      expect(tree).toEqual({
        'file1.txt': null,
        'dir1': { 'file2.txt': null },
      });
    });

    it('filters with patterns', () => {
      (readdirSync as jest.Mock).mockReturnValue(['file1.ts', 'file2.js']);
      (statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });

      const tree = buildTree(testDir, { filter: ['*.ts'] });
      expect(tree).toEqual({ 'file1.ts': null });
    });

    it('includes metadata when requested', () => {
      (readdirSync as jest.Mock).mockReturnValue(['file1.txt']);
      (statSync as jest.Mock).mockReturnValue({
        isDirectory: () => false,
        size: 10,
        mtime: new Date('2023-01-01'),
      });

      const tree = buildTree(testDir, { withMetadata: true });
      expect(tree['file1.txt']).toMatchObject({
        type: 'file',
        size: 10,
        mtime: '2023-01-01T00:00:00.000Z',
      });
    });
  });

  describe('generateStructure', () => {
    it('generates a directory structure', () => {
      const tree: FileNode = { src: { 'main.ts': 'content' } };
      (existsSync as jest.Mock).mockReturnValue(false); // No existing files

      generateStructure(tree, testDir, {});
      expect(writeFileSync).toHaveBeenCalledWith(join(testDir, 'src', 'main.ts'), 'content', 'utf-8');
    });

    it('skips existing with skipAll', () => {
      (existsSync as jest.Mock).mockReturnValue(true); // File exists
      (readFileSync as jest.Mock).mockReturnValue('old');

      const tree: FileNode = { 'file.txt': 'new' };
      generateStructure(tree, testDir, { skipAll: true });
      expect(writeFileSync).not.toHaveBeenCalled();
      expect(readFileSync(join(testDir, 'file.txt'), 'utf-8')).toBe('old');
    });

    it('overwrites existing with overwriteAll', () => {
      (existsSync as jest.Mock).mockReturnValue(true); // File exists

      const tree: FileNode = { 'file.txt': 'new' };
      generateStructure(tree, testDir, { overwriteAll: true });
      expect(writeFileSync).toHaveBeenCalledWith(join(testDir, 'file.txt'), 'new', 'utf-8');
    });

    it('handles existing file without overwrite or skip by throwing', () => {
      (existsSync as jest.Mock).mockReturnValue(true); // File exists
      const tree: FileNode = { 'file.txt': 'new' };
      expect(() => generateStructure(tree, testDir, {})).toThrow('process.exit called with code 1');
    });
  });

  describe('computeStats', () => {
    it('computes stats for a tree', () => {
      const tree: FileNode = {
        'file1.txt': { type: 'file', size: 10, mtime: '2023-01-01T00:00:00.000Z' },
        'dir': { 'file2.js': { type: 'file', size: 20, mtime: '2023-01-01T00:00:00.000Z' } },
      };
      const stats = computeStats(tree);
      expect(stats).toMatchObject({
        files: 2,
        dirs: 1,
        totalSize: 30,
      });
      // Conditionally check optional fields
      if (stats.fileTypes) expect(stats.fileTypes).toEqual({ '.txt': 1, '.js': 1 });
      if (stats.sizeDist) expect(stats.sizeDist).toEqual({ '<1KB': 2, '1KB-1MB': 0, '>1MB': 0 });
    });
  });

  describe('searchTree', () => {
    it('searches for files by name', () => {
      const tree: FileNode = {
        'file1.txt': null,
        'dir': { 'file2.txt': null },
      };
      const results = searchTree(tree, 'file', { basePath: testDir });
      expect(results).toEqual([join(testDir, 'file1.txt'), join(testDir, 'dir', 'file2.txt')]);
    });

    it('filters by extension', () => {
      const tree: FileNode = {
        'file1.txt': null,
        'file2.js': null,
      };
      const results = searchTree(tree, 'file', { basePath: testDir, ext: '.txt' });
      expect(results).toEqual([join(testDir, 'file1.txt')]);
    });
  });
});