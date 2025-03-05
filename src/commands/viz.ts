import chalk from 'chalk';
import { Command } from 'commander';
import { statSync } from 'fs';
import { formatTree } from '../lib/formatters';
import { buildTree } from '../lib/fs-utils';
import { FileMetadata, FileNode } from '../types';

/**
 * Visualize the directory structure at <path>.
 * @param path Directory to visualize
 * @param options Command options
 *   --mode <mode>: Visualization mode (tree, graph, list, interactive).
 *   --depth <n>: Limit tree depth.
 *   --exclude <patterns>: Exclude patterns (comma-separated).
 *   --color: Enable colored output.
 *   --export <format>: Export format (text, json, yaml).
 * @example
 * Visualize the directory structure as a tree.
 * ```bash
 *   npm run start -- viz . --depth 2 --exclude node_modules,dist,.git,vscode --color
 * ```
 * Export the directory structure in txt file.
 * ```bash
 *    npm run start -- viz . --exclude node_modules,dist,.git,vscode| tail -n +4 > output/src.txt 
 * ```
 * Export the directory structure in json file.
 * ```bash
 *     npm run start -- viz . --exclude node_modules,dist,.git,vscode --export json  | tail  +4 > output/src.json
 * ```
 * Visualize the directory structure having only .ts or .json files
 * ```bash
*    npm run start -- viz . --filter "*.ts, *.json" --exclude "node_modules" 
 * ```
 * @returns Directory visualization
 */
export const vizCommand = new Command()
  .name('viz')
  .description('Visualize directory structure')
  .argument('[path]', 'Directory to visualize', '.')
  .option('-m, --mode <mode>', 'Visualization mode (tree, graph, list, interactive)', 'tree')
  .option('-d, --depth <n>', 'Limit tree depth', parseInt)
  .option('-f, --filter <patterns>', 'Include only patterns (comma-separated)')
  .option('-c, --color', 'Enable colored output')
  .option('--exl, --exclude <patterns>', 'Exclude patterns (comma-separated)')
  .option('--exp, --export <format>', 'Export format (text, json, yaml)', 'text')
  .option('--wm, --with-metadata', 'Include metadata (size, modified time) in output')
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
      depth: options.depth || Infinity,
      withMetadata: options.withMetadata,
      filter: options.filter ? options.filter.split(',').map((p: string) => p.trim()) : [],
      exclude: options.exclude ? options.exclude.split(',').map((p: string) => p.trim()) : [],
    });

    let output: string;
    switch (options.mode) {
      case 'tree':
        output = formatTree(tree, { export: options.export, withMetadata: options.withMetadata });
        break;
      case 'list':
        output = formatList(tree); // Simple stub for now
        break;
      case 'graph':
        output = 'Graph mode not yet implemented';
        break;
      case 'interactive':
        output = 'Interactive mode not yet implemented';
        break;
      default:
        output = chalk.red(`Invalid mode: ${options.mode}`);
    }

    if (options.color && !options.export) {
      output = chalk.green(output);
    }

    console.log(output);
  });
// Stub for list mode (pending full implementation)
function formatList(tree: FileNode): string {
  const lines: string[] = [];
  const flatten = (node: FileNode | FileMetadata, prefix = '') => {
    for (const [name, content] of Object.entries(node)) {
      lines.push(`${prefix}${name}`);
      if (typeof content === 'object' && content !== null) {
        flatten(content, `${prefix}${name}/`);
      }
    }
  };
  flatten(tree);
  return lines.join('\n');
}