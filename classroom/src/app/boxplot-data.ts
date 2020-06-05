import { AssignmentData } from './assignment-data';

export const enum Level {
  Dimension = 'Dimension',
  Cluster = 'Cluster'
}

export class DocumentSchema {
  id: string;
  data?: string;
}
export function makeDocumentSchema(corpus: string[]): DocumentSchema[] {
  return corpus.map((d: string): DocumentSchema => ({id: d}));
}

export class CorpusSchema {
  corpus: DocumentSchema[];
  level: Level;
}
export function makeCorpusSchema(corpus: string[]): CorpusSchema {
  return {
    corpus: makeDocumentSchema(corpus),
    level: Level.Cluster
  };
}
export class BoxplotSchema extends CorpusSchema {}
export function makeBoxplotSchema(corpus: string[]): BoxplotSchema {
  return makeCorpusSchema(corpus) as BoxplotSchema;
}

export class RankedListSchema extends CorpusSchema {
  sortby: string;
}
export function makeRankedListSchema(corpus: string[], sortby: string): RankedListSchema {
  const schema = makeCorpusSchema(corpus) as RankedListSchema;
  schema.sortby = sortby;
  return schema;
}

export class ScatterplotSchema extends CorpusSchema {
  catX: string;
  catY: string;
}
export function makeScatterplotSchema(corpus: string[], cat_x: string, cat_y: string): ScatterplotSchema {
  const schema = makeCorpusSchema(corpus) as ScatterplotSchema;
  schema.catX = cat_x;
  schema.catY = cat_y;
  return schema;
}

export class GroupsSchema {
  corpus: string[];
  group_size: number;
}
export function makeGroupsSchema(corpus: string[], group_size: number): GroupsSchema {
  // const schema = makeCorpusSchema(corpus) as GroupsSchema;
  // schema.group_size = group_size;
  return {corpus: corpus, group_size: group_size};
}

export class BoxplotDataEntry {
  q1: number;
  q2: number;
  q3: number;
  min: number;
  max: number;
  uifence: number;
  lifence: number;
  category: string;
  // category_label: string;
}
export class Outlier {
  pointtitle: string;
  value: number;
  category: string;
}

export class BoxplotData extends AssignmentData {
  bpdata: BoxplotDataEntry[];
  outliers: Outlier[];
}

export function max_boxplot_value(boxplot: BoxplotData): number {
  let maximum = 0.0;
  if (boxplot) {
    for (const cat of Object.keys(boxplot.bpdata)) {
      const entry: BoxplotDataEntry = boxplot.bpdata[cat];
      maximum = Math.max(maximum, entry.max, entry.uifence);
    }
  }
  return Math.ceil(maximum * 10) / 10;
}

export class RankDataEntry {
  index: string;
  text: string;
  value: number;
  ownedby: string;
}
export class RankData extends AssignmentData {
  category?: string;
  category_name?: string;
  median?: number;
  result: RankDataEntry[];
}

export class ScatterplotDataPoint {
  catX: number;
  catY: number;
  title: string;
  text_id: string;
  ownedby: string;
}
export class ScatterplotData extends AssignmentData {
  axisX: string;
  axisY: string;
  spdata: ScatterplotDataPoint[];
}

export class GroupsData extends AssignmentData {
  groups: string[][];
  grp_qualities: number[];
  quality: number;
}
