/**
 * Represents a directory tree structure
 * 
 * This is the core data structure used throughout the application to represent
 * files and directories. Each key is a file/directory name, and each value is either:
 * - A nested FileNode object (for directories without metadata)
 * - null (for files without metadata)
 * - string (for files with content)
 * - FileMetadata object (for files/directories with metadata)
 */
export interface FileNode {
  [key: string]: FileNode | string | null | FileMetadata;
}

/**
 * Options for the visualization command
 */
export interface VizOptions {
  /** Visualization mode to use */
  mode?: 'tree' | 'graph' | 'list' | 'interactive';
  /** Maximum depth to display */
  depth?: number;
  /** Patterns to exclude (comma-separated) */
  exclude?: string;
  /** Whether to use colored output */
  color?: boolean;
  /** Format to export the data in */
  export?: 'text' | 'json' | 'yaml';
}

/**
 * Metadata for a file or directory
 * 
 * Used when detailed information about files and directories
 * is requested, such as with the --with-metadata flag.
 */
export interface FileMetadata {
  /** Type of the filesystem item */
  type: 'file' | 'directory';
  /** Size in bytes */
  size: number;
  /** Last modified timestamp (ISO string) */
  mtime: string;
  /** For directories, the contained files/subdirectories */
  children?: FileNode;
  /** For search results or file content storage */
  content?: string;
}

/**
 * Statistics about a directory structure
 * 
 * Contains aggregate information collected by the stats command,
 * including counts, sizes, and classifications of files.
 */
export interface Stats {
  /** Total number of files found */
  files: number;
  /** Total number of directories found */
  dirs: number;
  /** Total size of all files in bytes */
  totalSize: number;
  /** Count of files by file extension */
  fileTypes?: { [ext: string]: number };
  /** Distribution of files by size category */
  sizeDist?: { '<1KB': number; '1KB-1MB': number; '>1MB': number };
}