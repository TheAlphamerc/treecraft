export interface FileNode {
  [key: string]: FileNode | string | null | FileMetadata;
}

export interface VizOptions {
  mode?: 'tree' | 'graph' | 'list' | 'interactive';
  depth?: number;
  exclude?: string;
  color?: boolean;
  export?: 'text' | 'json' | 'yaml';
}

export interface FileMetadata {
  type: 'file' | 'directory';
  size: number; // Size in bytes
  mtime: string; // Last modified time (ISO string)
  children?: FileNode; // For directories
  content?: string; // For search results
}

export interface Stats {
  files: number;
  dirs: number;
  totalSize: number;
  fileTypes?: { [ext: string]: number };
  sizeDist?: { '<1KB': number; '1KB-1MB': number; '>1MB': number };
}