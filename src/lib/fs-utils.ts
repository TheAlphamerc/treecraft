import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { FileMetadata, FileNode } from '../types';
import { filterTree } from './filters';

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