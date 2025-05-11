# TreeCraft CLI Documentation

TreeCraft is a powerful command-line interface (CLI) tool for visualizing, generating, and analyzing directory structures. This documentation provides detailed information about all available commands, options, and usage examples.

## Table of Contents

- [Installation](#installation)
- [Commands Overview](#commands-overview)
- [Visualization Command (`viz`)](#visualization-command-viz)
- [Statistics Command (`stats`)](#statistics-command-stats)
- [Search Command (`search`)](#search-command-search)
- [Generate Command (`gen`)](#generate-command-gen)
- [Export Formats](#export-formats)
- [Common Options](#common-options)
- [Usage Examples](#usage-examples)

## Installation

```bash
# Install globally from npm
npm install -g treecraft

# Or clone the repository and build locally
git clone https://github.com/TheAlphamerc/treecraft.git
cd treecraft
npm install
npm run build

# Run locally with node
node dist/index.js [command] [options]

# Or create an alias for easier access
alias treecraft='node /path/to/treecraft/dist/index.js'
```

## Commands Overview

TreeCraft provides the following main commands:

- `viz`: Visualize directory structures in various formats
- `stats`: Analyze and display directory statistics
- `search`: Search for files by name within a directory
- `gen`: Generate directory structures from specification files
- `help`: Display detailed help information

## Visualization Command (`viz`)

The `viz` command allows you to visualize directory structures in different formats.

```bash
treecraft viz [path] [options]
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--mode <mode>` | `-m` | Visualization mode: `tree` (default), `graph`, `list`, `interactive` |
| `--depth <n>` | `-d` | Limit tree depth to n levels |
| `--exclude <patterns>` | `-e` | Exclude patterns (comma-separated, e.g., "node_modules,dist") |
| `--filter <patterns>` | `-f` | Include only patterns (comma-separated, e.g., "*.ts,*.js") |
| `--color` | `-c` | Enable colored output |
| `--export <format>` | `-x` | Export format: `text`, `json`, or `yaml` |
| `--with-metadata` | | Include size and modification time in output |
| `--output-file <file>` | `-o` | Write output to file |

### Mode Details

- **tree**: Traditional ASCII tree structure (default)
- **graph**: Hierarchical graph with weighted branches
- **list**: Flat list of all paths
- **interactive**: Browse directories and files interactively

## Statistics Command (`stats`)

The `stats` command analyzes and displays statistics about directory contents.

```bash
treecraft stats [path] [options]
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--size-dist` | `-s` | Show size distribution (<1KB, 1KB-1MB, >1MB) |
| `--export <format>` | `-x` | Export format: `text`, `json`, or `yaml` |
| `--filter <patterns>` | `-f` | Include only patterns (comma-separated) |
| `--exclude <patterns>` | `-e` | Exclude patterns (comma-separated) |
| `--depth <n>` | `-d` | Limit statistics to depth n |
| `--file-types` | `-t` | Show file type breakdown |
| `--sort <key>` | `-r` | Sort distribution by `size` or `count` (default: count) |
| `--output-file <file>` | `-o` | Write output to file |

## Search Command (`search`)

The `search` command finds files by name in a directory structure.

```bash
treecraft search [path] <query> [options]
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--ext <extension>` | | Filter by file extension (e.g., ".ts", ".js") |
| `--depth <n>` | `-d` | Limit search depth to n levels |
| `--filter <patterns>` | `-f` | Include only patterns (comma-separated) |
| `--exclude <patterns>` | `-e` | Exclude patterns (comma-separated) |
| `--export <format>` | `-x` | Export format: `text`, `json`, or `yaml` |

## Generate Command (`gen`)

The `gen` command creates directory structures from specification files (JSON, YAML, or text tree format).

```bash
treecraft gen <input> -o <output> [options]
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--output <path>` | `-o` | Output directory (required) |
| `--skip-all` | `-s` | Skip existing files/directories |
| `--overwrite-all` | `-w` | Overwrite existing files/directories |

### Input Specification Formats

#### JSON Format Example
```json
{
  "src": {
    "index.ts": "console.log('Hello World');",
    "utils": {
      "helpers.ts": "export function add(a, b) { return a + b; }"
    }
  },
  "package.json": "{\"name\": \"example\", \"version\": \"1.0.0\"}"
}
```

#### YAML Format Example
```yaml
src:
  index.ts: "console.log('Hello World');"
  utils:
    helpers.ts: "export function add(a, b) { return a + b; }"
package.json: "{\"name\": \"example\", \"version\": \"1.0.0\"}"
```

#### Text Tree Format Example
```
├── src
│   ├── index.ts: console.log('Hello World');
│   └── utils
│       └── helpers.ts: export function add(a, b) { return a + b; }
└── package.json: {"name": "example", "version": "1.0.0"}
```

## Export Formats

TreeCraft can export results in the following formats:

- **text**: Human-readable formatted output (default)
- **json**: Machine-readable JSON format
- **yaml**: Human-readable YAML format

## Common Options

These options are available in multiple commands:

| Option | Description |
|--------|-------------|
| `--depth <n>` | Limit depth to n levels |
| `--exclude <patterns>` | Exclude patterns (comma-separated) |
| `--filter <patterns>` | Include only patterns (comma-separated) |
| `--export <format>` | Export format: text, json, or yaml |
| `--output-file <file>` | Write output to file |

### Filter and Exclude Patterns

- `*.ext` - Matches files with the given extension (e.g., "*.ts" matches "file.ts")
- `name` - Matches exact name (e.g., "README.md" matches only "README.md")
- `prefix` - Matches items starting with prefix (e.g., "test" matches "test_file.js", "testing.ts")

## Usage Examples

### Visualization Examples

```bash
# Default tree view with colors
treecraft viz . -c

# Graph visualization with metadata, excluding node_modules
treecraft viz . -m graph --with-metadata -e "node_modules"

# Interactive directory browser
treecraft viz . -m interactive

# Export filtered JSON
treecraft viz ./src -f "*.ts" -x json -o src-structure.json

# Limit depth and exclude directories
treecraft viz . -d 1 -e "dist,node_modules"
```

### Statistics Examples

```bash
# Basic statistics
treecraft stats .

# Statistics with size distribution and file type breakdown
treecraft stats . -s -t

# Export statistics as JSON
treecraft stats . -x json -o stats.json

# Sort size distribution by size
treecraft stats . -s -r size

# Statistics excluding specific directories
treecraft stats . -e "node_modules,dist"
```

### Search Examples

```bash
# Basic search
treecraft search . utils

# Search only TypeScript files
treecraft search . utils --ext ".ts"

# Export search results
treecraft search . config -x yaml > search-results.yaml

# Search with depth limit and exclusions
treecraft search . components -d 2 -e "node_modules"
```

### Generation Examples

```bash
# Generate from JSON specification
treecraft gen spec.json -o ./project

# Generate with conflict resolution - skip existing files
treecraft gen spec.yaml -o ./project -s

# Generate with conflict resolution - overwrite existing files
treecraft gen spec.txt -o ./project -w
```

For more information and updates, visit the [TreeCraft GitHub repository](https://github.com/TheAlphamerc/treecraft). 
