#!/usr/bin/env node
import chalk from 'chalk';
// import genTree from './gen-tree.js';
import { Command } from 'commander';
import { genStruct } from './gen-struct';

const [, , command, ...args] = process.argv;

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));


async function main() {
  const program = new Command()
    .name('struct')
    .description('A simple cli tool for Project Scaffolding & Directory Visualization.')
    .version('1.0.0');

  program.addCommand(genStruct);
  program.parse();

}

// async function runCommand() {
//   try {
//     switch (command) {
//       case 'gen-tree':
//         await genTree(args);
//         break;
//       case 'gen-struct':
//         await genStruct(args);
//         break;
//       default:
//         console.error(chalk.red(`❌ Unknown command: ${command}`));
//         console.log(chalk.blue('Usage:'));
//         console.log(chalk.yellow('  gen-cli gen-tree [directory] [--gitignore]'));
//         console.log(chalk.yellow('  gen-cli gen-struct <jsonConfig> [--skip-all|--overwrite-all|--manual]'));
//         process.exit(1);
//     }
//   } catch (error) {
//     console.error('Error:', error.message);
//     process.exit(1);
//   }
// }

// runCommand();
main();