const fs = require('fs-extra');
const path = require('path');
const {execSync} = require('child_process');

afterEach(() => {
  jest.restoreAllMocks();
});

describe("tree CLI", () => {
  const testDir = path.join(__dirname, "test_dir");
  const filePath = path.join(testDir, "file.txt");
  const subDir = path.join(testDir, "subfolder");

  beforeAll(() => {
    fs.ensureDirSync(subDir);
    fs.writeFileSync(filePath, "Sample text");
  });


  afterAll(() => {
    fs.removeSync(testDir);
  });

  test("prints directory structure", () => {
    const output = execSync(`tree view ${testDir}`).toString();
    expect(output).toContain("Directory structure of");
    expect(output).toContain("subfolder");
    expect(output).toContain("file.txt");
  });


  test("handles non-existent directory", () => {
    try {
      execSync(`tree view non_existent_dir`);
    } catch (error) {
      expect(error.stderr.toString()).toContain("❌ Directory does not exist!");
    }
  });


  test("respects .gentreerc exclusions", () => {
    fs.writeFileSync(path.join(testDir, ".gentreerc"), JSON.stringify({ exclude: ["subfolder"] }));
    const output = execSync(`cd ${testDir} \n  tree view ${testDir}`).toString();
    expect(output).toContain("Directory structure of");
    expect(output).not.toContain("subfolder");
  });

  test("respects --gitignore flag", () => {
    fs.writeFileSync(path.join(testDir, ".gitignore"), "file.txt");
    const output = execSync(`cd ${testDir}\n  tree view ${testDir} --gitignore`).toString();
    expect(output).not.toContain("file.txt");
  });
});
