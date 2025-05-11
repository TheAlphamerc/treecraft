import chalk from 'chalk';
import { Command } from 'commander';
import { statSync, writeFileSync } from 'fs';
import { formatTree } from '../lib/formatters';
import { buildTree } from '../lib/fs-utils';
import { FileMetadata, FileNode } from '../types';

/**
 * Command for visualizing directory structures
 * 
 * This command recursively explores a directory and displays its structure
 * in various formats including tree, list, graph, or interactive modes.
 * 
 * Usage: treecraft viz [path] [options]
 */
export const vizCommand = new Command()
  .name('viz')
  .description('Visualize directory structure')
  .description('Visualize or export directory structure')
  .argument('[path]', 'Directory to visualize/export', '.')
  .option('-m, --mode <mode>', 'Visualization mode (tree, graph, list, interactive)', 'tree')
  .option('-d, --depth <n>', 'Limit tree depth', parseInt)
  .option('-e, --exclude <patterns>', 'Exclude patterns (comma-separated)')
  .option('-f, --filter <patterns>', 'Include only patterns (comma-separated)')
  .option('-c, --color', 'Enable colored output')
  .option('-x, --export <format>', 'Export format (text, json, yaml)')
  .option('-w, --with-metadata', 'Include metadata (size, modified time) in output')
  .option('-o, --output-file <file>', 'Write output to file')
  .action((path, options) => {
    try {
      if (!statSync(path).isDirectory()) {
        throw new Error(`'${path}' is not a directory`);
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
          throw new Error(`Invalid mode: ${options.mode}`);
      }

      // Handle output
      if (options.outputFile) {
        writeFileSync(options.outputFile, output, 'utf-8');
        console.log(chalk.blue(`Exported to ${options.outputFile}`));
      }
      else if (options.color && options.mode === 'tree') {
        console.log(chalk.yellow('Tree:\n') + chalk.green(output));
      }
      else if (options.export) {
        console.log(output); // Clean output for redirection
      }
      else {
        console.log(output);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

/**
 * Formats a directory tree as a flat list
 * 
 * This is a simplified implementation of the list mode that flattens
 * the directory structure into a list of paths.
 * 
 * @param tree - The directory tree to format
 * @returns A string with each path on a new line
 */
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