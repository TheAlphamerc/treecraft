import { Command } from 'commander';
import chalk from 'chalk';
import { vizCommand } from './commands/viz';
import { genCommand } from './commands/gen';
import { statsCommand } from './commands/stats';
import { searchCommand } from './commands/search';

const program = new Command();

program
  .name('treecraft')
  .description('A powerful CLI for directory visualization and generation')
  .version('0.0.2');

program.addCommand(vizCommand);
program.addCommand(genCommand);
program.addCommand(statsCommand);
program.addCommand(searchCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp((txt) => chalk.green(txt));
}