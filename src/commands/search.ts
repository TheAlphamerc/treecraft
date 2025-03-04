import { Command } from 'commander';
import { buildTree } from '../lib/fs-utils';
import { formatTree } from '../lib/formatters';
import { FileNode } from '../types';

export const searchCommand = new Command()
  .name('search')
  .description('Search files by name')
  .argument('[path]', 'Directory to search', '.')
  .argument('<query>', 'Search term')
  .option('--ext <pattern>', 'Limit to extensions')
  .option('--export <format>', 'Export format (text, json, yaml)')
  .action((path, query, options) => {
    const tree = buildTree(path, options);
    const results = searchTree(tree, query, options);
    console.log(formatTree(results, options));
  });

function searchTree(tree: FileNode | null | string, query: string, options: any): any {
  const results: any = {};
  if (!tree || tree === null) return results;
  if (typeof tree === 'string') {
    if (tree.includes(query)) {
      results[tree] = null;
    }
  } else {
    console.log({ tree });
    const j = Object.entries(tree);
    for (const [key, value] of Object.entries(tree)) {
      if (key.includes(query) && (!options.ext || key.endsWith(options.ext))) {
        results[key] = value;
      } else if (typeof value === 'object') {
        const subResults = searchTree(value, query, options);
        if (Object.keys(subResults).length) results[key] = subResults;
      }
    }
  }
  return results;
}