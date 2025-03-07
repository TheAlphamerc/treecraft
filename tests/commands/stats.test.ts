import { execSync } from 'child_process';
import { join } from 'path';
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'fs';
import { baseTestDir } from '../setup';

describe('stats command', () => {
  const testDir = join(baseTestDir, 'stats');

  beforeEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(join(testDir, 'src'), { recursive: true });
    writeFileSync(join(testDir, 'src', 'main.ts'), 'console.log("hello");');
    writeFileSync(join(testDir, 'src', 'utils.js'), 'var x = 1;');
  });

  it('shows basic stats', () => {
    const output = execSync(`node dist/index.js stats ${testDir}`, { encoding: 'utf-8' });
    expect(output).toContain('Files: 2');
    expect(output).toContain('Dirs: 1');
    expect(output).toContain('Total Size:');
  });

  it('includes size distribution', () => {
    const output = execSync(`node dist/index.js stats ${testDir} -s`, { encoding: 'utf-8' });
    expect(output).toContain('Size Distribution:');
    expect(output).toMatch(/<1KB\s+\|\s+2\s+\|/);
  });

  it('handles empty directory', () => {
    const emptyDir = join(testDir, 'empty');
    mkdirSync(emptyDir, { recursive: true });
    const output = execSync(`node dist/index.js stats ${emptyDir}`, { encoding: 'utf-8' });
    expect(output).toContain('Files: 0');
    expect(output).toContain('Dirs: 0');
    expect(output).toContain('Total Size: 0B');
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });
});