import { Command } from 'commander';
import { buildTree, searchTree } from '../lib/fs-utils';
import { formatSearchResults, formatTree } from '../lib/formatters';
import { FileMetadata, FileNode } from '../types';
import { statSync } from 'fs';
import chalk from 'chalk';
import { withErrorHandling, validateDirectory, ValidationError } from '../lib/errors';
import { validateExportFormat, processPatterns, getDepthValue } from '../lib/option-utils';
import {
  depthOption,
  excludeOption,
  filterOption,
  exportOption,
  extensionOption
} from '../lib/common-options';

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
  .addOption(filterOption)
  .addOption(extensionOption)
  .addOption(depthOption)
  .addOption(excludeOption)
  .addOption(exportOption)
  .action(withErrorHandling((path, query, options) => {
    // Validate directory exists
    validateDirectory(path);

    // Validate query
    if (!query || query.trim() === '') {
      throw new ValidationError('Search query cannot be empty');
    }

    // Validate export format if provided
    validateExportFormat(options.export);

    // Build tree with minimal metadata unless content search is needed
    const tree = buildTree(path, {
      depth: getDepthValue(options.depth),
      filter: processPatterns(options.filter),
      exclude: processPatterns(options.exclude),
    });

    const results = searchTree(tree, query, {
      ext: options.ext ? options.ext.replace(/^\*\./, '.') : undefined, // Normalize *.ts to .ts
      basePath: path,
    });

    const output = formatSearchResults(results, options);
    console.log(output);
  }));