import { Command } from 'commander';
import { existsSync, readFileSync } from 'fs';
import { load } from 'js-yaml';
import { generateStructure } from '../lib/fs-utils';
import { parseTextTree } from '../lib/parser';
import { FileNode } from '../types';
import { withErrorHandling, ValidationError, ParseError, IOError } from '../lib/errors';
import chalk from 'chalk';

/**
 * Command for generating directory structures from specification files
 * 
 * This command creates directories and files based on a specification file
 * in JSON, YAML, or text tree format. It can handle conflicts by skipping
 * or overwriting existing files and directories.
 * 
 * Usage: treecraft gen <input> -o <output> [options]
 */
export const genCommand = new Command()
  .name('gen')
  .description('Generate directory structure from an input file')
  .argument('<input>', 'Input file (JSON, YAML, or text tree)')
  .requiredOption('-o, --output <path>', 'Output directory')
  .option('-s, --skip-all', 'Skip existing files/directories')
  .option('-w, --overwrite-all', 'Overwrite existing files/directories')
  .action(withErrorHandling((input, options) => {
    // Check if output exists and handle conflicts
    if (existsSync(options.output)) {
      if (!options.skipAll && !options.overwriteAll) {
        throw new ValidationError(`Output directory '${options.output}' already exists. Use --skip-all or --overwrite-all.`);
      }
    }

    // Read and parse the input file
    let spec: FileNode;
    let fileContent: string;

    try {
      fileContent = readFileSync(input, 'utf-8');
    } catch (err: any) {
      throw new IOError(`Failed to read input file: ${err.message}`, err);
    }

    const ext = input.toLowerCase().split('.').pop();

    try {
      if (ext === 'json') {
        spec = JSON.parse(fileContent);
      } else if (ext === 'yaml' || ext === 'yml') {
        spec = load(fileContent) as FileNode;
      } else if (ext === 'txt') {
        spec = parseTextTree(fileContent);
      } else {
        throw new ValidationError(`Unsupported file format '${ext}'. Use .json, .yaml, or .txt.`);
      }
    } catch (err: any) {
      if (err instanceof ValidationError) {
        throw err;
      }
      throw new ParseError(`Failed to parse ${ext} file: ${err.message}`, err);
    }

    // Generate the structure
    generateStructure(spec, options.output, {
      skipAll: options.skipAll,
      overwriteAll: options.overwriteAll,
    });

    console.log(chalk.green(`Structure generated at '${options.output}'`));
  }));