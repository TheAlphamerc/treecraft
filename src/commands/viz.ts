import chalk from 'chalk';
import { Command } from 'commander';
import { statSync, writeFileSync } from 'fs';
import { formatTree } from '../lib/formatters';
import { buildTree } from '../lib/fs-utils';
import { FileMetadata, FileNode } from '../types';

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