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
    return corpus.documents.map((d: string): DocumentSchema => {return {id: d}; });
}

export class CorpusSchema {
  corpus: DocumentSchema[];
  level: Level;
  dictionary: string;
}
function makeCorpusSchema(corpus: Corpus): CorpusSchema {
  return {
    corpus: makeDocumentSchema(corpus),
    level: Level.Cluster,
    dictionary: corpus.ds_dictionary
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
  let schema = makeCorpusSchema(corpus) as RankedListSchema;
  schema.sortby = sortby;
  return schema;
}

export class ScatterplotSchema extends CorpusSchema {
  catX: string;
  catY: string;
}
export function makeScatterplotSchema(corpus: Corpus, cat_x: string, cat_y: string): ScatterplotSchema {
  let schema = makeCorpusSchema(corpus) as ScatterplotSchema;
  schema.catX = cat_x;
  schema.catY = cat_y;
  return schema;
}

export class GroupsSchema extends CorpusSchema {
  group_size: number;
}
export function makeGroupsSchema(corpus: Corpus, group_size: number): GroupsSchema {
  let schema = makeCorpusSchema(corpus) as GroupsSchema;
  schema.group_size = group_size;
  return schema;
}

export class ReportsSchema {
  corpus: DocumentSchema[];
  dictionary: string;
  course: string;
  assignment: string;
  intro: string;
  stv_intro: string;
}
export function makeReportsSchema(corpus: Corpus): ReportsSchema {
  return {
    corpus: makeDocumentSchema(corpus),
    dictionary: corpus.ds_dictionary,
    course: corpus.course,
    assignment: corpus.assignment,
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

export class RankDataEntry {
  index: string;
  text: string;
  value: number;
}
export class RankData {
  result: RankDataEntry[]
}

export class ScatterplotDataPoint {
  catX: number;
  catY: number;
  title: string;
  text_id: string;
}
export class ScatterplotData {
  spdata: ScatterplotDataPoint[];
}

export class GroupsData {
  groups: string[][] ;
  grp_qualities: number[];
  quality: number;
}
