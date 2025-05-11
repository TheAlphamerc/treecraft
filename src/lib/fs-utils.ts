import { readdirSync, statSync } from 'fs';
import { extname, join } from 'path';
import { FileMetadata, FileNode, Stats } from '../types';
import { filterTree } from './filters';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

/**
 * Recursively builds a directory tree structure
 * 
 * @param dir - The directory path to traverse
 * @param options - Configuration options
 * @param options.depth - Maximum depth to traverse (default: Infinity)
 * @param options.exclude - Patterns to exclude from the tree
 * @param options.filter - Patterns to include in the tree
 * @param options.withMetadata - Whether to include file metadata (size, modified time)
 * @returns A tree representing the directory structure
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
 * Counts the total number of files in a directory tree
 * 
 * @param tree - The directory tree to analyze
 * @returns The total count of files
 */
export function countFiles(tree: FileNode | FileMetadata | null): number {
  if (!tree || tree === null) return 0;
  if (typeof tree === 'string') return 1;
  return Object.values(tree).reduce((acc, val) => acc + (typeof val === 'object' ? countFiles(val) : 1), 0);
}

/**
 * Calculates the total size of all files in a directory tree
 * 
 * @param tree - The directory tree to analyze
 * @returns The total size in bytes
 */
export function calcTotalSize(tree: FileNode | FileMetadata | null): number {
  if (!tree || tree === null) return 0;
  if (typeof tree === 'string') return 1;
  return Object.values(tree).reduce((acc, val) => acc + (typeof val === 'object' ? calcTotalSize(val) : 0), 0);
}

/**
 * Generates a directory structure from a specification
 * 
 * @param spec - The specification of the directory structure to create
 * @param output - The output directory where the structure will be created
 * @param options - Configuration options
 * @param options.skipAll - Skip creation if files/directories already exist
 * @param options.overwriteAll - Overwrite files/directories if they already exist
 * @throws Will throw an error if a conflict is found and no resolution option is provided
 */
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
          throw new Error(`Directory '${fullPath}' exists and no conflict flag provided`);
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
          throw new Error(`File '${fullPath}' exists and no conflict flag provided`);
        }
      }
      const fileContent = content !== null ? content : '';
      writeFileSync(fullPath, fileContent, 'utf-8');
    }
  }
}

/**
 * Computes statistics about a directory tree
 * 
 * @param tree - The directory tree to analyze
 * @param options - Configuration options
 * @param options.sizeDist - Whether to include size distribution statistics
 * @param options.fileTypes - Whether to include file type breakdown
 * @param options.sort - How to sort size distribution (by size or count)
 * @returns Statistics about the directory tree
 */
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

  /**
   * Recursively traverse the directory tree to compute statistics
   * 
   * @param node - The current node in the tree (file or directory)
   * @private
   */
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

/**
 * Searches a directory tree for files matching a query
 * 
 * @param tree - The directory tree to search
 * @param query - The search term to look for in filenames
 * @param options - Search options
 * @param options.ext - Filter results by file extension (e.g. '.ts')
 * @param options.basePath - The base path to use when returning results
 * @returns An array of file paths that match the search criteria
 */
export function searchTree(tree: FileNode | FileMetadata, query: string, options: {
  ext?: string;
  basePath: string
}): string[] {
  const results: string[] = [];
  const queryLower = query.toLowerCase();

  /**
   * Recursively traverse the directory tree to find matching files
   * 
   * @param node - The current node in the tree (file or directory)
   * @param currentPath - The path to the current node
   * @private
   */
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