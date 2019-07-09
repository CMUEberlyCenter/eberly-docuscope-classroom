import { Corpus } from './corpus';

export const enum Level {
  Dimension = 'Dimension',
  Cluster = 'Cluster'
}

export class DocumentSchema {
  id: string;
  data?: string;
}
export function makeDocumentSchema(corpus: Corpus): DocumentSchema[] {
  return corpus.documents.map((d: string): DocumentSchema => ({id: d}));
}

export class CorpusSchema {
  corpus: DocumentSchema[];
  level: Level;
}
function makeCorpusSchema(corpus: Corpus): CorpusSchema {
  return {
    corpus: makeDocumentSchema(corpus),
    level: Level.Cluster
  };
}
export class BoxplotSchema extends CorpusSchema {}
export function makeBoxplotSchema(corpus: Corpus): BoxplotSchema {
  return makeCorpusSchema(corpus) as BoxplotSchema;
}

export class RankedListSchema extends CorpusSchema {
  sortby: string;
}
export function makeRankedListSchema(corpus: Corpus, sortby: string): RankedListSchema {
  const schema = makeCorpusSchema(corpus) as RankedListSchema;
  schema.sortby = sortby;
  return schema;
}

export class ScatterplotSchema extends CorpusSchema {
  catX: string;
  catY: string;
}
export function makeScatterplotSchema(corpus: Corpus, cat_x: string, cat_y: string): ScatterplotSchema {
  const schema = makeCorpusSchema(corpus) as ScatterplotSchema;
  schema.catX = cat_x;
  schema.catY = cat_y;
  return schema;
}

export class GroupsSchema extends CorpusSchema {
  group_size: number;
}
export function makeGroupsSchema(corpus: Corpus, group_size: number): GroupsSchema {
  const schema = makeCorpusSchema(corpus) as GroupsSchema;
  schema.group_size = group_size;
  return schema;
}

export class ReportsSchema {
  corpus: DocumentSchema[];
  intro: string;
  stv_intro: string;
}
export function makeReportsSchema(corpus: Corpus): ReportsSchema {
  return {
    corpus: makeDocumentSchema(corpus),
    intro: corpus.intro,
    stv_intro: corpus.stv_intro
  };
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
}
export class Outlier {
  pointtitle: string;
  value: number;
  category: string;
}

export class BoxplotData {
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
export class RankData {
  category: string;
  result: RankDataEntry[];
}

export class ScatterplotDataPoint {
  catX: number;
  catY: number;
  title: string;
  text_id: string;
  ownedby: string;
}
export class ScatterplotData {
  axisX: string;
  axisY: string;
  spdata: ScatterplotDataPoint[];
}

export class GroupsData {
  groups: string[][];
  grp_qualities: number[];
  quality: number;
}
