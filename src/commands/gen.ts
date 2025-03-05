import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { load } from 'js-yaml';
import chalk from 'chalk';
import { FileNode } from '../types';
import { generateStructure } from '../lib/fs-utils';
import { parseTextTree } from '../lib/parser';

export const genCommand = new Command()
  .name('gen')
  .description('Generate directory structure from an input file')
  .argument('<input>', 'Input file (JSON, YAML, or text tree)')
  .requiredOption('-o, --output <path>', 'Output directory')
  .option('-s, --skip-all', 'Skip existing files/directories')
  .option('--o-a, --overwrite-all', 'Overwrite existing files/directories')
  .action((input, options) => {
    // Check if output exists and handle conflicts
    if (existsSync(options.output)) {
      if (!options.skipAll && !options.overwriteAll) {
        console.error(chalk.red(`Error: Output directory '${options.output}' already exists. Use --skip-all or --overwrite-all.`));
        process.exit(1);
      }
    }

    // Read and parse the input file
    let spec: FileNode;
    const fileContent = readFileSync(input, 'utf-8');
    const ext = input.toLowerCase().split('.').pop();
    try {
      if (ext === 'json') {
        spec = JSON.parse(fileContent);
      } else if (ext === 'yaml' || ext === 'yml') {
        spec = load(fileContent) as FileNode;
      } else if (ext === 'txt') {
        spec = parseTextTree(fileContent);
      } else {
        console.error(chalk.red(`Error: Unsupported file format '${ext}'. Use .json, .yaml, or .txt.`));
        process.exit(1);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error parsing '${input}': ${err.message}`));
      process.exit(1);
    }

    // Generate the structure
    generateStructure(spec, options.output, {
      skipAll: options.skipAll,
      overwriteAll: options.overwriteAll,
    });

    console.log(chalk.green(`Structure generated at '${options.output}'`));
  });