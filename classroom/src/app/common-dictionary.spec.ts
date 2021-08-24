import { FAKE_COMMON_DICTIONARY } from 'src/testing';
import { CommonDictionary } from './common-dictionary';

describe('CommonDictionary', () => {
  it('should create an instance', () => {
    void expect(new CommonDictionary(FAKE_COMMON_DICTIONARY)).toBeTruthy();
  });

  it('tree', () => {
    const cd = new CommonDictionary(FAKE_COMMON_DICTIONARY);
    void expect(cd.tree).toBeTruthy();
  });
});
