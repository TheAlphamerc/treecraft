import { dump } from 'js-yaml';
import { FileNode, Stats } from '../types';
import chalk from 'chalk';
import { sep } from 'path';

/**
 * Formats a directory tree into different output formats
 * 
 * @param tree - The directory tree to format
 * @param options - Formatting options
 * @param options.export - Export format: 'json', 'yaml', or undefined for ASCII tree
 * @param options.withMetadata - Whether to include metadata (size, modified time) in the output
 * @returns Formatted string representation of the tree
 */
export function formatTree(tree: any, options: { export?: string; withMetadata?: boolean }): string {
  if (options.export === 'json') {
    return JSON.stringify(tree, null, 2);
  }
  if (options.export === 'yaml') {
    return dump(tree);
  }
  return buildAsciiTree(tree, options.withMetadata);
}

/**
 * Builds an ASCII tree representation of a directory tree
 * 
 * @param tree - The directory tree to format
 * @param withMetadata - Whether to include metadata (size, modified time) in the output
 * @param prefix - Line prefix for indentation (used in recursion)
 * @returns ASCII tree representation as a string
 * @private
 */
function buildAsciiTree(tree: any, withMetadata?: boolean, prefix = ''): string {
  let result = '';
  const keys = Object.keys(tree);
  keys.forEach((key, i) => {
    const isLast = i === keys.length - 1;
    const node = tree[key];
    let line = `${prefix}${isLast ? '└── ' : '├── '}${key}`;

    // Add metadata if requested and available
    if (withMetadata && node && typeof node === 'object' && 'size' in node) {
      const size = formatSize(node.size);
      const mtime = new Date(node.mtime).toLocaleDateString();
      line += ` (${node.type === 'file' ? 'F' : 'D'}, ${size}, ${mtime})`;
    }
    result += `${line}\n`;

    // Recurse into children for directories
    if (node && 'children' in node && node.children) {
      result += buildAsciiTree(node.children, withMetadata, prefix + (isLast ? '    ' : '│   '));
    } else if (typeof node === 'object' && node !== null && !('size' in node)) {
      result += buildAsciiTree(node, withMetadata, prefix + (isLast ? '    ' : '│   '));
    }
  });
  return result;
}

/**
 * Formats directory statistics information
 * 
 * @param stats - The statistics object to format
 * @param options - Formatting options
 * @param options.export - Export format: 'json', 'yaml', or undefined for text table
 * @param options.sort - How to sort size distribution (by 'size' or 'count')
 * @returns Formatted string representation of the statistics
 */
export function formatStats(stats: Stats, options: { export?: string; sort?: string }): string {
  if (options.export === 'json') return JSON.stringify(stats, null, 2);
  if (options.export === 'yaml') return dump(stats);

  let output = `Files: ${stats.files}, Dirs: ${stats.dirs}, Total Size: ${formatSize(stats.totalSize)}`;

  if (stats.sizeDist) {
    const dist = stats.sizeDist;
    const sorted = options.sort === 'size'
      ? [
        ['>1MB', dist['>1MB']],
        ['1KB-1MB', dist['1KB-1MB']],
        ['<1KB', dist['<1KB']]
      ]
      : [
        ['<1KB', dist['<1KB']],
        ['1KB-1MB', dist['1KB-1MB']],
        ['>1MB', dist['>1MB']]
      ];
    output += '\nSize Distribution:\n';
    output += '+------------+-------+\n';
    output += '| Range      | Count |\n';
    output += '+------------+-------+\n';
    sorted.forEach(([range, count]) => {
      output += `| ${range.toString().padEnd(10)} | ${count.toString().padEnd(5)} |\n`;
    });
    output += '+------------+-------+\n';
  }

  if (stats.fileTypes) {
    const types = Object.entries(stats.fileTypes).sort((a, b) => b[1] - a[1]); // Sort by count desc
    output += '\nFile Types:\n';
    output += '+----------+-------+\n';
    output += '| Extension| Count |\n';
    output += '+----------+-------+\n';
    types.forEach(([ext, count]) => {
      output += `| ${ext.padEnd(8)} | ${count.toString().padEnd(5)} |\n`;
    });
    output += '+----------+-------+\n';
  }

  return output;
}

/**
 * Formats search results in different output formats
 * 
 * @param results - Array of file paths that match the search criteria
 * @param options - Formatting options
 * @param options.export - Export format: 'json', 'yaml', or undefined for plain text
 * @returns Formatted string representation of the search results
 */
export function formatSearchResults(results: string[], options: { export?: string }): string {
  if (options.export === 'json') return JSON.stringify(results, null, 2);
  if (options.export === 'yaml') {
    const tree = buildResultTree(results);
    return dump(tree, { indent: 2 });
  }

  if (results.length === 0) return chalk.yellow('No matches found.');
  return chalk.yellow('Search Results:\n') + results.map(path => chalk.green(path)).join('\n');
}

/**
 * Builds a directory tree structure from a list of file paths
 * 
 * @param paths - Array of file paths to convert into a tree structure
 * @returns A tree representation of the paths
 * @private
 */
function buildResultTree(paths: string[]): FileNode {
  const tree: FileNode = {};
  paths.forEach(path => {
    const parts = path.split(sep).filter(part => part); // Split by path separator, remove empty
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = null; // File
      } else {
        current[part] = current[part] || {}; // Directory
        current = current[part] as FileNode;
      }
    }
  });
  return tree;
}

/**
 * Formats a file size in bytes to a human-readable string
 * 
 * @param bytes - The file size in bytes
 * @returns A human-readable string (e.g., "1.5KB", "10.2MB")
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
}