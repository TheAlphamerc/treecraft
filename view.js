#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ignore from "ignore";
import { Command } from "commander";

const INDENT = "  "; // Spacing for tree levels

async function view(args) {
  const program = new Command();

  program
    .version('1.0.0')
    .argument('[directory]', 'Directory to generate tree for', process.cwd())
    .option('--gitignore', 'Include .gitignore exclusions')
    .parse(['', '', ...args]); // Fake argv[0] and argv[1]

  const options = program.opts();
  const targetPath = program.args[0] ?? process.cwd();

  // Validate path
  if (!fs.existsSync(targetPath)) {
    console.error(chalk.red("❌ Directory does not exist!"));
    process.exit(1);
  }

  /**
   * Load exclusions from `.gentreerc` or `.gitignore`
   * @param {boolean} useGitignore - Whether to use `.gitignore`
   */
  function loadExclusions(useGitignore = false) {
    const ig = ignore();

    // Load exclusions from .gentreerc
    const configPath = path.join(process.cwd(), ".gentreerc");
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (Array.isArray(config.exclude)) {
          ig.add(config.exclude.join('\n'));
        }
      } catch (error) {
        console.error(chalk.red("❌ Error reading .gentreerc file"));
      }
    }

    // Load exclusions from .gitignore if flag is set
    if (useGitignore) {
      const gitignorePath = path.join(process.cwd(), ".gitignore");
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
        ig.add(gitignoreContent);
      }
    }
    return ig;
  }

  /**
   * Recursively prints the directory tree, ignoring excluded folders.
   * @param {string} dirPath - The root directory path.
   * @param {string} prefix - The prefix for tree indentation.
   * @param {Object} ig - Ignore instance with exclusion rules.
   * @param {string} rootPath - Project root path for relative checks.
   */
  function printTree(dirPath, prefix = "", ig, rootPath) {
    const items = fs.readdirSync(dirPath);
    const filteredItems = items.filter((item) => {
      const fullPath = path.join(dirPath, item);
      const relativePath = path.relative(rootPath, fullPath);
      return !ig.ignores(relativePath);
    });

    filteredItems.forEach((item, index) => {
      const fullPath = path.join(dirPath, item);
      const isLast = index === filteredItems.length - 1;
      const connector = isLast ? "└──" : "├──";

      if (fs.statSync(fullPath).isDirectory()) {
        console.log(chalk.blue(`${prefix}${connector} ${item}`));
        printTree(fullPath, prefix + (isLast ? "   " : "│  "), ig, rootPath);
      } else {
        console.log(chalk.green(`${prefix}${connector} ${item}`));
      }
    });
  }

  // Load exclusions
  const excluded = loadExclusions(options.gitignore);
  const rootPath = process.cwd(); // Root directory for relative path checks

  console.log(chalk.bold.yellow(`Directory structure of: ${targetPath}\n`));
  printTree(targetPath, "", excluded, rootPath);
}

// if (require.main === module) {
//   genTree(process.argv.slice(2));
// }

export default view;