import { Command } from 'commander';
import { buildTree, computeStats } from '../lib/fs-utils';
import { formatStats } from '../lib/formatters';
import { withErrorHandling, validateDirectory, ValidationError, IOError } from '../lib/errors';
import { validateExportFormat, validateSortOption, processPatterns, getDepthValue } from '../lib/option-utils';
import {
  depthOption,
  excludeOption,
  filterOption,
  exportOption,
  outputFileOption,
  sortOption,
  sizeDistOption,
  fileTypesOption
} from '../lib/common-options';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

/**
 * Command for analyzing and displaying directory statistics
 * 
 * This command calculates and displays statistics about a directory,
 * including file and directory counts, total size, size distribution,
 * and file type breakdown.
 * 
 * Usage: treecraft stats [path] [options]
 */
export const statsCommand = new Command()
  .name('stats')
  .description('Display directory statistics')
  .argument('[path]', 'Directory to analyze', '.')
  .addOption(sizeDistOption)
  .addOption(exportOption)
  .addOption(filterOption)
  .addOption(excludeOption)
  .addOption(depthOption)
  .addOption(fileTypesOption)
  .addOption(sortOption)
  .addOption(outputFileOption)
  .action(withErrorHandling((path, options) => {
    // Validate that the path is a directory
    validateDirectory(path);

    // Validate export format if provided
    validateExportFormat(options.export);

    // Validate sort option if provided
    validateSortOption(options.sort);

    const tree = buildTree(path, {
      withMetadata: true,
      filter: processPatterns(options.filter),
      exclude: processPatterns(options.exclude),
      depth: options.depth,
    });

    const stats = computeStats(tree, {
      sizeDist: options.sizeDist,
      fileTypes: options.fileTypes,
      sort: options.sort
    });

    const output = formatStats(stats, options);

    // Handle output to file if specified
    if (options.outputFile) {
      try {
        writeFileSync(options.outputFile, output, 'utf-8');
        console.log(chalk.blue(`Exported to ${options.outputFile}`));
      } catch (err: any) {
        throw new IOError(`Failed to write to output file: ${err.message}`, err);
      }
    } else {
      console.log(output);
    }
  }));