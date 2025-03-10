import { Command } from 'commander';
import { statSync } from 'fs';
import { buildTree, computeStats } from '../lib/fs-utils';
import { formatStats } from '../lib/formatters';
import chalk from 'chalk';

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