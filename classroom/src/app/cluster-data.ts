import { CategoryPatternData, PatternData } from './patterns.service';

export function instance_count(patterns: PatternData[]): number {
  return patterns.reduce(
    (total: number, current: PatternData) => total + current.count, 0);
}

export interface ClusterData {
  id: string;
  name: string;
  description?: string;
  pattern_count: number;
  count: number;
  patterns: PatternData[];
}

export function cluster_compare(a: ClusterData, b: ClusterData): number {
  if (a.count === b.count) {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }
  return b.count - a.count;
}
