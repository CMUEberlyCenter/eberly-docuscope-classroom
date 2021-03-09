import { CommonDictionaryTreeNode } from './common-dictionary';
import { instance_count, PatternData } from './patterns.service';

export class PatternTreeNode {
  id?: string;
  label: string;
  help: string;
  children?: PatternTreeNode[];
  patterns?: PatternData[];
  constructor(
    node: CommonDictionaryTreeNode,
    children: PatternTreeNode[],
    patterns: PatternData[]
  ) {
    this.id = node.id;
    this.label = node.label;
    this.help = node.help;
    this.children = children;
    this.patterns = patterns;
  }
  get count(): number {
    if (this.patterns) {
      return instance_count(this.patterns);
    } else if (this.children) {
      return this.children.reduce((tot, cur) => tot + cur.count, 0);
    }
    return 0;
  }
}
