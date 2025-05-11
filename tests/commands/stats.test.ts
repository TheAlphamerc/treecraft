import { execSync } from 'child_process';
import { join } from 'path';
import { mkdirSync, writeFileSync, readdirSync, rmSync, readFileSync } from 'fs';
import { baseTestDir } from '../setup';
import { ExecException } from 'child_process';

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

  it('shows file type breakdown', () => {
    const output = execSync(`node dist/index.js stats ${testDir} -t`, { encoding: 'utf-8' });
    expect(output).toContain('File Types:');
    expect(output).toContain('.ts');
    expect(output).toContain('.js');
  });

  it('exports as JSON', () => {
    const outFile = join(testDir, 'stats.json');
    execSync(`node dist/index.js stats ${testDir} -x json > ${outFile}`, { encoding: 'utf-8' });
    const content = JSON.parse(readFileSync(outFile, 'utf-8'));
    expect(content).toHaveProperty('files', 3);
    expect(content).toHaveProperty('dirs', 1);
    expect(content).toHaveProperty('totalSize');
  });

  it('exports as YAML', () => {
    const outFile = join(testDir, 'stats.yaml');
    execSync(`node dist/index.js stats ${testDir} -x yaml > ${outFile}`, { encoding: 'utf-8' });
    const content = readFileSync(outFile, 'utf-8');
    expect(content).toContain('files:'); // YAML format
    expect(content).toContain('dirs:');
    expect(content).toContain('totalSize:');
  });

  it('rejects invalid export format', () => {
    try {
      execSync(`node dist/index.js stats ${testDir} -x invalid-format`, { encoding: 'utf-8' });
      throw new Error('Command should have failed');
    } catch (err) {
      expect((err as ExecException).message).toContain("error: option '-x, --export <format>' argument 'invalid-format' is invalid");
    }
  });

  it('rejects invalid sort option', () => {
    try {
      execSync(`node dist/index.js stats ${testDir} -s -r invalid-sort`, { encoding: 'utf-8' });
      throw new Error('Command should have failed');
    } catch (err) {
      expect((err as ExecException).message).toContain("error: option '-r, --sort <key>' argument 'invalid-sort' is invalid");
    }
  });

  it('sorts size distribution by size', () => {
    // Create files of different sizes first
    writeFileSync(join(testDir, 'large.bin'), Buffer.alloc(2 * 1024 * 1024));  // 2MB
    writeFileSync(join(testDir, 'medium.bin'), Buffer.alloc(500 * 1024));      // 500KB

    const output = execSync(`node dist/index.js stats ${testDir} -s -r size`, { encoding: 'utf-8' });

    // Check that >1MB appears in the output and is before the other size categories
    expect(output).toContain('>1MB');
    expect(output.indexOf('>1MB')).toBeLessThan(output.indexOf('1KB-1MB'));
    expect(output.indexOf('1KB-1MB')).toBeLessThan(output.indexOf('<1KB'));
  });

  it('respects filter patterns', () => {
    const output = execSync(`node dist/index.js stats ${testDir} -f "*.ts"`, { encoding: 'utf-8' });
    expect(output).toContain('Files: 1');  // Only main.ts
  });

  it('writes output to file with output-file option', () => {
    const outFile = join(testDir, 'output-stats.txt');
    execSync(`node dist/index.js stats ${testDir} -o ${outFile}`, { encoding: 'utf-8' });

    // Verify file exists and contains stats
    const content = readFileSync(outFile, 'utf-8');
    expect(content).toContain('Files:');
    expect(content).toContain('Dirs:');
    expect(content).toContain('Total Size:');
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });
});