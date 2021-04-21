import { PatternTreeNode } from './pattern-tree-node';

describe('PatternTreeNode', () => {
  it('should create an instance', () => {
    const ptn = new PatternTreeNode({ label: 'Dead Tree', id: 'dt' }, [], []);
    expect(ptn).toBeTruthy();
    expect(ptn.label).toBe('Dead Tree');
    expect(ptn.children).toEqual([]);
    expect(ptn.patterns).toEqual([]);
    expect(ptn.count).toBe(0);
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
    expect(ptn.id).toBe('dt');
    expect(ptn.help).toBe("It's dead, Jim");
    expect(ptn.children).toEqual([ptl]);
    expect(ptn.patterns).toEqual([]);
    expect(ptl.count).toBe(2);
    expect(ptn.count).toBe(2);
  });
});
