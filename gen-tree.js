#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

const INDENT = "  "; // Spacing for tree levels

/**
 * Load exclusions from `.gentreerc` or `.gitignore`
 * @param {boolean} useGitignore - Whether to use `.gitignore`
 */
function loadExclusions(useGitignore = false) {
  let exclusions = [];

  // Load exclusions from `.gentreerc`
  const configPath = path.join(process.cwd(), ".gentreerc");
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      exclusions = config.exclude || [];
    } catch (error) {
      console.error(chalk.red("❌ Error reading .gentreerc file"));
    }
  }

  // Load exclusions from `.gitignore` if flag is set
  if (useGitignore) {
    const gitignorePath = path.join(process.cwd(), ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
      exclusions = exclusions.concat(
        gitignoreContent.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#"))
      );
    }
  }

  return exclusions;
}

/**
 * Recursively prints the directory tree, ignoring excluded folders.
 * @param {string} dirPath - The root directory path.
 * @param {string} prefix - The prefix for tree indentation.
 * @param {Array} excluded - List of directories to exclude.
 */
function printTree(dirPath, prefix = "", excluded = []) {
  const items = fs.readdirSync(dirPath);
  const filteredItems = items.filter((item) => !excluded.includes(item)); // Exclude folders

  filteredItems.forEach((item, index) => {
    const fullPath = path.join(dirPath, item);
    const isLast = index === filteredItems.length - 1;
    const connector = isLast ? "└──" : "├──";

    if (fs.statSync(fullPath).isDirectory()) {
      console.log(chalk.blue(`${prefix}${connector} 📂 ${item}`));
      printTree(fullPath, prefix + (isLast ? "   " : "│  "), excluded); // Recursive call
    } else {
      console.log(chalk.green(`${prefix}${connector} 📄 ${item}`));
    }
  });
}

// Get CLI arguments
const args = process.argv.slice(2);
const useGitignore = args.includes("--gitignore"); // Check if --gitignore flag is passed
const targetPath = args.find((arg) => arg !== "--gitignore") || process.cwd();

// Validate path
if (!fs.existsSync(targetPath)) {
  console.error(chalk.red("❌ Directory does not exist!"));
  process.exit(1);
}

// Load exclusions
const excludedFolders = loadExclusions(useGitignore);

console.log(chalk.bold.yellow(`📁 Directory structure of: ${targetPath}\n`));
printTree(targetPath, "", excludedFolders);
