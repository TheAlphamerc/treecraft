# TreeCraft

A powerful CLI for directory visualization, generation, and analysis, designed for developers and testers. Works on macOS, Windows, and Linux.

## Installation

```bash
npm install && npm run build  # Local dev
```

## Commands

### `viz [path]`
Visualize or export directory structure.

- `-m, --mode <mode>`: Mode (tree, graph, list, interactive) [default: tree]
- `-d, --depth <n>`: Limit depth (e.g., 2)
- `-e, --exclude <patterns>`: Exclude patterns (e.g., "node_modules")
- `-f, --filter <patterns>`: Filter patterns (e.g., "*.ts")
- `-c, --color`: Colored output (yellow header, green tree)
- `-x, --export <format>`: Export as text, json, yaml
- `-w, --with-metadata`: Include size/mtime
- `-o, --output-file <file>`: Write to file

**Examples:**
```bash
treecraft viz . -c              # Show colored tree
treecraft viz ./src -f "*.ts" -x json -o src.json  # Export filtered JSON
treecraft viz . -d 1 -e "dist"  # Limit depth, exclude dist
```

### `gen <input> -o <path>`
Generate directory from a spec file (JSON, YAML, or text tree).

- `-o, --output <path>`: Output directory (required)
- `-r, --random <size>`: Random content (e.g., "10kb", "1mb")
- `-s, --skip-all`: Skip existing files/dirs
- `-w, --overwrite-all`: Overwrite existing files/dirs

**Example:**
```bash
treecraft gen spec.json -o ./project -r 5kb  # Generate with random content
```

### `stats [path]`
Display directory statistics.

- `-s, --size-dist`: Show size distribution
- `-x, --export <format>`: Export as text, json, yaml
- `-f, --filter <patterns>`: Filter patterns
- `-e, --exclude <patterns>`: Exclude patterns
- `-d, --depth <n>`: Limit depth
- `-t, --file-types`: File type breakdown
- `-r, --sort <key>`: Sort distribution (size, count) [default: count]

**Example:**
```bash
treecraft stats . -s -t -f "*.js"  # Stats for JS files
```



## Supported Formats
- **Text**: ASCII tree (viz, gen input/output).
- **JSON**: Nested object (viz export, gen input).
- **YAML**: Nested object (viz export, gen input).

## Contributing

1. Clone: `git clone https://github.com/TheAlphamerc/tree-craft.git`
2. Install: `npm install`
3. Build: `npm run build`
4. Test: `npm test`

### Running Tests
Uses Jest. Ensure `npm install` includes dev dependencies.

## Limitations
- Graph/list/interactive modes in `viz` are stubs.

