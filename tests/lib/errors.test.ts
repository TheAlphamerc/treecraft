import {
  ValidationError,
  IOError,
  ParseError,
  CommandError,
  TreeCraftError,
  ErrorType,
  withErrorHandling,
  validateDirectory
} from '../../src/lib/errors';

// Mock chalk to avoid ESM import issues
jest.mock('chalk', () => ({
  red: jest.fn((text) => `[red]${text}[/red]`),
  green: jest.fn((text) => `[green]${text}[/green]`),
  yellow: jest.fn((text) => `[yellow]${text}[/yellow]`),
  blue: jest.fn((text) => `[blue]${text}[/blue]`),
}));

describe('errors', () => {
  // Mock console.error to prevent test output noise
  const originalConsoleError = console.error;
  let consoleOutput: string[] = [];

  beforeEach(() => {
    consoleOutput = [];
    console.error = jest.fn((...args: any[]) => {
      consoleOutput.push(args.join(' '));
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('Error classes', () => {
    it('creates ValidationError with correct type', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error instanceof TreeCraftError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('creates IOError with correct type and optional cause', () => {
      const cause = new Error('Original error');
      const error = new IOError('IO operation failed', cause);
      expect(error.message).toBe('IO operation failed');
      expect(error.type).toBe(ErrorType.IO);
      expect(error.cause).toBe(cause);
    });

    it('creates ParseError with correct type and optional cause', () => {
      const cause = new Error('Original error');
      const error = new ParseError('Parsing failed', cause);
      expect(error.message).toBe('Parsing failed');
      expect(error.type).toBe(ErrorType.PARSE);
      expect(error.cause).toBe(cause);
    });

    it('creates CommandError with correct type', () => {
      const error = new CommandError('Command failed');
      expect(error.message).toBe('Command failed');
      expect(error.type).toBe(ErrorType.COMMAND);
    });

    it('creates base TreeCraftError with default type', () => {
      const error = new TreeCraftError('Generic error');
      expect(error.message).toBe('Generic error');
      expect(error.type).toBe(ErrorType.UNEXPECTED);
    });
  });

  describe('withErrorHandling', () => {
    it('wraps synchronous functions and handles errors', () => {
      // Mock process.exit to prevent test from exiting
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => { }) as any);

      const throwingFn = () => {
        throw new ValidationError('Test error');
      };

      const wrappedFn = withErrorHandling(throwingFn);
      wrappedFn();

      expect(consoleOutput[0]).toContain('ValidationError: Test error');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('wraps async functions and handles errors', async () => {
      // Mock process.exit to prevent test from exiting
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => { }) as any);

      const throwingAsyncFn = async () => {
        throw new IOError('Async test error');
      };

      const wrappedFn = withErrorHandling(throwingAsyncFn);
      await wrappedFn();

      expect(consoleOutput[0]).toContain('IOError: Async test error');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });
  });

  describe('validateDirectory', () => {
    it('validates existing directory', () => {
      const mockFs = {
        statSync: jest.fn().mockReturnValue({ isDirectory: () => true })
      };

      expect(() => validateDirectory('/valid/dir', mockFs as any)).not.toThrow();
    });

    it('throws ValidationError for non-directory paths', () => {
      const mockFs = {
        statSync: jest.fn().mockReturnValue({ isDirectory: () => false })
      };

      expect(() => validateDirectory('/not/a/dir', mockFs as any))
        .toThrow(ValidationError);
    });

    it('throws ValidationError for non-existent paths', () => {
      const mockFs = {
        statSync: jest.fn().mockImplementation(() => {
          const error: any = new Error('ENOENT');
          error.code = 'ENOENT';
          throw error;
        })
      };

      expect(() => validateDirectory('/does/not/exist', mockFs as any))
        .toThrow(ValidationError);
    });
  });
}); 