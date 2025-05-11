/**
 * TreeCraft - A powerful CLI tool for directory visualization and management
 * 
 * TreeCraft provides several commands for working with directory structures:
 * 
 * - viz: Visualize directory structures in various formats
 * - gen: Generate directory structures from specification files
 * - stats: Display statistics about directory contents
 * - search: Find files by name or content
 * 
 * @version 0.0.2
 * @author TheAlphamerc <sonu.sharma045@gmail.com>
 * @license ISC
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { vizCommand } from './commands/viz';
import { genCommand } from './commands/gen';
import { statsCommand } from './commands/stats';
import { searchCommand } from './commands/search';
import { getDetailedHelp } from './lib/help';

const program = new Command();

program
  .name('treecraft')
  .description('A powerful CLI for directory visualization and generation')
  .version('0.0.2');

program.addCommand(vizCommand);
program.addCommand(genCommand);
program.addCommand(statsCommand);
program.addCommand(searchCommand);

// Add a dedicated help command
program
  .command('help')
  .description('Display detailed help information')
  .action(() => {
    console.log(getDetailedHelp());
  });

program.parse(process.argv);

// Show help if no command was specified
if (!process.argv.slice(2).length) {
  console.log(getDetailedHelp());
}