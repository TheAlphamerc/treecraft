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

describe('fs-utils', () => {
  const testDir = join(baseTestDir, 'fs-utils');

  beforeEach(() => {
    jest.clearAllMocks();
    (mkdirSync as jest.Mock).mockImplementation(() => { });
    (existsSync as jest.Mock).mockReturnValue(false); // Default: files don't exist
    (writeFileSync as jest.Mock).mockImplementation(() => { });
    (readFileSync as jest.Mock).mockImplementation((path) => 'mocked content');
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

    it('handles empty directories', () => {
      (readdirSync as jest.Mock).mockReturnValue([]);
      const tree = buildTree(testDir, {});
      expect(tree).toEqual({});
    });

    it('respects depth limit', () => {
      (readdirSync as jest.Mock).mockImplementation((path) => {
        if (path === testDir) return ['dir1'];
        if (path === join(testDir, 'dir1')) return ['dir2'];
        if (path === join(testDir, 'dir1', 'dir2')) return ['file.txt'];
        return [];
      });
      (statSync as jest.Mock).mockImplementation((path) => ({
        isDirectory: () => !path.endsWith('.txt'),
        size: 0,
        mtime: new Date('2023-01-01'),
      }));

      // Depth 1 should include only first level directory
      const tree1 = buildTree(testDir, { depth: 1 });
      expect(tree1).toEqual({ 'dir1': {} });

      // Depth 2 should include first and second level
      const tree2 = buildTree(testDir, { depth: 2 });
      expect(tree2).toEqual({ 'dir1': { 'dir2': {} } });

      // Depth 3 should include all levels
      const tree3 = buildTree(testDir, { depth: 3 });
      expect(tree3).toEqual({ 'dir1': { 'dir2': { 'file.txt': null } } });
    });

    it('handles edge case with exclusion patterns', () => {
      (readdirSync as jest.Mock).mockReturnValue(['file.txt', 'file.js', 'node_modules']);
      (statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });

      const tree = buildTree(testDir, { exclude: ['node_modules', '.git'] });
      expect(tree).toEqual({
        'file.txt': null,
        'file.js': null
      });
    });

    it('handles extremely deep nested structures with multiple branches', () => {
      // Mock a complex directory structure with multiple branches and depth
      (readdirSync as jest.Mock).mockImplementation((path) => {
        if (path === testDir) return ['branch1', 'branch2', 'file.txt'];
        if (path === join(testDir, 'branch1')) return ['sub1', 'sub2'];
        if (path === join(testDir, 'branch2')) return ['sub3', 'sub4'];
        if (path === join(testDir, 'branch1', 'sub1')) return ['subsub1', 'file1.txt'];
        if (path === join(testDir, 'branch1', 'sub2')) return ['file2.txt'];
        if (path === join(testDir, 'branch2', 'sub3')) return ['subsub2', 'file3.txt'];
        if (path === join(testDir, 'branch2', 'sub4')) return ['subsub3', 'file4.txt'];
        if (path === join(testDir, 'branch1', 'sub1', 'subsub1')) return ['deep.txt'];
        if (path === join(testDir, 'branch2', 'sub3', 'subsub2')) return ['deep.txt'];
        if (path === join(testDir, 'branch2', 'sub4', 'subsub3')) return ['deep.txt'];
        return [];
      });

      (statSync as jest.Mock).mockImplementation((path) => ({
        isDirectory: () => !path.endsWith('.txt'),
        size: 10,
        mtime: new Date('2023-01-01'),
      }));

      // Test with unlimited depth
      const tree = buildTree(testDir, {});

      // Verify the structure matches what we expect
      expect(tree).toEqual({
        'branch1': {
          'sub1': {
            'subsub1': {
              'deep.txt': null
            },
            'file1.txt': null
          },
          'sub2': {
            'file2.txt': null
          }
        },
        'branch2': {
          'sub3': {
            'subsub2': {
              'deep.txt': null
            },
            'file3.txt': null
          },
          'sub4': {
            'subsub3': {
              'deep.txt': null
            },
            'file4.txt': null
          }
        },
        'file.txt': null
      });

      // Test with depth limit of 2
      const limitedTree = buildTree(testDir, { depth: 2 });
      expect(limitedTree).toEqual({
        'branch1': {
          'sub1': {},
          'sub2': {}
        },
        'branch2': {
          'sub3': {},
          'sub4': {}
        },
        'file.txt': null
      });
    });

    it('handles boundary depth limit values', () => {
      // Setup a simple directory structure
      (readdirSync as jest.Mock).mockImplementation((path) => {
        if (path === testDir) return ['dir1', 'file1.txt'];
        if (path === join(testDir, 'dir1')) return ['dir2', 'file2.txt'];
        if (path === join(testDir, 'dir1', 'dir2')) return ['file3.txt'];
        return [];
      });

      (statSync as jest.Mock).mockImplementation((path) => ({
        isDirectory: () => !path.endsWith('.txt'),
        size: 10,
        mtime: new Date('2023-01-01'),
      }));

      // Test with depth 0 (should return empty object)
      const tree0 = buildTree(testDir, { depth: 0 });
      expect(tree0).toEqual({});

      // Test with negative depth (should be treated as 0)
      const treeNegative = buildTree(testDir, { depth: -5 });
      expect(treeNegative).toEqual({});

      // Test with depth 1
      const tree1 = buildTree(testDir, { depth: 1 });
      expect(tree1).toEqual({
        'dir1': {},
        'file1.txt': null
      });

      // Test with extremely large depth (should function like unlimited)
      const treeLarge = buildTree(testDir, { depth: 1000 });
      expect(treeLarge).toEqual({
        'dir1': {
          'dir2': {
            'file3.txt': null
          },
          'file2.txt': null
        },
        'file1.txt': null
      });

      // Test with undefined depth (should be unlimited)
      const treeUndefined = buildTree(testDir, {});
      expect(treeUndefined).toEqual({
        'dir1': {
          'dir2': {
            'file3.txt': null
          },
          'file2.txt': null
        },
        'file1.txt': null
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

    it('throws error when trying to overwrite existing file without options', () => {
      (existsSync as jest.Mock).mockReturnValue(true); // File exists
      const tree: FileNode = { 'file.txt': 'new' };
      expect(() => generateStructure(tree, testDir, {})).toThrow("File '");
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

    it('handles empty tree', () => {
      const stats = computeStats({});
      expect(stats).toEqual({
        files: 0,
        dirs: 0,
        totalSize: 0
      });
    });

    it('properly calculates size distribution', () => {
      const tree: FileNode = {
        'small.txt': { type: 'file', size: 100, mtime: '2023-01-01T00:00:00.000Z' },
        'medium.txt': { type: 'file', size: 500000, mtime: '2023-01-01T00:00:00.000Z' },
        'large.txt': { type: 'file', size: 5000000, mtime: '2023-01-01T00:00:00.000Z' },
      };
      const stats = computeStats(tree, { sizeDist: true });
      expect(stats.sizeDist).toEqual({
        '<1KB': 1,
        '1KB-1MB': 1,
        '>1MB': 1
      });
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

    it('handles empty tree', () => {
      const results = searchTree({}, 'file', { basePath: testDir });
      expect(results).toEqual([]);
    });

    it('handles case insensitive search', () => {
      const tree: FileNode = {
        'File.txt': null,
        'file.js': null,
      };
      const results = searchTree(tree, 'FILE', { basePath: testDir });
      expect(results).toEqual([join(testDir, 'File.txt'), join(testDir, 'file.js')]);
    });

    it('handles nested directory with same name as search term', () => {
      const tree: FileNode = {
        'file': { 'nested.txt': null }
      };
      const results = searchTree(tree, 'file', { basePath: testDir });
      expect(results).toEqual([]);  // Should not match directory names
    });

    it('handles paths with special characters', () => {
      const tree: FileNode = {
        'file with spaces.txt': null,
        'special_chars!@#$.txt': null,
        'folder with spaces': {
          'nested file.txt': null
        },
        'international_Привет_你好.txt': null,
        'path/with/slashes.txt': null
      };

      // Test searching by part of names with spaces
      const results1 = searchTree(tree, 'spaces', { basePath: testDir });
      expect(results1).toContain(join(testDir, 'file with spaces.txt'));
      expect(results1).not.toContain(join(testDir, 'folder with spaces'));

      // Test searching by special characters
      const results2 = searchTree(tree, 'special', { basePath: testDir });
      expect(results2).toContain(join(testDir, 'special_chars!@#$.txt'));

      // Test searching in nested folders with spaces
      const results3 = searchTree(tree, 'nested', { basePath: testDir });
      expect(results3).toContain(join(testDir, 'folder with spaces', 'nested file.txt'));

      // Test searching with international characters
      const results4 = searchTree(tree, 'Привет', { basePath: testDir });
      expect(results4).toContain(join(testDir, 'international_Привет_你好.txt'));

      // Test searching with forward slashes in filenames
      const results5 = searchTree(tree, 'slashes', { basePath: testDir });
      expect(results5).toContain(join(testDir, 'path/with/slashes.txt'));
    });
  });
});