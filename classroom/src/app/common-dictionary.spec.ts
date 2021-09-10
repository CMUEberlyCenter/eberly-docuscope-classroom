import { FAKE_COMMON_DICTIONARY } from 'src/testing';
import { CommonDictionary } from './common-dictionary';

describe('CommonDictionary', () => {
  const cd = new CommonDictionary(FAKE_COMMON_DICTIONARY);
  it('should create an instance', () => {
    void expect(new CommonDictionary(FAKE_COMMON_DICTIONARY)).toBeTruthy();
  });

  it('tree', () => {
    void expect(cd.tree).toBeTruthy();
  });

  it('nodes', () => {
    void expect(cd.nodes).toBeTruthy();
  });
});
