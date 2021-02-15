import { instance_count } from './cluster-data';
import { CommonDictionaryTreeNode } from './common-dictionary';
import { PatternData } from './patterns.service';

export class PatternTreeNode {
    label: string;
    help: string;
    children?: PatternTreeNode[];
    patterns?: PatternData[];
    constructor(node: CommonDictionaryTreeNode, children: PatternTreeNode[], patterns: PatternData[]) {
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