import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { HierarchyRectangularNode } from 'd3';

export interface SunburstNode {
  name: string;
  target?: any;
  current?: any;
  children?: SunburstNode[];
  value?: number;
}

const partition = (
  pdata: SunburstNode
): HierarchyRectangularNode<SunburstNode> => {
  const r = d3.hierarchy(pdata).sum((d) => d.value);
  //.sort((a, b) => b.value - a.value);
  return d3.partition<SunburstNode>().size([2 * Math.PI, r.height + 1])(r);
};
const arcVisible = (d: HierarchyRectangularNode<SunburstNode>): boolean =>
  d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
const labelVisible = (d: HierarchyRectangularNode<SunburstNode>): boolean =>
  d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;

@Component({
  selector: 'app-sunburst-chart',
  templateUrl: './sunburst-chart.component.html',
  styleUrls: ['./sunburst-chart.component.css'],
})
export class SunburstChartComponent implements OnInit, OnChanges {
  @Input() data: SunburstNode;
  @Input() width = 500;
  @ViewChild('sunburst') sunburst: ElementRef;

  color = d3.scaleOrdinal(d3.schemeCategory10);
  format = d3.format(',d');

  constructor() {}

  ngOnInit(): void {}
  ngOnChanges(): void {
    if (this.data && this.sunburst) {
      this.drawChart();
    }
  }

  drawChart() {
    const radius = this.width / 6;
    const arc = d3
      .arc<HierarchyRectangularNode<SunburstNode>>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d) => d.y0 * radius)
      .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));
    const labelTransform = (d: {
      x0: number;
      x1: number;
      y0: number;
      y1: number;
    }): string => {
      //if (d) {
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = ((d.y0 + d.y1) / 2) * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      //}
      //return '';
    };
    const root = partition(this.data);
    root.each((d) => (d.data.current = d));
    root.each(
      (d) =>
        (d.data.target = {
          x0:
            Math.max(0, Math.min(1, (d.x0 - root.x0) / (root.x1 - root.x0))) *
            2 *
            Math.PI,
          x1:
            Math.max(0, Math.min(1, (d.x1 - root.x0) / (root.x1 - root.x0))) *
            2 *
            Math.PI,
          y0: Math.max(0, d.y0 - root.depth),
          y1: Math.max(0, d.y1 - root.depth),
        })
    );
    const svg = d3
      .select(this.sunburst.nativeElement)
      .append('svg')
      .attr('viewBox', `0 0 ${this.width} ${this.width}`)
      .style('font', '12px open-sans');
    const g = svg
      .append('g')
      .attr('transform', `translate(${this.width / 2},${this.width / 2})`);
    const path = g
      .append('g')
      .selectAll('path')
      .data(root.descendants().slice(1))
      .join('path')
      .attr('fill', (d: HierarchyRectangularNode<SunburstNode>) => {
        while (d.depth > 1) {
          d = d.parent;
        }
        return this.color(d.data.name);
      })
      .attr('fill-opacity', (d) =>
        arcVisible(d.data.current) ? (d.children ? 0.8 : 0.4) : 0
      )
      .attr('d', (d: HierarchyRectangularNode<SunburstNode>) =>
        arc(d.data.current)
      );
    path
      .filter(
        (d: HierarchyRectangularNode<SunburstNode>) => d.children?.length > 0
      )
      .style('cursor', 'pointer');
    const label = g
      .append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .selectAll('text')
      .data(root.descendants().slice(1))
      .join('text')
      .attr('dy', '0.35em')
      .attr('fill-opacity', (d) => +labelVisible(d.data.current))
      .attr('transform', (d) => labelTransform(d.data.current))
      .text((d) => d.data.name);
    const parent = g
      .append('circle')
      .datum(root)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('pointer-events', 'all');
    //.on('click', clicked);
    const clicked = (_event, p) => {
      if (p.children) {
        parent.datum(p.parent || root);
        root.each(
          (d) =>
            (d.data.target = {
              x0:
                Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) *
                2 *
                Math.PI,
              x1:
                Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) *
                2 *
                Math.PI,
              y0: Math.max(0, d.y0 - p.depth),
              y1: Math.max(0, d.y1 - p.depth),
            })
        );
        const trans = g.transition().duration(750);
        path
          .transition(trans)
          .tween('data', (d) => {
            const i = d3.interpolate(d.data.current, d.data.target);
            return (t) => (d.data.current = i(t));
          })
          .filter(function(this: Element, d) {
            return (
              Boolean(+this.getAttribute('fill-opacity')) ||
              arcVisible(d.data.target)
            );
          })
          .attr('fill-opacity', (d) =>
            arcVisible(d.data.target) ? (d.children ? 0.8 : 0.4) : 0
          )
          .attrTween('d', (d) => () => arc(d.data.current));
        label
          .filter(function(this: Element, d): boolean {
            return (
              Boolean(+this.getAttribute('fill-opacity')) ||
              labelVisible(d.data.target)
            );
          })
          .transition(trans)
          .attr('fill-opacity', (d) => +labelVisible(d.data.target))
          .attrTween('transform', (d) => () => labelTransform(d.data.current));
      }
    };
    path.on('click', clicked);
    parent.on('click', clicked);
    path.append('title').text(
      (d) =>
        `${d
          .ancestors()
          .map((dn: HierarchyRectangularNode<SunburstNode>) => dn.data.name)
          .reverse()
          .slice(1)
          .join('/')}\n${this.format(d.value)}`
    );
  }
}
