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
            lifence: 0
        }
    ],
    data: [{
        id: 'id0',
        title: 'An example',
        ownedby: 'student',
        total_words: 2,
        Insurection: 0.5
    }]
};
