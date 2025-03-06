import { Command } from 'commander';
import { buildTree } from '../lib/fs-utils';
import { formatTree } from '../lib/formatters';
import { statSync } from 'fs';
import chalk from 'chalk';

/**
 * Export the directory structure at <path> without visualization (standalone export).
 * @param path Directory to export
 * @param options Command options
 *   --format <format>: Export format (text, json, yaml).
 *   --with-metadata: Include detailed metadata in exports. (e.g., size, timestamps).
 * 
 * @example
 * Export directory structure as JSON.
 * ```bash
 *   treecraft export ./src --format json --with-metadata > src.json
 * ```
 * Export directory structure as YAML.
 * ```sh
 *  treecraft export ./src --format yaml --with-metadata > src.yaml
 * ```
 * @returns Directory structure
 */
export const exportCommand = new Command()
  .name('export')
  .description('Export directory structure')
  .argument('[path]', 'Directory to export', '.')
  .option('-f, --filter <patterns>', 'Include only patterns (comma-separated)')
  .option('--fmt, --format <format>', 'Export format (text, json, yaml)', 'text')
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
      filter: options.filter ? options.filter.split(',').map((p: string) => p.trim()) : [],
    });
    const output = formatTree(tree, { export: options.format });
    console.log(options.format === 'text' ? chalk.yellow('Export:\n') + chalk.green(output) : output);
  });