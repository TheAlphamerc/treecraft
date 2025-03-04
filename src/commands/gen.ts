import { Command } from 'commander';
import { readFileSync, mkdirSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';
import { load } from 'js-yaml';
import { formatTree } from '../lib/formatters';

export const genCommand = new Command()
  .name('gen')
  .description('Generate directory structure')
  .argument('<input>', 'Input file (JSON/YAML)')
  .requiredOption('--output <path>', 'Output directory')
  .option('--dry-run', 'Preview without creating')
  .option('--skip-all', 'Skip all conflicts')
  .option('--export <format>', 'Export format (text, json, yaml)')
  .action((input, options) => {
    const spec = load(readFileSync(input, 'utf-8')) || {};
    if (options.dryRun) {
      console.log(formatTree(spec, { export: options.export || 'text' }));
      return;
    }
    generateStructure(spec, options.output, options);
    if (options.export) {
      console.log(formatTree(spec, options));
    }
  });

function generateStructure(spec: any, output: string, options: any) {
  for (const [name, content] of Object.entries(spec)) {
    const path = join(output, name);
    if (typeof content === 'object' && content !== null) {
      mkdirSync(path, { recursive: true });
      generateStructure(content, path, options);
    } else {
      if (options.skipAll && statSync(path, { throwIfNoEntry: false })) continue;
      // @ts-ignore
      writeFileSync(path, content || '');
    }
  }
}