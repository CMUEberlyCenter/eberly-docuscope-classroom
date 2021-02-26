import { cluster_compare, instance_count } from './cluster-data';

describe('ClusterData', () => {
  it('instance_count', () => {
    expect(instance_count([])).toBe(0);
    expect(instance_count([{ pattern: 'foo', count: 3 }])).toBe(3);
    expect(
      instance_count([
        { pattern: 'foo', count: 3 },
        { pattern: 'bar', count: 6 },
        { pattern: 'baz', count: 1 },
      ])
    ).toBe(10);
  });

  it('cluster_compare', () => {
    expect(
      cluster_compare(
        { id: 'id0', name: 'name0', pattern_count: 0, count: 0, patterns: [] },
        { id: 'id0', name: 'name0', pattern_count: 0, count: 0, patterns: [] }
      )
    ).toBe(0);
    expect(
      cluster_compare(
        { id: 'id0', name: 'name0', pattern_count: 0, count: 0, patterns: [] },
        { id: 'id0', name: 'name1', pattern_count: 0, count: 3, patterns: [] }
      )
    ).toBe(3);
    expect(
      cluster_compare(
        { id: 'id0', name: 'name0', pattern_count: 0, count: 5, patterns: [] },
        { id: 'id0', name: 'name1', pattern_count: 0, count: 3, patterns: [] }
      )
    ).toBe(-2);
    expect(
      cluster_compare(
        { id: 'id0', name: 'name0', pattern_count: 0, count: 0, patterns: [] },
        { id: 'id0', name: 'name1', pattern_count: 0, count: 0, patterns: [] }
      )
    ).toBe(-1);
    expect(
      cluster_compare(
        { id: 'id0', name: 'name2', pattern_count: 0, count: 0, patterns: [] },
        { id: 'id0', name: 'name1', pattern_count: 0, count: 0, patterns: [] }
      )
    ).toBe(1);
  });
});
