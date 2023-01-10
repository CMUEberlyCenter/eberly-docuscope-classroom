import { PatternTreeNode } from './pattern-tree-node';

describe('PatternTreeNode', () => {
  it('should create an instance', async () => {
    const ptn = new PatternTreeNode(
      { label: 'Dead Tree', id: 'dt', help: `It's dead, Jim` },
      [],
      []
    );
    await expect(ptn).toBeTruthy();
    await expect(ptn.label).toBe('Dead Tree');
    await expect(ptn.children).toEqual([]);
    await expect(ptn.patterns).toEqual([]);
    await expect(ptn.count).toBe(0);
  });
  it('should set data', async () => {
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
    await expect(ptn.id).toBe('dt');
    await expect(ptn.help).toBe("It's dead, Jim");
    await expect(ptn.children).toEqual([ptl]);
    await expect(ptn.patterns).toEqual([]);
    await expect(ptl.count).toBe(2);
    await expect(ptn.count).toBe(2);
  });
});
