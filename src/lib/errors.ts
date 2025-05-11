import chalk from 'chalk';

/**
 * Custom error types for TreeCraft
 */
export enum ErrorType {
  VALIDATION = 'ValidationError',
  IO = 'IOError',
  PARSE = 'ParseError',
  COMMAND = 'CommandError',
  UNEXPECTED = 'UnexpectedError'
}

/**
 * Base error class for TreeCraft-specific errors
 */
export class TreeCraftError extends Error {
  type: ErrorType;

  /**
   * Creates a new TreeCraft error
   * 
   * @param message - Error message
   * @param type - Error type
   */
  constructor(message: string, type: ErrorType = ErrorType.UNEXPECTED) {
    super(message);
    this.type = type;
    this.name = type;
  }
}

/**
 * Validation error for invalid user input or options
 */
export class ValidationError extends TreeCraftError {
  /**
   * Creates a new validation error
   * 
   * @param message - Error message
   */
  constructor(message: string) {
    super(message, ErrorType.VALIDATION);
  }
}

/**
 * IO error for file/directory operations
 */
export class IOError extends TreeCraftError {
  cause?: Error;

  /**
   * Creates a new IO error
   * 
   * @param message - Error message
   * @param cause - Original error that caused this one
   */
  constructor(message: string, cause?: Error) {
    super(message, ErrorType.IO);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Parse error for file parsing operations
 */
export class ParseError extends TreeCraftError {
  cause?: Error;

  /**
   * Creates a new parse error
   * 
   * @param message - Error message
   * @param cause - Original error that caused this one
   */
  constructor(message: string, cause?: Error) {
    super(message, ErrorType.PARSE);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Command error for failed command operations
 */
export class CommandError extends TreeCraftError {
  /**
   * Creates a new command error
   * 
   * @param message - Error message
   */
  constructor(message: string) {
    super(message, ErrorType.COMMAND);
  }
}

/**
 * Centralized error handler for command actions
 * 
 * @param fn - The command action function to wrap with error handling
 * @returns A wrapped function with error handling
 */
export function withErrorHandling(fn: (...args: any[]) => Promise<void> | void): (...args: any[]) => Promise<void> {
  return async (...args: any[]) => {
    try {
      const result = fn(...args);
      // Handle both synchronous and asynchronous functions
      if (result instanceof Promise) {
        await result;
      }
    } catch (err: any) {
      handleError(err);
      process.exit(1);
    }
  };
}

/**
 * Handles errors by logging appropriate messages based on error type
 * 
 * @param err - The error to handle
 */
export function handleError(err: unknown): void {
  if (err instanceof TreeCraftError) {
    console.error(chalk.red(`${err.type}: ${err.message}`));
  } else if (err instanceof Error) {
    console.error(chalk.red(`Error: ${err.message}`));
  } else {
    console.error(chalk.red('An unexpected error occurred'));
  }
}

/**
 * Validates that a path is a directory
 * 
 * @param path - The path to check
 * @param fs - File system module (for testing mockability)
 * @throws ValidationError if the path is not a directory
 */
export function validateDirectory(path: string, fs = require('fs')): void {
  try {
    if (!fs.statSync(path).isDirectory()) {
      throw new ValidationError(`'${path}' is not a directory`);
    }
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      throw new ValidationError(`'${path}' does not exist`);
    }
    throw err;
  }
} 