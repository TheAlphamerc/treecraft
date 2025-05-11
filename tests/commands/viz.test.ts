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
      expect((err as ExecException).message).toContain('ValidationError');
    }
  });

  it('includes metadata when requested', () => {
    const output = execSync(`node dist/index.js viz ${testDir} -w`, { encoding: 'utf-8' });
    expect(output).toContain('F,'); // File indicator
    expect(output).toContain('B'); // Size in bytes
  });

  it('respects depth limits', () => {
    // Create nested directories
    mkdirSync(join(testDir, 'level1', 'level2', 'level3'), { recursive: true });
    writeFileSync(join(testDir, 'level1', 'level2', 'level3', 'deep.txt'), 'deep file');

    // Test with depth 1
    const output1 = execSync(`node dist/index.js viz ${testDir} -d 1`, { encoding: 'utf-8' });
    expect(output1).toContain('level1');
    expect(output1).toContain('src');
    expect(output1).not.toContain('level2');

    // Test with depth 2
    const output2 = execSync(`node dist/index.js viz ${testDir} -d 2`, { encoding: 'utf-8' });
    expect(output2).toContain('level1');
    expect(output2).toContain('level2');
    expect(output2).not.toContain('level3');
  });

  it('exports in YAML format', () => {
    const outFile = join(testDir, 'structure.yaml');
    execSync(`node dist/index.js viz ${testDir} -x yaml -o ${outFile}`, { encoding: 'utf-8' });
    const content = readFileSync(outFile, 'utf-8');
    expect(content).toContain('src:');
    expect(content).toContain('main.ts:');
    expect(content).toContain('utils.js:');
  });

  it('works with list mode', () => {
    const output = execSync(`node dist/index.js viz ${testDir} -m list`, { encoding: 'utf-8' });
    expect(output).toContain('src/main.ts');
    expect(output).toContain('src/utils.js');
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });
});