#!/usr/bin/env node

const { program } = require("commander");
const fs = require("fs-extra");
const path = require("path");

program
  .version("1.0.0")
  .description("CLI to generate folder and file structures")
  .argument("<jsonConfig>", "Path to JSON configuration file")
  .action((jsonConfig) => {
    try {
      const structure = JSON.parse(fs.readFileSync(jsonConfig, "utf8"));
      createStructure(structure, process.cwd());
      console.log("✅ Directory structure created successfully!");
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
  });

program.parse(process.argv);

/**
 * Recursively creates directories and files based on given structure
 * @param {Object} structure - Directory structure object
 * @param {string} rootPath - Root directory path
 */
function createStructure(structure, rootPath) {
  Object.keys(structure).forEach((key) => {
    const fullPath = path.join(rootPath, key);

    if (typeof structure[key] === "object") {
      fs.ensureDirSync(fullPath);
      createStructure(structure[key], fullPath);
    } else {
      fs.ensureFileSync(fullPath);
      fs.writeFileSync(fullPath, structure[key] || ""); // Write default content if provided
    }
  });
}
