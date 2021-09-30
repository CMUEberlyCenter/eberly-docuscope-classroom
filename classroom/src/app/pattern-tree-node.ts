import { CommonDictionaryTreeNode } from './common-dictionary';
import { instance_count, PatternData } from './patterns.service';

export function partition<T>(
  array: T[],
  isValid: (item: T) => boolean
): [T[], T[]] {
  return array.reduce<[T[], T[]]>(
    ([pass, fail], elem) => {
      return isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
    },
    [[], []]
  );
}

export class PatternTreeNode {
  id: string;
  label: string;
  help: string;
  children: PatternTreeNode[];
  patterns: PatternData[];
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
    if (this.patterns && this.patterns.length > 0) {
      return instance_count(this.patterns);
    } else if (this.children && this.children.length > 0) {
      return this.children.reduce((tot, cur) => tot + cur.count, 0);
    }
    return 0;
  }
}
