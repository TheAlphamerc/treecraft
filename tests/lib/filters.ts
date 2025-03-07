import { filterTree, matchesFilters } from '../../src/lib/filters';


describe('filters', () => {
  describe('filterTree', () => {
    it('filters tree based on patterns', () => {
      const tree = {
        'file1.txt': null,
        'dir1': { 'file2.txt': null },
      };
      const filtered = filterTree(tree, ['*.txt']);
      expect(filtered).toEqual({
        'file1.txt': null,
        'dir1': { 'file2.txt': null },
      });
    });
    it('filters tree based on patterns when patter is absent', () => {
      const tree = {
        'file1.txt': null,
        'dir1': { 'file2.txt': null },
      };
      const filtered = filterTree(tree, []);
      expect(filtered).toEqual({
        'file1.txt': null,
        'dir1': { 'file2.txt': null },
      });
    });
  });

  describe('matchesFilters', () => {
    it('matches file with patterns', () => {
      expect(matchesFilters('file1.txt', ['*.txt'])).toBe(true);
      expect(matchesFilters('file1.txt', ['*.js'])).toBe(false);
      expect(matchesFilters('file1.txt', [''])).toBe(true);
    });
  });
});