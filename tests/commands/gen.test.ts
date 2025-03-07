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

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });
});