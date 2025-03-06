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
  .option('--ext <pattern>', 'Limit to extensions (e.g., *.ts)')
  .option('--exp, --export <format>', 'Export format (text, json, yaml)')
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
    const tree = buildTree(path, {});
    const results = searchTree(tree, query, {
      ext: options.ext ? options.ext.replace(/^\*\./, '.') : undefined, // Normalize *.ts to .ts
      basePath: path,
    });
    const output = formatSearchResults(results, options);
    console.log(output);
  });