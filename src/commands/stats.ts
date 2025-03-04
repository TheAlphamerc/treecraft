import { Command } from 'commander';
import { buildTree, calcTotalSize, countFiles } from '../lib/fs-utils';
import { formatTree } from '../lib/formatters';
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
  .option('--size-dist', 'Show size distribution')
  .option('--export <format>', 'Export format (text, json, yaml)')
  .action((path, options) => {
    const tree = buildTree(path, options);
    const stats = {
      files: countFiles(tree),
      totalSize: calcTotalSize(tree),
    };
    const output = options.sizeDist
      ? `Files: ${stats.files}, Total Size: ${stats.totalSize} bytes`
      : `Files: ${stats.files}`;
    console.log(formatTree(stats, options));
  });
