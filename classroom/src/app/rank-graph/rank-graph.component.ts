import { Component, OnInit, Input, OnChanges } from '@angular/core';

import * as d3 from 'd3';

import { RankData, RankDataEntry } from '../boxplot-data';

@Component({
  selector: 'app-rank-graph',
  templateUrl: './rank-graph.component.html',
  styleUrls: ['./rank-graph.component.css']
})
export class RankGraphComponent implements OnInit, OnChanges {
  @Input() rank_data: RankData;

  options: { width, height } = { width: 400, height: 50 };

  constructor() { }

  ngOnInit() {
  }

  draw() {
    const entry_height: number = 28;
    const top_margin: number = 2;
    const bottom_margin: number = 2;
    const title_offset:number = 200;

    let x = d3.scaleLinear()
      .domain([0, 1])
      .range([title_offset, this.options.width-10]);
    let y = d3.scaleLinear()
      .domain([0, 1])
      .range([top_margin, entry_height-bottom_margin]);

    let axis_x = d3.axisTop(x);
    d3.selectAll('.rank_wait').remove();
    //d3.selectAll('.rank_axis > g').remove();
    //d3.selectAll('.rank_data *').remove();

    let data: RankDataEntry[] = this.rank_data.result; //{index,text,value}

    let chart = d3.select('.rank_graph')
      .attr('width', this.options.width)
      .attr('height', entry_height * data.length);
    chart.selectAll('.rank_entry').remove();

    chart.selectAll('.rank_data > *').remove();
    let axis = chart.select('.rank_data').append('g');

    axis
      .attr('transform', 'translate(0,30)')
      .append('g')
      .call(g => { g.call(axis_x);} );

    //chart.selectAll('.rank_data').selectAll('*').remove();
    let data_group = axis.selectAll('.rank_entry')
      .data(data);
    data_group
      .exit().remove();
    let dg = data_group
      .enter().append('g')
      .attr('class', 'rank_entry')
      .attr('transform', (d, i) => `translate(0, ${i * entry_height})`);
    dg.append('text')
      .attr('class', 'rank-title')
      .attr('x', 5)
      .attr('y', y(0.5))
      .attr('dy', '.35em')
      .text(d => `${d.value.toFixed(3)} ${d.text.slice(0,8)}`);
    dg.append('rect')
      .attr('class', 'bars')
      .attr('x', x(0))
      .attr('y', y(.3))
      .attr('height', y(.6))
      .attr('fill', '#C6C6C6')
      .attr('width', d => x(d.value) - x(0));
  }

  ngOnChanges() {
    if (this.rank_data) this.draw();
  }

}
