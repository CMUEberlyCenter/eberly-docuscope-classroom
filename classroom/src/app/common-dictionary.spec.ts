import { CommonDictionary } from './common-dictionary';

const common = {
  default_dict: 'test',
  custom_dict: 'test_custom',
  use_default_dict: true,
  timestamp: 'today',
  categories: [],
};

describe('CommonDictionary', () => {
  it('should create an instance', () => {
    expect(new CommonDictionary(common)).toBeTruthy();
  });
});
