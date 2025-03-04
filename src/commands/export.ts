import { Command } from 'commander';
import { buildTree } from '../lib/fs-utils';
import { formatTree } from '../lib/formatters';

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
  .requiredOption('--format <format>', 'Export format (text, json, yaml)')
  .action((path, options) => {
    const tree = buildTree(path, options);
    console.log(formatTree(tree, options));
  });