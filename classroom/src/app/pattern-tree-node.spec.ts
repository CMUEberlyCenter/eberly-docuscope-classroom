import { PatternTreeNode } from './pattern-tree-node';

describe('PatternTreeNode', () => {
  it('should create an instance', () => {
    expect(new PatternTreeNode({label: 'Dead Tree'}, [], [])).toBeTruthy();
  });
});
