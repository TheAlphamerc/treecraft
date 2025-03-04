import { dump } from 'js-yaml';

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