#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { Command } from 'commander';
import readline from 'readline';
import chalk from 'chalk';

async function create(args) {
  const program = new Command();

  program
    .version('1.0.0')
    .argument('<jsonConfig>', 'Path to JSON configuration file')
    .option('--skip-all', 'Skip all existing files')
    .option('--overwrite-all', 'Overwrite all existing files')
    .option('--manual', 'Manually resolve conflicts (default if no flag provided)')
    .parse(['', '', ...args]); // Fake argv[0] and argv[1]

  const options = program.opts();
  const jsonConfigPath = program.args[0];
  const targetRoot = process.cwd();

  if (!fs.existsSync(jsonConfigPath)) {
    console.error(chalk.red('❌ Please provide a valid JSON configuration file.'));
    process.exit(1);
  }

  const structure = JSON.parse(fs.readFileSync(jsonConfigPath, 'utf8'));

  function analyzeConflicts(structure, currentPath) {
    let conflicts = [];
    for (const key of Object.keys(structure)) {
      const fullPath = path.join(currentPath, key);
      if (typeof structure[key] === 'object') {
        conflicts = conflicts.concat(analyzeConflicts(structure[key], fullPath));
      } else {
        if (fs.existsSync(fullPath)) {
          conflicts.push(fullPath);
        }
      }
    }
    return conflicts;
  }

  function askUser(filePath) {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(
        chalk.yellow(`File "${filePath}" already exists. Choose (S)kip, (O)verwrite, (A)ll Skip, (B) All Overwrite: `),
        (answer) => {
          rl.close();
          const normalized = answer.trim().toLowerCase();
          if (normalized === 'o') resolve('overwrite');
          else if (normalized === 's') resolve('skip');
          else if (normalized === 'a') resolve('all-skip');
          else if (normalized === 'b') resolve('all-overwrite');
          else resolve('skip');
        }
      );
    });
  }

  async function createStructure(structure, currentPath, conflictDecisions) {
    for (const key of Object.keys(structure)) {
      const fullPath = path.join(currentPath, key);
      if (typeof structure[key] === 'object') {
        fs.ensureDirSync(fullPath);
        await createStructure(structure[key], fullPath, conflictDecisions);
      } else {
        if (fs.existsSync(fullPath)) {
          const decision = conflictDecisions[fullPath];
          if (decision === 'skip') {
            console.log(chalk.yellow(`⚠️ Skipping existing file: ${fullPath}`));
            continue;
          } else if (decision === 'overwrite') {
            console.log(chalk.blue(`🔄 Overwriting file: ${fullPath}`));
          }
        }
        fs.writeFileSync(fullPath, structure[key] || '');
        console.log(chalk.green(`✅ Created file: ${fullPath}`));
      }
    }
  }

  async function run() {
    const conflicts = analyzeConflicts(structure, targetRoot);
    if (conflicts.length > 0) {
      console.log(chalk.yellow(`\nFound ${conflicts.length} existing file(s):`));
      conflicts.forEach((file) => {
        console.log(chalk.yellow(` - ${path.relative(targetRoot, file)}`));
      });
      console.log('');
    } else {
      console.log(chalk.green('No conflicts found. Proceeding to create the structure...\n'));
    }

    const conflictDecisions = {};
    if (conflicts.length > 0) {
      if (options.skipAll) {
        conflicts.forEach((file) => (conflictDecisions[file] = 'skip'));
      } else if (options.overwriteAll) {
        conflicts.forEach((file) => (conflictDecisions[file] = 'overwrite'));
      } else {
        let globalDecision = null;
        for (const file of conflicts) {
          if (globalDecision === 'all-skip') {
            conflictDecisions[file] = 'skip';
          } else if (globalDecision === 'all-overwrite') {
            conflictDecisions[file] = 'overwrite';
          } else {
            const decision = await askUser(file);
            if (decision === 'all-skip' || decision === 'all-overwrite') {
              globalDecision = decision;
              conflictDecisions[file] = decision === 'all-skip' ? 'skip' : 'overwrite';
            } else {
              conflictDecisions[file] = decision;
            }
          }
        }
      }
    }

    await createStructure(structure, targetRoot, conflictDecisions);
    console.log(chalk.green('\n✅ Directory structure created successfully!'));
  }

  await run();
}

// if (require.main === module) {
//   genStruct(process.argv.slice(2));
// }

export default create;