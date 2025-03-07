import { dump } from 'js-yaml';
import { FileNode, Stats } from '../types';
import chalk from 'chalk';
import { sep } from 'path';

/**
 * Formats output as text, JSON, or YAML.
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
 * Builds an ASCII tree representation.
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

export function formatSearchResults(results: string[], options: { export?: string }): string {
  if (options.export === 'json') return JSON.stringify(results, null, 2);
  if (options.export === 'yaml') {
    const tree = buildResultTree(results);
    return dump(tree, { indent: 2 });
  }

  if (results.length === 0) return chalk.yellow('No matches found.');
  return chalk.yellow('Search Results:\n') + results.map(path => chalk.green(path)).join('\n');
}
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
// Helper to format file size
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
}