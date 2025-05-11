import { execSync, ExecException } from 'child_process';
import { join } from 'path';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'fs';
import { baseTestDir } from '../setup';

describe('gen command', () => {
  const testDir = join(baseTestDir, 'gen');

  beforeEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
  });

  it('generates from JSON', () => {
    const specFile = join(testDir, 'spec.json');
    writeFileSync(specFile, JSON.stringify({ src: { 'main.ts': 'console.log("hi")' } }));
    const outDir = join(testDir, 'project');
    execSync(`node dist/index.js gen ${specFile} -o ${outDir}`, { encoding: 'utf-8' });
    expect(existsSync(join(outDir, 'src', 'main.ts'))).toBe(true);
    expect(readFileSync(join(outDir, 'src', 'main.ts'), 'utf-8')).toBe('console.log("hi")');
  });

  it('fails on invalid input', () => {
    const specFile = join(testDir, 'spec.bad');
    writeFileSync(specFile, 'invalid');
    try {
      execSync(`node dist/index.js gen ${specFile} -o ${testDir}/out`, { encoding: 'utf-8' });
      throw new Error('Command should have failed');
    } catch (err) {
      expect((err as ExecException).message).toContain('Error');
    }
  });

  it('generates from YAML', () => {
    const specFile = join(testDir, 'spec.yaml');
    writeFileSync(specFile, 'src:\n  main.ts: console.log("yaml")\n  utils.js: alert("utils")');
    const outDir = join(testDir, 'project-yaml');
    execSync(`node dist/index.js gen ${specFile} -o ${outDir}`, { encoding: 'utf-8' });
    expect(existsSync(join(outDir, 'src', 'main.ts'))).toBe(true);
    expect(existsSync(join(outDir, 'src', 'utils.js'))).toBe(true);
    expect(readFileSync(join(outDir, 'src', 'main.ts'), 'utf-8')).toBe('console.log("yaml")');
  });

  it('generates from text tree', () => {
    const specFile = join(testDir, 'spec.txt');
    const treeContent = '├── src\n│   ├── main.ts: console.log("text")\n│   └── utils.js: const x = 5;';
    writeFileSync(specFile, treeContent);
    const outDir = join(testDir, 'project-text');
    execSync(`node dist/index.js gen ${specFile} -o ${outDir}`, { encoding: 'utf-8' });
    expect(existsSync(join(outDir, 'src', 'main.ts'))).toBe(true);
    expect(existsSync(join(outDir, 'src', 'utils.js'))).toBe(true);
    expect(readFileSync(join(outDir, 'src', 'main.ts'), 'utf-8')).toBe('console.log("text")');
  });

  it('skips existing files with --skip-all', () => {
    // First create an output directory with a file
    const outDir = join(testDir, 'existing');
    mkdirSync(join(outDir, 'src'), { recursive: true });
    writeFileSync(join(outDir, 'src', 'main.ts'), 'original content');

    // Try to generate over it with skip-all
    const specFile = join(testDir, 'spec.json');
    writeFileSync(specFile, JSON.stringify({ src: { 'main.ts': 'new content' } }));
    execSync(`node dist/index.js gen ${specFile} -o ${outDir} -s`, { encoding: 'utf-8' });

    // Check the file wasn't overwritten
    expect(readFileSync(join(outDir, 'src', 'main.ts'), 'utf-8')).toBe('original content');
  });

  it('overwrites existing files with --overwrite-all', () => {
    // First create an output directory with a file
    const outDir = join(testDir, 'overwrite');
    mkdirSync(join(outDir, 'src'), { recursive: true });
    writeFileSync(join(outDir, 'src', 'main.ts'), 'original content');

    // Try to generate over it with overwrite-all
    const specFile = join(testDir, 'spec.json');
    writeFileSync(specFile, JSON.stringify({ src: { 'main.ts': 'new content' } }));
    execSync(`node dist/index.js gen ${specFile} -o ${outDir} -w`, { encoding: 'utf-8' });

    // Check the file was overwritten
    expect(readFileSync(join(outDir, 'src', 'main.ts'), 'utf-8')).toBe('new content');
  });

  it('fails on existing output without skip/overwrite flags', () => {
    // First create an output directory
    const outDir = join(testDir, 'conflict');
    mkdirSync(outDir, { recursive: true });

    // Try to generate with no conflict resolution flags
    const specFile = join(testDir, 'spec.json');
    writeFileSync(specFile, JSON.stringify({ file: 'content' }));

    try {
      execSync(`node dist/index.js gen ${specFile} -o ${outDir}`, { encoding: 'utf-8' });
      throw new Error('Command should have failed');
    } catch (err) {
      expect((err as ExecException).message).toContain('Error');
      expect((err as ExecException).message).toContain('already exists');
    }
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });
});