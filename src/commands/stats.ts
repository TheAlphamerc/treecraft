import { Command } from 'commander';
import { buildTree, computeStats } from '../lib/fs-utils';
import { formatStats } from '../lib/formatters';
import { withErrorHandling, validateDirectory } from '../lib/errors';

/**
 * Command for analyzing and displaying directory statistics
 * 
 * This command calculates and displays statistics about a directory,
 * including file and directory counts, total size, size distribution,
 * and file type breakdown.
 * 
 * Usage: treecraft stats [path] [options]
 */
export const statsCommand = new Command()
  .name('stats')
  .description('Display directory statistics')
  .argument('[path]', 'Directory to analyze', '.')
  .option('-s, --size-dist', 'Show size distribution')
  .option('-x, --export <format>', 'Export format (text, json, yaml)')
  .option('-f, --filter <patterns>', 'Include only patterns (comma-separated)')
  .option('-e, --exclude <patterns>', 'Exclude patterns (comma-separated)')
  .option('-d, --depth <n>', 'Limit stats to depth', parseInt)
  .option('-t, --file-types', 'Show file type breakdown')
  .option('-r, --sort <key>', 'Sort size distribution (size, count)', 'count')
  .action(withErrorHandling((path, options) => {
    // Validate that the path is a directory
    validateDirectory(path);

    const tree = buildTree(path, {
      withMetadata: true,
      filter: options.filter ? options.filter.split(',').map((p: string) => p.trim()) : [],
      exclude: options.exclude ? options.exclude.split(',').map((p: string) => p.trim()) : [],
      depth: options.depth,
    });

    const stats = computeStats(tree, {
      sizeDist: options.sizeDist,
      fileTypes: options.fileTypes,
      sort: options.sort
    });

    const output = formatStats(stats, options);
    console.log(output);
  }));