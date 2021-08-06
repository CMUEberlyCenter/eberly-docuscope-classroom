import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { BaseType, HierarchyRectangularNode } from 'd3';

export interface SunburstNode {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  current?: any;
  children?: SunburstNode[];
  value?: number;
}

const partition = (
  pdata: SunburstNode
): HierarchyRectangularNode<SunburstNode> => {
  const r = d3.hierarchy(pdata).sum((d) => d.value ?? 0);
  //.sort((a, b) => b.value - a.value);
  return d3.partition<SunburstNode>().size([2 * Math.PI, r.height + 1])(r);
};
const arcVisible = (d: HierarchyRectangularNode<SunburstNode>): boolean =>
  d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
const labelVisible = (d: HierarchyRectangularNode<SunburstNode>): boolean =>
  d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
const labelTransform = (
  d: {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  },
  radius: number
): string => {
  const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
  const y = ((d.y0 + d.y1) / 2) * radius;
  return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
};

@Component({
  selector: 'app-sunburst-chart',
  templateUrl: './sunburst-chart.component.html',
  styleUrls: ['./sunburst-chart.component.scss'],
})
export class SunburstChartComponent implements OnChanges, AfterViewInit {
  @Input() data: SunburstNode | undefined;
  @Input() width = 500;
  @ViewChild('sunburst') sunburst!: ElementRef;

  color = d3.scaleOrdinal(d3.schemeCategory10);
  current_path = '';
  format = d3.format(',d');

  svg?: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  arc!: d3.Arc<unknown, d3.HierarchyRectangularNode<SunburstNode>>;
  path:
    | d3.Selection<
        SVGPathElement | BaseType,
        d3.HierarchyRectangularNode<SunburstNode>,
        SVGGElement,
        unknown
      >
    | undefined;
  parent:
    | d3.Selection<
        SVGCircleElement,
        d3.HierarchyRectangularNode<SunburstNode>,
        null,
        undefined
      >
    | undefined;
  root: d3.HierarchyRectangularNode<SunburstNode> | undefined;
  label:
    | d3.Selection<
        BaseType | SVGTextElement,
        d3.HierarchyRectangularNode<SunburstNode>,
        SVGGElement,
        unknown
      >
    | undefined;
  g!: d3.Selection<SVGGElement, unknown, null, undefined>;

  get radius(): number {
    return this.width / 6;
  }

  //constructor() {}

  ngOnChanges(): void {
    if (this.data && this.sunburst) {
      this.drawChart();
    }
  }
  ngAfterViewInit(): void {
    if (!this.svg) {
      this.ngOnChanges();
    }
  }

  clicked(_event: MouseEvent, p: HierarchyRectangularNode<SunburstNode>): void {
    if (!p) {
      this.current_path = '';
      return;
    }
    if (
      p.children &&
      this.root &&
      this.arc &&
      this.path &&
      this.g &&
      this.label
    ) {
      this.parent?.datum(p.parent || this.root);
      this.current_path = p
        .ancestors()
        .reverse()
        .slice(1)
        .map((d) => d.data.name)
        .join(' > ');
      this.root.each(
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
      const trans = d3.transition('sunburst').duration(750);
      this.path
        .transition(trans)
        .tween('data', (d) => {
          const i = d3.interpolate(d.data.current, d.data.target);
          return (t) => (d.data.current = i(t) as number);
        })
        .filter(function (this: BaseType | SVGPathElement, d) {
          return (
            Boolean(+((this as Element).getAttribute('fill-opacity') ?? 0)) ||
            arcVisible(d.data.target)
          );
        })
        .attr('fill-opacity', (d) =>
          arcVisible(d.data.target) ? (d.children ? 0.8 : 0.4) : 0
        )
        .attrTween('d', (d) => () => this.arc(d.data.current) ?? '');
      this.label
        .filter(function (this: BaseType | SVGTextElement, d): boolean {
          return (
            Boolean(+((this as Element).getAttribute('fill-opacity') ?? 0)) ||
            labelVisible(d.data.target)
          );
        })
        .transition(trans)
        .attr('fill-opacity', (d) => +labelVisible(d.data.target))
        .attrTween(
          'transform',
          (d) => () => labelTransform(d.data.current, this.radius)
        );
    }
  }
  drawChart(): void {
    if (!this.data || !this.data.children) return;
    this.arc = d3
      .arc<HierarchyRectangularNode<SunburstNode>>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(this.radius * 1.5)
      .innerRadius((d) => d.y0 * this.radius)
      .outerRadius((d) => Math.max(d.y0 * this.radius, d.y1 * this.radius - 1));
    this.root = partition(this.data);
    this.root.each((d) => (d.data.current = d));
    const root = this.root;
    this.root.each(
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
    this.svg = svg;
    this.g = svg
      .append('g')
      .attr('transform', `translate(${this.width / 2},${this.width / 2})`);
    this.path = this.g
      .append('g')
      .selectAll('path')
      .data(this.root.descendants().slice(1))
      .join('path')
      .attr('fill', (d: HierarchyRectangularNode<SunburstNode>) => {
        while (d.depth > 1 && d.parent) {
          d = d.parent;
        }
        return this.color(d.data.name);
      })
      .attr('fill-opacity', (d) =>
        arcVisible(d.data.current) ? (d.children ? 0.8 : 0.4) : 0
      )
      .attr('d', (d: HierarchyRectangularNode<SunburstNode>) =>
        this.arc(d.data.current)
      );
    this.path
      .filter((d: HierarchyRectangularNode<SunburstNode>) =>
        d.children ? d.children.length > 0 : false
      )
      .style('cursor', 'pointer');
    this.label = this.g
      .append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .selectAll('text')
      .data(this.root.descendants().slice(1))
      .join('text')
      .attr('dy', '0.35em')
      .attr('fill-opacity', (d) => +labelVisible(d.data.current))
      .attr('transform', (d) => labelTransform(d.data.current, this.radius))
      .text((d) => d.data.name);
    this.parent = this.g
      .append('circle')
      .datum(this.root)
      .attr('r', this.radius)
      .attr('fill', 'none')
      .attr('pointer-events', 'all');
    this.path.on('click', this.clicked.bind(this));
    this.parent.on('click', this.clicked.bind(this));
    this.path.append('title').text(
      (d) =>
        `${d
          .ancestors()
          .map((dn: HierarchyRectangularNode<SunburstNode>) => dn.data.name)
          .reverse()
          .slice(1)
          .join(' > ')}\n${this.format(d.value ?? 0)}`
    );
  }
}
