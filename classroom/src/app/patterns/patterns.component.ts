import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { CorpusService } from '../corpus.service';
import { CategoryPatternData, PatternData, PatternsService } from '../patterns.service';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CommonDictionary, CommonDictionaryTreeNode } from '../common-dictionary';
import { NestedTreeControl } from '@angular/cdk/tree';
import { forkJoin } from 'rxjs';
import * as d3 from 'd3';
import { HierarchyRectangularNode } from 'd3';
import { PatternTreeNode } from '../pattern-tree-node';

interface SunburstNode {
  name: string;
  current?: any;
  target?: any;
}

@Component({
  selector: 'app-patterns',
  templateUrl: './patterns.component.html',
  styleUrls: ['./patterns.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
    trigger('indicatorRotate', [
      state('collapsed, void', style({transform: 'rotate(0deg)'})),
      state('expanded', style({transform: 'rotate(180deg)'})),
      transition('expanded <=> collapsed, void => collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
  ],
})
export class PatternsComponent implements OnInit {
  @ViewChild('sunburst', {static: true}) sunburst: ElementRef;

  svg;
  treeControl = new NestedTreeControl<PatternTreeNode>(node => node.children);
  treeData = new MatTreeNestedDataSource<PatternTreeNode>();
  sundata: any;

  constructor(
    private commonDictionaryService: CommonDictionaryService,
    private corpusService: CorpusService,
    private dataService: PatternsService,
    private spinner: NgxUiLoaderService) { }

  hasChild(_: number, node: PatternTreeNode): boolean {
    return !!node.children && node.children.length > 0;
  }
  hasPatterns(_: number, node: PatternTreeNode): boolean {
    return !!node.patterns && node.patterns.length > 0;
  }

  ngOnInit() {
    this.spinner.start();
    this.corpusService.getCorpus().subscribe(corpus => {
      forkJoin([this.dataService.getPatterns(corpus),
          this.commonDictionaryService.getJSON()]).subscribe(
            (results: [CategoryPatternData[], CommonDictionary]) => {
            const [data, common] = results;
            const cpmap = new Map<string, PatternData[]>(data.map(d => [d.category, d.patterns]));
            const dfsmap = (node: CommonDictionaryTreeNode): PatternTreeNode =>
              new PatternTreeNode(node,
                                  node.children?.map(dfsmap),
                                  cpmap.get(node.id??node.label));
            this.treeData.data = common.tree.map(dfsmap);
            const sunmap = (node: CommonDictionaryTreeNode) => ({
              name: node.id??node.label,
              children: cpmap.get(node.id??node.label) ?
                cpmap.get(node.id??node.label).map(p => ({
                  name: p.pattern,
                  value: p.count
                })) :
                node.children?.map(sunmap)
            });
            this.sundata = {name: 'root', children: common.tree.map(sunmap)};
            //this.sundata = common.tree.map(sunmap);
            //const sundata = common.tree.map(sunmap);
            this.drawChart(this.sundata);
            this.spinner.stop();
          });
        });
  }

  ngAfterViewInit() {
    //if (this.sundata) {
    //  this.drawChart(this.sundata);
    //}
  }
  drawChart(data) {
    const width = 500;
    const radius = width / 6;
    const arc = d3.arc<HierarchyRectangularNode<SunburstNode>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius(d => d.y0 * radius)
      .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));
    const format = d3.format(',d');
    const partition = (pdata: any): HierarchyRectangularNode<SunburstNode> => {
      const r = d3.hierarchy(pdata)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
      return d3.partition<SunburstNode>().size([2*Math.PI, r.height + 1])(r);
    };
    const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));
    const arcVisible = (d: HierarchyRectangularNode<SunburstNode>) => d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    const labelVisible = (d: HierarchyRectangularNode<SunburstNode>) => d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    const labelTransform = (d: { x0: number; x1: number; y0: number; y1: number }) => {
      const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
      const y = (d.y0 + d.y1) / 2 * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    };
    const root = partition(data);
    root.each(d => d.data.current = d);
    this.svg = d3.select(/*this.sunburst.nativeElement*/'figure#sunburst')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${width}`)
      .style('font', '12px open-sans');
    const g = this.svg.append('g')
      .attr('transform', `translate(${width / 2},${width / 2})`);
    const path = g.append('g')
      .selectAll('path')
      .data(root.descendants().slice(1))
      .join('path')
        .attr('fill', (d: HierarchyRectangularNode<SunburstNode>) => {
          while (d.depth > 1) {
            d = d.parent;
          }
          return color(d.data.name);
        })
        .attr('fill-opacity', d => arcVisible(d.data.current) ? (d.children ? 0.6 : 0.4) : 0)
        .attr('d', (d: HierarchyRectangularNode<SunburstNode>) => arc(d.data.current));
    path.filter(d => d.children)
        .style('cursor', 'pointer')
        .on('click', clicked);
    path.append('title')
      .text(d => `${d.ancestors().map(
        (dn: HierarchyRectangularNode<SunburstNode>) => dn.data.name)
        .reverse().join('/')}\n${format(d.value)}`);
    const label = g.append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .selectAll('text')
      .data(root.descendants().slice(1))
      .join('text')
        .attr('dy', '0.35em')
        .attr('fill-opacity', d => +labelVisible(d.data.current))
        .attr('transform', d => labelTransform(d.data.current))
        .text(d => d.data.name);
    const parent = g.append('circle')
      .datum(root)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('click', clicked);
    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    function clicked(_event, p) {
      parent.datum(p.parent || root);
      root.each(d => d.data.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth)
      });
      const trans = g.transition().duration(750);
      path.transition(trans)
        .tween('data', d => {
          const i = d3.interpolate(d.data.current, d.data.target);
          return t => d.data.current = i(t);
        })
        .filter(function(d) {
          return +this.getAttribute('fill-opacity') || arcVisible(d.data.target);
        })
        .attr('fill-opacity', d => arcVisible(d.data.target) ? (d.children ? 0.6 : 0.4) : 0)
        .attrTween('d', d => () => arc(d.data.current));
      label.filter(function(d) {
        return +this.getAttribute('fill-opacity') || labelVisible(d.data.target);
      }).transition(trans)
        .attr('fill-opacity', d => +labelVisible(d.data.target))
        .attrTween('transform', d=> () => labelTransform(d.data.current));
    }
  }
}
