# TreeCraft

A powerful CLI for directory visualization, generation, and analysis, designed for developers and testers.

> **For complete documentation with all options and detailed examples, see [DOCUMENTATION.md](DOCUMENTATION.md)**

## Installation

```bash
# Install globally
npm install -g treecraft

# Or use directly from the repo
git clone https://github.com/TheAlphamerc/treecraft.git
cd treecraft
npm install
npm run build
```

## Commands

### `viz [path]`
Visualize directory structure in various formats.

- `-m, --mode <mode>`: Visualization mode [default: tree]
  - `tree`: Traditional ASCII tree structure
  - `graph`: Hierarchical graph with weighted branches
  - `list`: Flat list of all paths
  - `interactive`: Browse directories and files interactively
- `-d, --depth <n>`: Limit depth (e.g., 2)
- `-e, --exclude <patterns>`: Exclude patterns (comma-separated, e.g., "node_modules,dist")
- `-f, --filter <patterns>`: Filter patterns (comma-separated, e.g., "*.ts,*.js")
- `-c, --color`: Enable colored output
- `-x, --export <format>`: Export as text, json, or yaml
- `--with-metadata`: Include size and modification time
- `-o, --output-file <file>`: Write output to file

**Examples:**
```bash
# Default tree view with colors
treecraft viz . -c

# Graph visualization with metadata
treecraft viz ./src -m graph --with-metadata

# Interactive directory browser
treecraft viz . -m interactive

# Export filtered JSON
treecraft viz ./src -f "*.ts" -x json -o src.json

# Limit depth and exclude directories
treecraft viz . -d 1 -e "dist,node_modules"
```

### `gen <input> -o <path>`
Generate directory structure from a specification file.

- `-o, --output <path>`: Output directory (required)
- `-s, --skip-all`: Skip existing files/directories
- `-w, --overwrite-all`: Overwrite existing files/directories

**Supported Input Formats:**
- JSON: Nested object structure
- YAML: Nested object structure
- Text: ASCII tree format

**Examples:**
```bash
# Generate from JSON specification
treecraft gen spec.json -o ./project

# Generate with conflict resolution
treecraft gen spec.yaml -o ./project -s  # Skip existing files

# Generate with overwrite
treecraft gen spec.txt -o ./project -w   # Overwrite existing files
```

**Example Specification (JSON):**
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

### `stats [path]`
Analyze and display directory statistics.

- `-s, --size-dist`: Show size distribution (<1KB, 1KB-1MB, >1MB)
- `-x, --export <format>`: Export as text, json, or yaml
- `-f, --filter <patterns>`: Filter patterns (comma-separated)
- `-e, --exclude <patterns>`: Exclude patterns (comma-separated)
- `-d, --depth <n>`: Limit depth for statistics
- `-t, --file-types`: Show file type breakdown
- `-r, --sort <key>`: Sort distribution by size or count [default: count]

**Examples:**
```bash
# Basic statistics
treecraft stats .

# Comprehensive statistics for JavaScript files
treecraft stats . -s -t -f "*.js"

# Export statistics as JSON
treecraft stats . -x json -o stats.json

# Sort size distribution by size
treecraft stats . -s -r size
```

### `search [path] <query>`
Search for files by name.

- `-t, --ext <extension>`: Filter by file extension (e.g., ".ts", ".js")
- `-d, --depth <n>`: Limit search depth
- `-f, --filter <patterns>`: Include only specific patterns
- `-e, --exclude <patterns>`: Exclude patterns
- `-x, --export <format>`: Export results as text, json, or yaml

**Examples:**
```bash
# Basic search
treecraft search . utils

# Search only TypeScript files
treecraft search . utils -t ".ts"

# Export search results
treecraft search . config -x yaml > results.yaml
```

## Visualization Modes

### Tree Mode
The default visualization mode, displaying a traditional ASCII tree structure.

```
├── src
│   ├── components
│   │   └── Button.tsx
│   └── index.ts
└── package.json
```

### Graph Mode
A hierarchical graph with weighted branches. Larger directories are shown first.

```
Root
  ├── src
  │     ├── components
  │     │       └── Button.tsx
  │     └── index.ts
  └── package.json
```

With metadata:
```
Root
  ├── src [D, 4096B]
  │     ├── components [D, 4096B]
  │     │       └── Button.tsx [F, 256B]
  │     └── index.ts [F, 128B]
  └── package.json [F, 512B]
```

### List Mode
A flat list of all paths in the directory structure.

```
src
src/components
src/components/Button.tsx
src/index.ts
package.json
```

### Interactive Mode
An interactive browser that allows navigation through the directory structure using arrow keys and Enter.

## File Format Support

### Input Formats (for gen command)
- **JSON**: Nested object structure
- **YAML**: Nested object structure
- **Text**: ASCII tree format

### Export Formats (for all commands)
- **Text**: Human-readable formatted output
- **JSON**: Machine-readable JSON format
- **YAML**: Human-readable YAML format

## Error Handling

TreeCraft provides detailed error messages for various scenarios:
- Invalid paths or non-existent directories
- Permission issues
- Format validation errors
- Input/output conflicts

## Documentation

For complete documentation of all features, options, and advanced usage examples, refer to [DOCUMENTATION.md](DOCUMENTATION.md).

## Contributing

1. Clone: `git clone https://github.com/TheAlphamerc/treecraft.git`
2. Install: `npm install`
3. Build: `npm run build`
4. Test: `npm test`

### Running Tests
The project uses Jest for testing. Run tests with:

```bash
npm test              # Run all tests
npm test -- [pattern] # Run specific tests
```