import { PatternTreeNode } from './pattern-tree-node';

describe('PatternTreeNode', () => {
  it('should create an instance', () => {
    const ptn = new PatternTreeNode(
      { label: 'Dead Tree', id: 'dt', help: `It's dead, Jim` },
      [],
      []
    );
    void expect(ptn).toBeTruthy();
    void expect(ptn.label).toBe('Dead Tree');
    void expect(ptn.children).toEqual([]);
    void expect(ptn.patterns).toEqual([]);
    void expect(ptn.count).toBe(0);
  });
  it('should set data', () => {
    const pattern = { pattern: 'dead', count: 2 };
    const ptl = new PatternTreeNode(
      { label: 'Dead Leaf', id: 'dl', help: 'It is also dead, Jim' },
      [],
      [pattern]
    );
    const ptn = new PatternTreeNode(
      { label: 'Dead Tree', id: 'dt', help: "It's dead, Jim" },
      [ptl],
      []
    );
    void expect(ptn.id).toBe('dt');
    void expect(ptn.help).toBe("It's dead, Jim");
    void expect(ptn.children).toEqual([ptl]);
    void expect(ptn.patterns).toEqual([]);
    void expect(ptl.count).toBe(2);
    void expect(ptn.count).toBe(2);
  });
});
