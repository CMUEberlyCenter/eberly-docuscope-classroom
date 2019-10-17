import { BoxplotData, max_boxplot_value } from './boxplot-data';

describe('max_boxplot_value', () => {
  const data: BoxplotData = {
    bpdata: [{q1: 1, q2: 2, q3: 3, min: 0, max: 4,
              uifence: 3.5, lifence: 0.5,
              category: 'bogus', category_label: 'Bogus Data'}],
    outliers: []
  };
  it('null', () => expect(max_boxplot_value(null)).toBe(0.0));
  it('max', () => expect(max_boxplot_value(data)).toBe(4.0));
});
