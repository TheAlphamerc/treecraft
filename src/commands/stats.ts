import { Command } from 'commander';
import { statSync } from 'fs';
import { buildTree, computeStats } from '../lib/fs-utils';
import { formatStats } from '../lib/formatters';
import chalk from 'chalk';
/**
 * Display statistics about the directory at <path>.
 * @param path Directory to analyze
 * @param options Command options
 *   --size-dist: Show size distribution (e.g., “10 files <1MB”).
 *   --export <format>: Export stats (text, json, yaml).
 *   --with-metadata: Include detailed metadata in exports.
 * 
 * 
 * @example
 * Show size distribution in the terminal.
 * ```bash
 *   treecraft stats . --size-dist
 * ```
 * Export stats as JSON.
 * ```sh
 *   treecraft stats ./src --export json > stats.json
 * ```
 * @returns Directory statistics
 */
export const statsCommand = new Command()
  .name('stats')
  .description('Display directory statistics')
  .argument('[path]', 'Directory to analyze', '.')
  .option('-f, --filter <patterns>', 'Include only patterns (comma-separated)')
  .option('-d, --depth <n>', 'Limit stats to depth', parseInt)
  .option('-s, --sort <key>', 'Sort size distribution (size, count)', 'count')
  .option('--exp, --export <format>', 'Export format (text, json, yaml)')
  .option('--exl, --exclude <patterns>', 'Exclude patterns (comma-separated)')
  .option('--ft, --file-types', 'Show file type breakdown')
  .option('--sd, --size-dist', 'Show size distribution')
  .action((path, options) => {
    try {
      if (!statSync(path).isDirectory()) {
        console.error(chalk.red(`Error: '${path}' is not a directory`));
        process.exit(1);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: Cannot access '${path}' - ${err.message}`));
      process.exit(1);
    }

    const tree = buildTree(path, {
      withMetadata: true,
      filter: options.filter ? options.filter.split(',').map((p: string) => p.trim()) : [],
      exclude: options.exclude ? options.exclude.split(',').map((p: string) => p.trim()) : [],
      depth: options.depth,
    });
    const stats = computeStats(tree, { sizeDist: options.sizeDist, fileTypes: options.fileTypes, sort: options.sort });
    const output = formatStats(stats, options);
    console.log(output);
  });