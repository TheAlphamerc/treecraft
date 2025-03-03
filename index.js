#!/usr/bin/env node
import chalk from 'chalk';
import view from './view.js';
import create from './create.js';

const [, , command, ...args] = process.argv;

async function runCommand() {
  try {
    switch (command) {
      case 'view':
        await view(args);
        break;
      case 'create':
        await create(args);
        break;
      default:
        console.error(chalk.red(`❌ Unknown command: ${command}`));
        console.log(chalk.blue('Usage:'));
        console.log(chalk.yellow('  tree view [directory] [--gitignore]'));
        console.log(chalk.yellow('  tree create <jsonConfig> [--skip-all|--overwrite-all|--manual]'));
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

runCommand();