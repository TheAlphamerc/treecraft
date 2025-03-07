import { FileMetadata, FileNode } from '../types';

/**
 * checks each item (file or directory) at its current level against the filter patterns
 */
export function matchesFilters(item: string, filterPatterns: string[]): boolean {
  if (filterPatterns.length === 0) {
    return true;
  }
  return filterPatterns.some((pattern) => {
    if (pattern.startsWith('*.')) {
      return item.endsWith(pattern.slice(1));
    }
    return item === pattern || item.startsWith(pattern);
  });
}

/**
 * Recursively traverses the tree.
 * Includes a file if it matches a filter pattern (e.g., *.ts).
 * Includes a directory if it matches OR if any of its descendants match, preserving the hierarchy.
 */
export function filterTree(tree: FileNode | FileMetadata, filterPatterns: string[]): FileNode {
  const filtered: FileNode = {};

  for (const [key, value] of Object.entries(tree)) {
    const isFile = value === null || (typeof value === 'object' && 'type' in value && value.type === 'file');
    const isDir = typeof value === 'object' && !isFile;

    // Check if the item itself matches the filter
    const itemMatches = matchesFilters(key, filterPatterns);

    if (isFile) {
      // For files, include only if it matches the filter
      if (itemMatches) {
        filtered[key] = value;
      }
    } else if (isDir) {
      // For directories, recurse and include if it or any descendant matches
      const subtree = filterTree(value?.children || value, filterPatterns);
      const hasMatchingDescendants = Object.keys(subtree).length > 0;

      if (itemMatches || hasMatchingDescendants) {
        if ('type' in value) {
          // Preserve metadata if present
          filtered[key] = { ...value, children: subtree };
        } else {
          filtered[key] = subtree;
        }
      }
    }
  }

  return filtered;
}