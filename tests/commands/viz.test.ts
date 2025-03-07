import { execSync, ExecException } from 'child_process';
import { join } from 'path';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from 'fs';
import { baseTestDir } from '../setup';

describe('viz command', () => {
  const testDir = join(baseTestDir, 'viz');

  beforeEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(join(testDir, 'src'), { recursive: true });
    writeFileSync(join(testDir, 'src', 'main.ts'), 'console.log("hello");');
    writeFileSync(join(testDir, 'src', 'utils.js'), 'var x = 1;');
  });

  it('displays tree with color', () => {
    const output = execSync(`node dist/index.js viz ${testDir} -c`, { encoding: 'utf-8' });
    expect(output).toContain('Tree:');
    expect(output).toContain('src');
    expect(output).toContain('main.ts');
  });

  it('exports filtered JSON to file', () => {
    const outFile = join(testDir, 'structure.json');
    execSync(`node dist/index.js viz ${testDir} -f "*.ts" -x json -o ${outFile}`, { encoding: 'utf-8' });
    const content = JSON.parse(readFileSync(outFile, 'utf-8'));
    expect(content).toEqual({ 'src': { 'main.ts': null } });
  });

  it('handles non-existent path', () => {
    try {
      execSync(`node dist/index.js viz ./nonexistent -c`, { encoding: 'utf-8' });
      throw new Error('Command should have failed');
    } catch (err) {
      expect((err as ExecException).message).toContain('ENOENT');
    }
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });
});