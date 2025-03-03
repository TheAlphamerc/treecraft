const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');


const GEN_STRUCT_PATH = path.resolve(__dirname, '../gen-struct.js');

describe('gen-struct CLI', () => {
  let tempDir;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-struct-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Cleanup temporary directory
    fs.removeSync(tempDir);
  });

  test('should create directory structure as per JSON configuration', () => {
    const structure = {
      "test-project": {
        "src": {
          "index.js": "// index file",
          "components": {
            "header.js": "// header component"
          }
        },
        "README.md": "# Test Project"
      }
    };
    const configPath = path.join(tempDir, 'structure.json');
    fs.writeJsonSync(configPath, structure, { spaces: 2 });

    const result = spawnSync('node', [GEN_STRUCT_PATH, configPath], { encoding: 'utf8' });
    expect(result.stderr).toBe('');

    const projectDir = path.join(tempDir, 'test-project');
    expect(fs.existsSync(projectDir)).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'index.js'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'components', 'header.js'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'README.md'))).toBe(true);
  });

  test('should skip existing files when --skip-all flag is provided', () => {
    const structure = {
      "test-project": {
        "file.txt": "New content"
      }
    };
    const configPath = path.join(tempDir, 'structure.json');
    fs.writeJsonSync(configPath, structure, { spaces: 2 });

    const projectDir = path.join(tempDir, 'test-project');
    fs.ensureDirSync(projectDir);
    const filePath = path.join(projectDir, 'file.txt');
    fs.writeFileSync(filePath, "Existing content");

    const result = spawnSync('node', [GEN_STRUCT_PATH, configPath, '--skip-all'], { encoding: 'utf8' });
    expect(result.stderr).toBe('');

    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toBe("Existing content");
  });

  test('should overwrite existing files when --overwrite-all flag is provided', () => {
    const structure = {
      "test-project": {
        "file.txt": "New content"
      }
    };
    const configPath = path.join(tempDir, 'structure.json');
    fs.writeJsonSync(configPath, structure, { spaces: 2 });

    const projectDir = path.join(tempDir, 'test-project');
    fs.ensureDirSync(projectDir);
    const filePath = path.join(projectDir, 'file.txt');
    fs.writeFileSync(filePath, "Existing content");

    const result = spawnSync('node', [GEN_STRUCT_PATH, configPath, '--overwrite-all'], { encoding: 'utf8' });
    expect(result.stderr).toBe('');

    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toBe("New content");
  });
});
