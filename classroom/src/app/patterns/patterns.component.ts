/* Component for displaying the patterns analysis.
  This component is one of the corpus analysis tools.
  It displays all of the patterns for each category and the
  counts of each pattern over the corpus.
*/
import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { forkJoin } from 'rxjs';
import {
  CommonDictionary,
  CommonDictionaryTreeNode,
} from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import { PatternTreeNode } from '../pattern-tree-node';
import {
  CategoryPatternData,
  PatternData,
  PatternsService,
} from '../patterns.service';
import { SunburstNode } from '../sunburst-chart/sunburst-chart.component';

@Component({
  selector: 'app-patterns',
  templateUrl: './patterns.component.html',
  styleUrls: ['./patterns.component.scss'],
})
export class PatternsComponent implements OnInit {
  treeControl = new NestedTreeControl<PatternTreeNode>((node) => node.children);
  treeData = new MatTreeNestedDataSource<PatternTreeNode>();
  sundata: SunburstNode = { name: 'root' }; // data formatted for sunburst visualization

  constructor(
    private commonDictionaryService: CommonDictionaryService,
    private corpusService: CorpusService,
    private dataService: PatternsService
  ) {}

  /**
   * Does the given node have any children.
   * @param _ Index of the node, ignored.
   * @param node A given category tree node.
   */
  hasChild(_: number, node: PatternTreeNode): boolean {
    return !!node.children && node.children.length > 0;
  }
  /**
   * Does the given node have any patterns.
   * @param _ Index of the node, ignored.
   * @param node A given category tree node.
   */
  hasPatterns(_: number, node: PatternTreeNode): boolean {
    return !!node.patterns && node.patterns.length > 0;
  }

  ngOnInit(): void {
    this.corpusService.getCorpus().subscribe((corpus) => {
      forkJoin([
        this.dataService.getPatterns(corpus),
        this.commonDictionaryService.getJSON(),
      ]).subscribe((results: [CategoryPatternData[], CommonDictionary]) => {
        const [data, common] = results;
        // Formulate map of category -> pattern data for faster lookup.
        const cpmap = new Map<string, PatternData[]>(
          data.map((d) => [d.category, d.patterns ?? []])
        );
        // Translate to tree node data.
        const dfsmap = (node: CommonDictionaryTreeNode): PatternTreeNode =>
          new PatternTreeNode(
            node,
            node.children?.map(dfsmap) ?? [],
            cpmap.get(node.id) ?? []
          );
        this.treeData.data = common.tree.map(dfsmap);
        // Translate to sunburst data.
        const sunmap = (node: CommonDictionaryTreeNode): SunburstNode => ({
          name: node.label,
          children: cpmap.get(node.id)
            ? cpmap.get(node.id).map((p) => ({
                name: p.pattern,
                value: p.count,
              }))
            : node.children?.map(sunmap),
        });
        this.sundata = { name: 'root', children: common.tree.map(sunmap) };
      });
    });
  }
}
