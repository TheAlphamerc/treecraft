import { Option } from 'commander';

/**
 * Collection of common command options used across multiple commands
 * 
 * These shared option definitions ensure consistent behavior and help text
 * for options used in multiple commands.
 */

/**
 * Option for specifying the maximum depth to traverse
 */
export const depthOption = new Option('-d, --depth <n>', 'Limit depth')
  .argParser(parseInt);

/**
 * Option for specifying patterns to exclude
 */
export const excludeOption = new Option('-e, --exclude <patterns>', 'Exclude patterns (comma-separated)')
  .argParser(String);

/**
 * Option for specifying patterns to include
 */
export const filterOption = new Option('-f, --filter <patterns>', 'Include only patterns (comma-separated)')
  .argParser(String);

/**
 * Option for exporting in various formats
 */
export const exportOption = new Option('-x, --export <format>', 'Export format (text, json, yaml)')
  .choices(['text', 'json', 'yaml']);

/**
 * Option for writing output to a file
 */
export const outputFileOption = new Option('-o, --output-file <file>', 'Write output to file');

/**
 * Option for enabling colored output
 */
export const colorOption = new Option('-c, --color', 'Enable colored output');

/**
 * Option for including metadata in output
 */
export const metadataOption = new Option('--with-metadata', 'Include metadata (size, modification time)');

/**
 * Option for specifying visualization mode
 */
export const modeOption = new Option('-m, --mode <mode>', 'Visualization mode')
  .choices(['tree', 'graph', 'list', 'interactive'])
  .default('tree');

/**
 * Option for specifying sort order
 */
export const sortOption = new Option('-r, --sort <key>', 'Sort distribution order')
  .choices(['size', 'count'])
  .default('count');

/**
 * Option for showing size distribution
 */
export const sizeDistOption = new Option('-s, --size-dist', 'Show size distribution');

/**
 * Option for showing file type breakdown
 */
export const fileTypesOption = new Option('-t, --file-types', 'Show file type breakdown');

/**
 * Option for filtering by file extension
 * Using a different flag to avoid conflict with file-types option
 */
export const extensionOption = new Option('--ext <extension>', 'Filter by file extension (e.g. .ts, .js)'); 