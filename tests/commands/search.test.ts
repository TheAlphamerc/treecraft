import { execSync } from 'child_process';
import { join } from 'path';
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'fs';
import { baseTestDir } from '../setup';

describe('search command', () => {
  const testDir = join(baseTestDir, 'search');

  beforeEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(join(testDir, 'src'), { recursive: true });
    writeFileSync(join(testDir, 'src', 'main.ts'), 'console.log("hello");');
    writeFileSync(join(testDir, 'src', 'utils.js'), 'var x = 1;');
  });

  it('searches by name', () => {
    const output = execSync(`node dist/index.js search ${testDir} main`, { encoding: 'utf-8' });
    expect(output).toContain('Search Results:');
    expect(output).toContain(join(testDir, 'src', 'main.ts'));
  });

  it('filters by extension', () => {
    const output = execSync(`node dist/index.js search ${testDir} .js -t ".js"`, { encoding: 'utf-8' });
    expect(output).toContain(join(testDir, 'src', 'utils.js'));
    expect(output).not.toContain('main.ts');
  });

  it('handles no matches', () => {
    const output = execSync(`node dist/index.js search ${testDir} xyz`, { encoding: 'utf-8' });
    expect(output).toContain('No matches found.');
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });
});