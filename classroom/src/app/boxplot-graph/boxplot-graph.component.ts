import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';

import * as d3 from 'd3';

import { BoxplotData, BoxplotDataEntry } from '../boxplot-data';

@Component({
  selector: 'app-boxplot-graph',
  templateUrl: './boxplot-graph.component.html',
  styleUrls: ['./boxplot-graph.component.css']
})
export class BoxplotGraphComponent implements OnInit {
  private _boxplot: BoxplotData;
  @Input()
  set boxplot(bpd: BoxplotData) { this._boxplot = bpd; }
  get boxplot(): BoxplotData { return this._boxplot; }
  @Output() selected_category = new EventEmitter<string>();
  @Input() max_value: number;
  selection;

  private _options: { width, height } = { width: 500, height: 50 };

  get options(): { width, height } {
    return this._options; /* = {
      width: window.innerWidth,
      height: window.innerHeight
    };*/
  }

  handle_selection() {
    this.update_selection(this.selection.category);
  }
  update_selection(category: string) {
    this.selected_category.emit(category);
  }

  constructor() { }

  percent(value: number): string {
    return `${(100 * value).toFixed(2)}%`;
  }
  get x() {
    return d3.scaleLinear().domain([0, this.max_value * 100])
      .range([10, 280]).nice().clamp(true);
  }
  scale_x(value: number): number {
    const x = d3.scaleLinear()
      .domain([0, this.max_value])
      .range([10, 280]).nice().clamp(true); // this.options.width
    return x(value);
  }
  scale_y(value: number): number {
    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([2, 30 - 4]);
    return y(value);
  }

  draw() { //depricated
    // console.log('boxplot-graph.draw', this.boxplot);
    const entry_height = 28;
    const top_margin = 2;
    const bottom_margin = 2;
    const category_offset = 200;

    console.log(this.max_value);
    const x = d3.scaleLinear()
      .domain([0, this.max_value])
      .range([category_offset, this.options.width - 15]).nice();
    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([top_margin, entry_height - bottom_margin]);

    const bpdata: BoxplotDataEntry[] = this.boxplot.bpdata;
    const axis = d3.axisTop(x);

    d3.selectAll('.boxplot_wait').remove();
    const chart = d3.select('.boxplot')
      .attr('width', this.options.width)
      .attr('height', 30 + entry_height * bpdata.length);
    chart.selectAll('.boxplot_entry').remove();
    chart.selectAll('.boxplot_data > *').remove();

    const axis_group = chart.select('.boxplot_data').append('g');
    axis_group
      .attr('transform', 'translate(0,30)')
      .append('g')
      .call(g => {
        g.call(axis);
      });

    const component = this;

    const data_group = axis_group.selectAll('.boxplot_entry').data(bpdata);
    data_group.exit().remove();
    const bar = data_group
      .enter().append('g')
      .attr('class', 'boxplot_entry')
      .attr('transform', (d, i) => `translate(0, ${i * entry_height})`)
      .on('click', d => component.update_selection(d.category));
      // .on('mouseover', (d,i,n) => {d3.select(n[i]).style('fill','pink')})
      // .on('mouseout', (d,i,n) => {d3.select(n[i]).style('fill', null)});

    bar.append('circle')
      .attr('r', 5)
      .attr('cx', 8)
      .attr('cy', y(0.5))
      .style('stroke', 'darkgrey')
      .style('stroke-width', 1)
      .style('fill', 'none');
    bar.append('text')
      .attr('class', 'bp-cat')
      .attr('x', 16)
      .attr('y', y(0.5))
      .attr('dy', '.35em')
      .style('cursor', 'pointer')
      .text(d => d.category);

    bar.append('line') // base line
      .attr('class', 'bp-axis')
      .attr('x1', d => x(d.min))
      .attr('x2', d => x(d.max))
      .attr('y1', y(0.5))
      .attr('y2', y(0.5))
      .style('stroke', '#3C3C3C')
      .style('stroke-width', 1);
    bar.append('rect') // q1 to q3 box
      .attr('class', 'bp-box')
      .attr('x', d => x(d.q1))
      .attr('y', y(0.1))
      .attr('width', d => x(d.q3) - x(d.q1))
      .attr('height', y(0.9) - y(0.1))
      .attr('fill', '#EEEEEE')
      .style('stroke', '#3C3C3C')
      .style('stroke-width', 1);
    bar.append('line') // median (q2) line
      .attr('class', 'bp-median')
      .attr('x1', d => x(d.q2))
      .attr('x2', d => x(d.q2))
      .attr('y1', y(0.1))
      .attr('y2', y(0.9))
      .style('stroke', '#3C3C3C')
      .style('stroke-width', 1);
    bar.append('line')
      .attr('class', 'bp-min')
      .attr('x1', d => x(d.min))
      .attr('x2', d => x(d.min))
      .attr('y1', y(0.25))
      .attr('y2', y(0.75))
      .style('stroke', '#3C3C3C')
      .style('stroke-width', 1);
    bar.append('line')
      .attr('class', 'bp-max')
      .attr('x1', d => x(d.max))
      .attr('x2', d => x(d.max))
      .attr('y1', y(0.25))
      .attr('y2', y(0.75))
      .style('stroke', '#3C3C3C')
      .style('stroke-width', 1);
    bar.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '100%')
      .attr('height', y(1))
      .style('fill', 'rgba(255,255,255,0)')
      .on('mouseover', (d, i, n) => { d3.select(n[i]).style('fill', 'rgba(255,177,255,0.2)'); })
      .on('mouseout', (d, i, n) => { d3.select(n[i]).style('fill', 'rgba(255,177,255,0)'); });
  }

  ngOnInit() {
  }
}
