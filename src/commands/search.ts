import { Command } from 'commander';
import { buildTree, searchTree } from '../lib/fs-utils';
import { formatSearchResults, formatTree } from '../lib/formatters';
import { FileMetadata, FileNode } from '../types';
import { statSync } from 'fs';
import chalk from 'chalk';

export const searchCommand = new Command()
  .name('search')
  .description('Search files by name or content')
  .argument('[path]', 'Directory to search', '.')
  .argument('<query>', 'Search term')
  .option('-f, --filter <patterns>', 'Include only patterns (e.g. *.ts, *.js)')
  .option('-d, --depth <n>', 'Limit tree depth')
  .option('-e, --exclude <patterns>', 'Exclude patterns (comma-separated)')
  .option('-x, --export <format>', 'Export format (text, json, yaml)')
  .action((path, query, options) => {
    try {
      if (!statSync(path).isDirectory()) {
        console.error(chalk.red(`Error: '${path}' is not a directory`));
        process.exit(1);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: Cannot access '${path}' - ${err.message}`));
      process.exit(1);
    }

    // Build tree with minimal metadata unless content search is needed
    const tree = buildTree(path, {
      depth: options.depth || Infinity,
      filter: options.filter ? options.filter.split(',').map((p: string) => p.trim()) : [],
      exclude: options.exclude ? options.exclude.split(',').map((p: string) => p.trim()) : [],
    });
    const results = searchTree(tree, query, {
      ext: options.ext ? options.ext.replace(/^\*\./, '.') : undefined, // Normalize *.ts to .ts
      basePath: path,
    });
    const output = formatSearchResults(results, options);
    console.log(output);
  });