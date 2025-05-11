import { ValidationError } from './errors';

/**
 * Processes a comma-separated string of patterns into an array of trimmed strings
 * 
 * This function is used to process filter and exclude patterns for the
 * viz, stats, and search commands.
 * 
 * @param patterns - Comma-separated patterns string
 * @returns Array of trimmed pattern strings
 */
export function processPatterns(patterns?: string): string[] {
  return patterns ? patterns.split(',').map(p => p.trim()) : [];
}

/**
 * Validates that an export format is one of the supported formats
 * 
 * @param format - The export format to validate
 * @throws ValidationError if the format is invalid
 */
export function validateExportFormat(format?: string): void {
  if (format && !['text', 'json', 'yaml'].includes(format)) {
    throw new ValidationError(`Invalid export format: '${format}'. Use 'text', 'json', or 'yaml'.`);
  }
}

/**
 * Gets a depth value from options, with fallback to Infinity
 * 
 * @param depth - The depth option value
 * @returns The depth as a number, or Infinity if not specified
 */
export function getDepthValue(depth?: number): number {
  return depth !== undefined ? depth : Infinity;
}

/**
 * Validates the tree mode option
 * 
 * @param mode - The visualization mode
 * @throws ValidationError if the mode is invalid
 */
export function validateTreeMode(mode?: string): void {
  const validModes = ['tree', 'graph', 'list', 'interactive'];
  if (mode && !validModes.includes(mode)) {
    throw new ValidationError(`Invalid mode: '${mode}'. Valid modes are: ${validModes.join(', ')}`);
  }
}

/**
 * Validates the sort option for size distribution
 * 
 * @param sort - The sort option
 * @throws ValidationError if the sort option is invalid
 */
export function validateSortOption(sort?: string): void {
  if (sort && !['size', 'count'].includes(sort)) {
    throw new ValidationError(`Invalid sort option: '${sort}'. Use 'size' or 'count'.`);
  }
} 