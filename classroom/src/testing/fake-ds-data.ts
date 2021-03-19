import { DocuScopeData } from 'src/app/ds-data.service';

export const FAKE_DS_DATA: DocuScopeData = {
  assignment: 'Test Assignment',
  course: 'Test Course',
  instructor: 'Test Instructor',
  categories: [
    {
      id: 'Insurection',
      q1: 1,
      q2: 1,
      q3: 1,
      min: 0,
      max: 1,
      uifence: 1,
      lifence: 0,
    },
    {
      id: 'bogus',
      q1: 0,
      q2: 0,
      q3: 0,
      min: 0,
      max: 0,
      uifence: 0,
      lifence: 0,
    }
  ],
  data: [
    {
      id: 'id0',
      title: 'An example',
      ownedby: 'student',
      total_words: 2,
      Insurection: 0.5,
    },
    {
      id: 'idout',
      title: 'Outlier',
      ownedby: 'student',
      total_words: 5,
      Insurection: 2,
    }
  ],
};
