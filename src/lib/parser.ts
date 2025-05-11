import chalk from 'chalk';
import { FileNode } from '../types';
import { EOL } from 'os';
import { load } from 'js-yaml';

/**
 * Parses a JSON string into a FileNode structure
 * 
 * @param content - JSON string to parse
 * @returns The parsed FileNode structure
 * @throws Error if the JSON is invalid
 */
export function parseJsonTree(content: string): FileNode {
  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`Invalid JSON: ${(err as Error).message}`);
  }
}

/**
 * Parses a YAML string into a FileNode structure
 * 
 * @param content - YAML string to parse
 * @returns The parsed FileNode structure
 * @throws Error if the YAML is invalid
 */
export function parseYamlTree(content: string): FileNode {
  try {
    return load(content) as FileNode;
  } catch (err) {
    throw new Error(`Invalid YAML: ${(err as Error).message}`);
  }
}

/**
 * Parses a text-based ASCII tree into a FileNode structure
 * 
 * The tree must be in the standard format with '├──' or '└──' prefixes
 * and proper indentation using '│   ' to indicate hierarchy. File content
 * can be specified using a colon after the filename.
 * 
 * @example
 * Basic directory structure:
 * ```
 * ├── src
 * │   ├── lib
 * │   │   └── utils.js
 * │   └── index.js
 * └── package.json
 * ```
 * 
 * @example
 * With file content:
 * ```
 * ├── src
 * │   └── index.js: console.log('Hello world');
 * └── package.json: {"name": "example"}
 * ```
 * 
 * @param text - ASCII tree text to parse
 * @returns The parsed FileNode structure
 * @throws {Error} On invalid tree structure, indentation, or nesting
 */
export function parseTextTree(text: string): FileNode {
  const lines = text.split(EOL).filter(line => line.trim());
  const tree: FileNode = {};
  const stack: { node: FileNode; depth: number }[] = [{ node: tree, depth: 0 }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const itemStart = line.indexOf('├──') !== -1 ? line.indexOf('├──') : line.indexOf('└──');
    if (itemStart === -1) {
      throw new Error(`Invalid tree structure at line ${i + 1}: '${line}'`);
    }

    const indent = line.slice(0, itemStart);
    const depth = indent.length / 4;
    const expectedIndent = depth === 0 ? '' : '│   '.repeat(depth);

    if (indent !== expectedIndent) {
      throw new Error(`Invalid indentation at line ${i + 1}: '${line}' - Expected '${expectedIndent}├──' or '${expectedIndent}└──'`);
    }

    // Adjust stack first
    while (stack.length > depth + 1) stack.pop();

    // Then check for invalid depth jump
    if (depth > stack.length) {
      throw new Error(`Invalid nesting at line ${i + 1}: '${line}' - too deep`);
    }

    const parent = stack[stack.length - 1].node;

    const contentStart = line.indexOf(':');
    const name = contentStart !== -1
      ? line.slice(itemStart + 4, contentStart).trim()
      : line.slice(itemStart + 4).trim();
    const content = contentStart !== -1 ? line.slice(contentStart + 1).trim() : null;

    let hasChildren = false;
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const nextItemStart = nextLine.indexOf('├──') !== -1 ? nextLine.indexOf('├──') : nextLine.indexOf('└──');
      const nextDepth = nextItemStart >= 0 ? nextLine.slice(0, nextItemStart).length / 4 : depth;
      if (nextDepth === depth + 1) { // Only immediate children
        hasChildren = true;
      }
    }

    if (hasChildren) {
      parent[name] = {};
      stack.push({ node: parent[name] as FileNode, depth: depth + 1 });
    } else {
      parent[name] = content;
    }
  }

  return tree;
}