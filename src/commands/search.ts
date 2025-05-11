import { Command } from 'commander';
import { buildTree, searchTree } from '../lib/fs-utils';
import { formatSearchResults, formatTree } from '../lib/formatters';
import { FileMetadata, FileNode } from '../types';
import { statSync } from 'fs';
import chalk from 'chalk';
import { withErrorHandling, validateDirectory, ValidationError } from '../lib/errors';

/**
 * Command for searching files by name in a directory
 * 
 * This command searches for files matching a query string in their names
 * within a directory structure. Results can be filtered by extension,
 * limited by depth, and exported in various formats.
 * 
 * Usage: treecraft search [path] <query> [options]
 */
export const searchCommand = new Command()
  .name('search')
  .description('Search files by name or content')
  .argument('[path]', 'Directory to search', '.')
  .argument('<query>', 'Search term')
  .option('-f, --filter <patterns>', 'Include only patterns (comma-separated)')
  .option('-t, --ext <extension>', 'Filter by file extension (e.g. .ts, .js)')
  .option('-d, --depth <n>', 'Limit tree depth')
  .option('-e, --exclude <patterns>', 'Exclude patterns (comma-separated)')
  .option('-x, --export <format>', 'Export format (text, json, yaml)')
  .action(withErrorHandling((path, query, options) => {
    // Validate directory exists
    validateDirectory(path);

    // Validate query
    if (!query || query.trim() === '') {
      throw new ValidationError('Search query cannot be empty');
    }

    // Validate export format if provided
    if (options.export && !['text', 'json', 'yaml'].includes(options.export)) {
      throw new ValidationError(`Invalid export format: '${options.export}'. Use 'text', 'json', or 'yaml'.`);
    }

    // Build tree with minimal metadata unless content search is needed
    const tree = buildTree(path, {
      depth: options.depth ? Number(options.depth) : Infinity,
      filter: options.filter ? options.filter.split(',').map((p: string) => p.trim()) : [],
      exclude: options.exclude ? options.exclude.split(',').map((p: string) => p.trim()) : [],
    });

    const results = searchTree(tree, query, {
      ext: options.ext ? options.ext.replace(/^\*\./, '.') : undefined, // Normalize *.ts to .ts
      basePath: path,
    });

    const output = formatSearchResults(results, options);
    console.log(output);
  }));