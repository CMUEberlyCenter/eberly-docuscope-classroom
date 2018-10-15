import { BoxplotSchema, DocumentSchema, Level} from './boxplot-data';

export class Corpus {
  id: number;
  course: string;
  assignment: string;
  ds_dictionary: string;
  documents: string[];
  intro: string;
  stv_intro: string;
}
