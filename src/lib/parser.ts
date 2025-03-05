import { FileNode } from '../types';
import { EOL } from 'os';

export function parseTextTree(text: string): FileNode {
  const lines = text.split(EOL).filter(line => line.trim());
  const tree: FileNode = {};
  const stack: { node: FileNode; depth: number }[] = [{ node: tree, depth: 0 }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Find the position of the item marker (├── or └──)
    const itemStart = line.indexOf('├──') !== -1 ? line.indexOf('├──') : line.indexOf('└──');
    if (itemStart === -1) {
      console.error(`Invalid tree structure at line ${i + 1}: '${line}'`);
      process.exit(1);
    }

    const indent = line.slice(0, itemStart);
    const depth = indent.length / 4;

    // Validate indentation: must match expected pattern ('' for depth 0, '│   ' repeated for depth > 0)
    const expectedIndent = depth === 0 ? '' : '│   '.repeat(depth);
    if (indent !== expectedIndent) {
      console.error(`Invalid indentation at line ${i + 1}: '${line}' - Expected '${expectedIndent}├──' or '${expectedIndent}└──'`);
      process.exit(1);
    }

    const contentStart = line.indexOf(':');
    const name = contentStart !== -1
      ? line.slice(itemStart + 4, contentStart).trim()
      : line.slice(itemStart + 4).trim();
    const content = contentStart !== -1 ? line.slice(contentStart + 1).trim() : null;

    // Validate depth
    if (depth > stack.length) {
      console.error(`Invalid nesting at line ${i + 1}: '${line}' - too deep`);
      process.exit(1);
    }

    while (stack.length > depth + 1) stack.pop();
    const parent = stack[stack.length - 1].node;

    // Check if this item has children by looking ahead
    let hasChildren = false;
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const nextItemStart = nextLine.indexOf('├──') !== -1 ? nextLine.indexOf('├──') : nextLine.indexOf('└──');
      if (nextItemStart > itemStart) {
        hasChildren = true;
      }
    }

    if (hasChildren) {
      parent[name] = {};
      stack.push({ node: parent[name] as FileNode, depth: depth + 1 });
    } else {
      parent[name] = content; // File with content or null
    }
  }

  return tree;
}