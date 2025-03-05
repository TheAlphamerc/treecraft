import { dump } from 'js-yaml';
import { Stats } from '../types';

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
    if (node && typeof node === 'object' && 'children' in node && node.children) {
      result += buildAsciiTree(node.children, withMetadata, prefix + (isLast ? '    ' : '│   '));
    } else if (typeof node === 'object' && node !== null && !('size' in node)) {
      result += buildAsciiTree(node, withMetadata, prefix + (isLast ? '    ' : '│   '));
    }
  });
  return result;
}

// Helper to format file size
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
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