import { readdirSync, statSync } from 'fs';
import { extname, join } from 'path';
import { FileMetadata, FileNode, Stats } from '../types';
import { filterTree } from './filters';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

/**
 * File system utilities for traversal.
 * @param dir Directory to traverse
 * @param options Traversal options
 * @returns Directory tree
 */
export function buildTree(dir: string, options: {
  depth?: number;
  exclude?: string[];
  filter?: string[];
  withMetadata?: boolean
}): FileNode {
  const tree: FileNode = {};
  const items = readdirSync(dir);
  const depth = options.depth !== undefined ? options.depth : Infinity;
  const excludePatterns = options.exclude || [];
  const filterPatterns = options.filter || [];
  const withMetadata = options.withMetadata || false;

  if (depth <= 0) return tree;

  for (const item of items) {
    // Skip if excluded
    if (excludePatterns.some((pattern) => item === pattern || item.endsWith(pattern))) {
      continue;
    }

    const fullPath = join(dir, item);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      const subtree = buildTree(fullPath, { ...options, depth: depth - 1 });
      if (withMetadata) {
        tree[item] = {
          type: 'directory',
          size: stats.size,
          mtime: stats.mtime.toISOString(),
          children: subtree,
        };
      } else {
        tree[item] = subtree;
      }
    } else {
      if (withMetadata) {
        tree[item] = {
          type: 'file',
          size: stats.size,
          mtime: stats.mtime.toISOString(),
        };
      } else {
        tree[item] = null;
      }
    }
  }

  // Apply filter to the fully built tree
  return filterPatterns.length > 0 ? filterTree(tree, filterPatterns) : tree;
}

/**
 * Count the number of files in a directory tree
 * @param tree Directory tree
 * @returns Number of files
 */
export function countFiles(tree: FileNode | FileMetadata | null): number {
  if (!tree || tree === null) return 0;
  if (typeof tree === 'string') return 1;
  return Object.values(tree).reduce((acc, val) => acc + (typeof val === 'object' ? countFiles(val) : 1), 0);
}

/**
 * Calculate the total size of files in a directory tree
 * @param tree Directory tree
 * @returns Total size in bytes
 */
export function calcTotalSize(tree: FileNode | FileMetadata | null): number {
  if (!tree || tree === null) return 0;
  if (typeof tree === 'string') return 1;
  return Object.values(tree).reduce((acc, val) => acc + (typeof val === 'object' ? calcTotalSize(val) : 0), 0);
}
export function generateStructure(spec: FileNode | FileMetadata, output: string, options: {
  skipAll?: boolean;
  overwriteAll?: boolean;
}) {
  // Ensure the output directory exists
  if (!existsSync(output)) {
    mkdirSync(output, { recursive: true });
  }

  for (const [name, content] of Object.entries(spec)) {
    const fullPath = join(output, name);

    if (typeof content === 'object' && content !== null) {
      if (existsSync(fullPath)) {
        if (options.skipAll) continue;
        if (!options.overwriteAll) {
          console.error(`Directory '${fullPath}' exists and no conflict flag provided`);
          process.exit(1);
        }
      }
      mkdirSync(fullPath, { recursive: true });
      generateStructure(content, fullPath, options);
    }
    // Handle files
    else {
      if (existsSync(fullPath)) {
        if (options.skipAll) continue;
        if (!options.overwriteAll) {
          console.error(`File '${fullPath}' exists and no conflict flag provided`);
          process.exit(1);
        }
      }
      const fileContent = content !== null ? content : '';
      writeFileSync(fullPath, fileContent, 'utf-8');
    }
  }
}

export function computeStats(tree: FileNode | FileMetadata, options: {
  sizeDist?: boolean;
  fileTypes?: boolean;
  sort?: 'size' | 'count'
} = {}): Stats {
  let files = 0;
  let dirs = 0;
  let totalSize = 0;
  const sizeDist = options.sizeDist ? { '<1KB': 0, '1KB-1MB': 0, '>1MB': 0 } : undefined;
  const fileTypes: any = options.fileTypes ? {} : undefined;

  function traverse(node: FileNode | FileMetadata) {
    for (const [name, value] of Object.entries(node)) {
      if (typeof value === 'object' && value !== null && 'type' in value) {
        if (value.type === 'file') {
          files++;
          totalSize += value.size;
          if (sizeDist) {
            if (value.size < 1024) sizeDist['<1KB']++;
            else if (value.size < 1024 * 1024) sizeDist['1KB-1MB']++;
            else sizeDist['>1MB']++;
          }
          if (fileTypes) {
            const ext = extname(name) || 'no-ext';
            fileTypes[ext] = (fileTypes[ext] || 0) + 1;
          }
        } else if (value.type === 'directory') {
          dirs++;
          traverse(value.children || {});
        }
      } else if (typeof value === 'object' && value !== null) {
        dirs++;
        traverse(value);
      } else if (value === null) {
        files++;
      }
    }
  }

  traverse(tree);
  return { files, dirs, totalSize, sizeDist, fileTypes };
}

export function searchTree(tree: FileNode | FileMetadata, query: string, options: {
  ext?: string;
  basePath: string
}): string[] {
  const results: string[] = [];
  const queryLower = query.toLowerCase();

  function traverse(node: FileNode | FileMetadata, currentPath: string) {
    for (const [name, value] of Object.entries(node)) {
      const fullPath = join(currentPath, name);
      const matchesExt = !options.ext || extname(name) === options.ext;

      if (typeof value === 'object' && value !== null) {
        if ('type' in value && value.type === 'file' && matchesExt) {
          if (name.toLowerCase().includes(queryLower)) {
            results.push(fullPath);
          }
        } else {
          traverse(value.children || value, fullPath);
        }
      } else if (value === null && matchesExt) {
        if (name.toLowerCase().includes(queryLower)) {
          results.push(fullPath);
        }
      }
    }
  }

  traverse(tree, options.basePath);
  return results;
}