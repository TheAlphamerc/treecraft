import { FileMetadata, FileNode } from '../types';

/**
 * Checks if an item name matches any of the provided filter patterns
 * 
 * @param item - The file or directory name to check
 * @param filterPatterns - Array of patterns to match against
 *   - "*.ext" matches files with the given extension (e.g., "*.ts" matches "file.ts")
 *   - "name" matches exact name (e.g., "README.md" matches only "README.md")
 *   - "prefix" matches items starting with prefix (e.g., "test" matches "test_file.js", "testing.ts")
 * 
 * @example
 * // Match TypeScript files
 * matchesFilters("file.ts", ["*.ts"]) // returns true
 * matchesFilters("file.js", ["*.ts"]) // returns false
 * 
 * @example
 * // Match exact name
 * matchesFilters("package.json", ["package.json"]) // returns true
 * 
 * @example
 * // Match by prefix
 * matchesFilters("test_file.js", ["test"]) // returns true
 * 
 * @returns True if the item matches any pattern or if no patterns are provided
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
 * Filters a directory tree based on the provided patterns
 * 
 * This function recursively traverses the tree and:
 * - Includes a file if it matches a filter pattern (e.g., *.ts)
 * - Includes a directory if it matches OR if any of its descendants match
 * - Preserves the hierarchy of matched items
 * 
 * @param tree - The directory tree to filter
 * @param filterPatterns - Array of patterns to filter with
 * @returns A new tree containing only the items that match the filter criteria
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