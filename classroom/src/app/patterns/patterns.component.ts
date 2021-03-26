import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import {
  CommonDictionary,
  CommonDictionaryTreeNode
} from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import { PatternTreeNode } from '../pattern-tree-node';
import {
  CategoryPatternData,
  PatternData,
  PatternsService
} from '../patterns.service';
import { SunburstNode } from '../sunburst-chart/sunburst-chart.component';

@Component({
  selector: 'app-patterns',
  templateUrl: './patterns.component.html',
  styleUrls: ['./patterns.component.css'],
})
export class PatternsComponent implements OnInit {
  @ViewChild('sunburst', { static: true }) sunburst: ElementRef;

  treeControl = new NestedTreeControl<PatternTreeNode>((node) => node.children);
  treeData = new MatTreeNestedDataSource<PatternTreeNode>();
  sundata: SunburstNode;

  constructor(
    private commonDictionaryService: CommonDictionaryService,
    private corpusService: CorpusService,
    private dataService: PatternsService,
    private spinner: NgxUiLoaderService
  ) {}

  hasChild(_: number, node: PatternTreeNode): boolean {
    return !!node.children && node.children.length > 0;
  }
  hasPatterns(_: number, node: PatternTreeNode): boolean {
    return !!node.patterns && node.patterns.length > 0;
  }

  ngOnInit() {
    this.spinner.start();
    this.corpusService.getCorpus().subscribe((corpus) => {
      forkJoin([
        this.dataService.getPatterns(corpus),
        this.commonDictionaryService.getJSON(),
      ]).subscribe((results: [CategoryPatternData[], CommonDictionary]) => {
        const [data, common] = results;
        const cpmap = new Map<string, PatternData[]>(
          data.map((d) => [d.category, d.patterns])
        );
        const dfsmap = (node: CommonDictionaryTreeNode): PatternTreeNode =>
          new PatternTreeNode(
            node,
            node.children?.map(dfsmap),
            cpmap.get(node.id)
          );
        this.treeData.data = common.tree.map(dfsmap);
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
        this.spinner.stop();
      });
    });
  }
}
