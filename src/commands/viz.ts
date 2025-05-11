import chalk from 'chalk';
import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { formatTree } from '../lib/formatters';
import { buildTree } from '../lib/fs-utils';
import { FileMetadata, FileNode } from '../types';
import { withErrorHandling, validateDirectory, ValidationError, IOError } from '../lib/errors';
import inquirer from 'inquirer';
import { join, dirname, basename } from 'path';

/**
 * Command for visualizing directory structures
 * 
 * This command recursively explores a directory and displays its structure
 * in various formats including tree, list, graph, or interactive modes.
 * 
 * Usage: treecraft viz [path] [options]
 */
export const vizCommand = new Command()
  .name('viz')
  .description('Visualize directory structure')
  .argument('[path]', 'Directory to visualize/export', '.')
  .option('-m, --mode <mode>', 'Visualization mode (tree, graph, list, interactive)', 'tree')
  .option('-d, --depth <n>', 'Limit tree depth', parseInt)
  .option('-e, --exclude <patterns>', 'Exclude patterns (comma-separated)')
  .option('-f, --filter <patterns>', 'Include only patterns (comma-separated)')
  .option('-c, --color', 'Enable colored output')
  .option('-x, --export <format>', 'Export format (text, json, yaml)')
  .option('-w, --with-metadata', 'Include metadata (size, modified time) in output')
  .option('-o, --output-file <file>', 'Write output to file')
  .action(withErrorHandling(async (path, options) => {
    // Validate that the path is a directory
    validateDirectory(path);

    // Validate mode option
    const validModes = ['tree', 'graph', 'list', 'interactive'];
    if (options.mode && !validModes.includes(options.mode)) {
      throw new ValidationError(`Invalid mode: '${options.mode}'. Valid modes are: ${validModes.join(', ')}`);
    }

    // Validate export format if provided
    if (options.export && !['text', 'json', 'yaml'].includes(options.export)) {
      throw new ValidationError(`Invalid export format: '${options.export}'. Use 'text', 'json', or 'yaml'.`);
    }

    const tree = buildTree(path, {
      depth: options.depth || Infinity,
      withMetadata: options.withMetadata,
      filter: options.filter ? options.filter.split(',').map((p: string) => p.trim()) : [],
      exclude: options.exclude ? options.exclude.split(',').map((p: string) => p.trim()) : [],
    });

    // If we're in interactive mode, handle it differently
    if (options.mode === 'interactive') {
      try {
        await runInteractiveMode(tree, path);
        return; // Exit after interactive mode completes
      } catch (err) {
        // If interactive mode isn't supported (e.g., non-TTY environment),
        // fall back to tree mode
        console.error(chalk.yellow('Interactive mode not available, falling back to tree mode'));
        options.mode = 'tree';
      }
    }

    let output: string;
    switch (options.mode) {
      case 'tree':
        output = formatTree(tree, { export: options.export, withMetadata: options.withMetadata });
        break;
      case 'list':
        output = formatList(tree);
        break;
      case 'graph':
        output = formatGraph(tree, options.withMetadata);
        break;
      default:
        // This should never happen due to validation above, but adding as fallback
        throw new ValidationError(`Invalid mode: ${options.mode}`);
    }

    // Handle output
    if (options.outputFile) {
      try {
        writeFileSync(options.outputFile, output, 'utf-8');
        console.log(chalk.blue(`Exported to ${options.outputFile}`));
      } catch (err: any) {
        throw new IOError(`Failed to write to output file: ${err.message}`, err);
      }
    }
    else if (options.color && options.mode === 'tree') {
      console.log(chalk.yellow('Tree:\n') + chalk.green(output));
    }
    else if (options.color && options.mode === 'graph') {
      console.log(chalk.yellow('Graph:\n') + chalk.cyan(output));
    }
    else if (options.export) {
      console.log(output); // Clean output for redirection
    }
    else {
      console.log(output);
    }
  }));

/**
 * Formats a directory tree as a flat list
 * 
 * This is a simplified implementation of the list mode that flattens
 * the directory structure into a list of paths.
 * 
 * @param tree - The directory tree to format
 * @returns A string with each path on a new line
 */
function formatList(tree: FileNode): string {
  const lines: string[] = [];
  const flatten = (node: FileNode | FileMetadata, prefix = '') => {
    for (const [name, content] of Object.entries(node)) {
      lines.push(`${prefix}${name}`);
      if (typeof content === 'object' && content !== null) {
        flatten(content, `${prefix}${name}/`);
      }
    }
  };
  flatten(tree);
  return lines.join('\n');
}

/**
 * Formats a directory tree as an ASCII graph
 * 
 * This implementation creates a hierarchical graph visualization
 * with nodes connected by ASCII lines.
 * 
 * @param tree - The directory tree to format
 * @param withMetadata - Whether to include metadata in the output
 * @returns An ASCII graph representation of the directory structure
 */
function formatGraph(tree: FileNode, withMetadata?: boolean): string {
  const lines: string[] = [];
  const maxLabelWidth = 30; // Maximum width for node labels to keep graph manageable

  // Calculate the "weight" of each node (number of descendants plus itself)
  function getWeight(node: FileNode | FileMetadata): number {
    if (node === null || typeof node === 'string') return 1;

    try {
      return Object.values(node).reduce((sum, child) => {
        if (child === null || typeof child === 'string') return sum + 1;
        if (typeof child === 'object' && child !== null && 'type' in child) {
          return sum + (child.type === 'file' ? 1 : getWeight(child.children || {}));
        }
        return sum + getWeight(child as FileNode);
      }, 1);
    } catch (err) {
      // Fallback if anything goes wrong
      return 1;
    }
  }

  // Render a node with its connections
  function renderNode(name: string, node: FileNode | FileMetadata | null | string, depth = 0, isLast = false, prefix = ''): void {
    // Truncate long node names to keep graph width manageable
    const displayName = name.length > maxLabelWidth
      ? name.substring(0, maxLabelWidth - 3) + '...'
      : name;

    // Add metadata suffix if requested and available
    let metadataSuffix = '';
    try {
      if (withMetadata && node && typeof node === 'object' && node !== null) {
        if ('type' in node && typeof node.type === 'string') {
          const type = node.type === 'file' ? 'F' : 'D';
          const size = typeof node.size === 'number' ? node.size : 0;
          metadataSuffix = ` [${type}, ${size}B]`;
        }
      }
    } catch (err) {
      // Silently ignore metadata errors and continue without it
    }

    // Calculate indentation based on depth
    const indent = '  '.repeat(depth);

    // Prepare the connection line
    const connector = depth === 0 ? '' : (isLast ? '└── ' : '├── ');

    // Add the node to the graph
    lines.push(`${prefix}${indent}${connector}${displayName}${metadataSuffix}`);

    // Process child nodes
    if (node && typeof node === 'object' && node !== null) {
      try {
        const childEntries = Object.entries(node);

        // Filter valid entries
        const validEntries = childEntries.filter(([_, value]) => {
          return value !== undefined && (
            value === null ||
            typeof value === 'string' ||
            (typeof value === 'object' && value !== null)
          );
        });

        // Create weighted entries list
        const weightedEntries = validEntries
          .map(([key, value]) => {
            let weight = 1;
            try {
              weight = getWeight(value as FileNode | FileMetadata);
            } catch (err) {
              // Use default weight if error occurs
            }
            return { key, value, weight };
          })
          .sort((a, b) => b.weight - a.weight); // Sort by weight (descending)

        // Recursively render children
        weightedEntries.forEach((entry, i) => {
          const { key, value } = entry;
          const isLastChild = i === weightedEntries.length - 1;
          const newPrefix = prefix + (depth === 0 ? '' : (isLast ? '    ' : '│   '));

          try {
            if (value !== null && typeof value === 'object') {
              if ('type' in value && typeof value.type === 'string' && value.type === 'file') {
                renderNode(key, value, depth + 1, isLastChild, newPrefix);
              } else if ('type' in value && typeof value.type === 'string' && value.type === 'directory') {
                renderNode(key, value.children || {}, depth + 1, isLastChild, newPrefix);
              } else {
                renderNode(key, value, depth + 1, isLastChild, newPrefix);
              }
            } else {
              renderNode(key, value, depth + 1, isLastChild, newPrefix);
            }
          } catch (err) {
            // If rendering a child fails, add an error node instead
            lines.push(`${newPrefix}${'  '.repeat(depth + 1)}└── [Error rendering ${key}]`);
          }
        });
      } catch (err) {
        // If processing children fails, add an error message
        lines.push(`${prefix}${indent}└── [Error processing children]`);
      }
    }
  }

  // Get the root directory name (usually the last part of the path)
  const rootName = 'Root';

  // Start rendering from the root
  renderNode(rootName, tree);

  return lines.join('\n');
}

/**
 * Gets a node at a specified path in the tree
 * 
 * @param tree - The tree to search
 * @param pathParts - The path parts to follow
 * @returns The node at the specified path, or null if not found
 */
function getNodeAtPath(tree: FileNode, pathParts: string[]): FileNode | FileMetadata | null | string {
  if (pathParts.length === 0) return tree;

  let current: FileNode | FileMetadata | null | string = tree;

  for (const part of pathParts) {
    if (part === '') continue;

    // If we've reached a file or null, we can't go deeper
    if (current === null || typeof current === 'string') {
      return null;
    }

    // Handle directory with metadata
    if ('type' in current) {
      if (current.type === 'file') {
        return null; // Can't navigate into a file
      }

      // Navigate into directory's children
      // Use a type assertion here since we know children is a FileNode
      // when we're dealing with a directory
      const children = (current.children || {}) as FileNode;
      current = children[part];

      // If path doesn't exist, return null
      if (current === undefined) {
        return null;
      }
    } else {
      // Handle normal directory object
      const nextNode: FileNode | FileMetadata | null | string | undefined = current[part];

      // If path doesn't exist, return null
      if (nextNode === undefined) {
        return null;
      }

      current = nextNode;
    }
  }

  return current;
}

/**
 * Formats node information for display
 * 
 * @param name - The name of the node
 * @param node - The node itself
 * @returns A string with formatted information about the node
 */
function formatNodeInfo(name: string, node: FileNode | FileMetadata | null | string): string {
  if (node === null) {
    return `${name} (File)`;
  }

  if (typeof node === 'string') {
    return `${name} (File with content)`;
  }

  if ('type' in node) {
    const type = node.type === 'file' ? 'File' : 'Directory';
    const size = `${node.size} bytes`;
    // Ensure mtime is a valid string before creating Date
    const mtime = typeof node.mtime === 'string'
      ? new Date(node.mtime).toLocaleString()
      : 'Unknown';
    return `${name} (${type}, ${size}, Last Modified: ${mtime})`;
  }

  return `${name} (Directory)`;
}

/**
 * Runs an interactive directory browser using inquirer
 * 
 * @param tree - The directory tree to browse
 * @param basePath - The base path of the tree
 */
async function runInteractiveMode(tree: FileNode, basePath: string): Promise<void> {
  let currentPath: string[] = [];
  let running = true;

  // Check if we're in a TTY environment
  if (!process.stdout.isTTY) {
    throw new Error('Interactive mode requires a TTY environment');
  }

  console.log(chalk.blue('=== TreeCraft Interactive Directory Browser ==='));
  console.log(chalk.yellow(`Base Path: ${basePath}`));
  console.log(chalk.gray('Use arrow keys to navigate, Enter to select, Escape to go back\n'));

  while (running) {
    const currentNode = getNodeAtPath(tree, currentPath);
    if (currentNode === null || typeof currentNode === 'string') {
      // We're at a file, display info and go back up
      console.log(chalk.blue('File Information:'));
      console.log(chalk.cyan(formatNodeInfo(currentPath[currentPath.length - 1] || basename(basePath), currentNode)));
      console.log('');
      currentPath.pop(); // Go back up one level
      continue;
    }

    // We're at a directory, show its contents
    const fullPath = join(basePath, ...currentPath);
    console.log(chalk.blue(`Current Directory: ${fullPath}`));

    // Prepare choices for inquirer
    const choices: { name: string; value: string }[] = [];

    // Add "go back" option if we're not at the root
    if (currentPath.length > 0) {
      choices.push({
        name: `.. (Parent Directory)`,
        value: '..'
      });
    }

    // Add "exit" option
    choices.push({
      name: 'Exit Browser',
      value: 'exit'
    });

    // Add directories first, then files
    const items = Object.entries(currentNode);
    const dirs = items.filter(([_, value]) => {
      if (value === null || typeof value === 'string') return false;
      return !('type' in value) || value.type === 'directory';
    });
    const files = items.filter(([_, value]) => {
      if (value === null || typeof value === 'string') return true;
      return 'type' in value && value.type === 'file';
    });

    // Sort directories and files alphabetically
    dirs.sort((a, b) => a[0].localeCompare(b[0]));
    files.sort((a, b) => a[0].localeCompare(b[0]));

    // Add directories with folder emoji
    dirs.forEach(([name, _]) => {
      choices.push({
        name: `📁 ${name}/`,
        value: name
      });
    });

    // Add files with file emoji
    files.forEach(([name, _]) => {
      choices.push({
        name: `📄 ${name}`,
        value: name
      });
    });

    // Prompt user to select an item
    const { selection } = await inquirer.prompt([{
      type: 'list',
      name: 'selection',
      message: 'Select an item:',
      choices,
      pageSize: 15
    }]);

    if (selection === 'exit') {
      running = false;
    } else if (selection === '..') {
      currentPath.pop();
    } else {
      currentPath.push(selection);
    }

    // Clear a few lines for better UI experience
    console.log('\n');
  }

  console.log(chalk.blue('Exiting Interactive Browser'));
}