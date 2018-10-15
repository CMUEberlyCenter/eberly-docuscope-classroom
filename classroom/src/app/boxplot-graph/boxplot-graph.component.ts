import { Component, OnInit, Input, AfterContentInit, OnChanges } from '@angular/core';

import * as d3 from 'd3';

import { BoxplotData, BoxplotDataEntry } from '../boxplot-data';

@Component({
  selector: 'app-boxplot-graph',
  templateUrl: './boxplot-graph.component.html',
  styleUrls: ['./boxplot-graph.component.css']
})
export class BoxplotGraphComponent implements OnInit, AfterContentInit, OnChanges {
  @Input() boxplot: BoxplotData;

  private _options: { width, height } = { width: 500, height: 50 };

  get options(): { width, height } {
    return this._options; /* = {
      width: window.innerWidth,
      height: window.innerHeight
    };*/
  }

  constructor() { }

  draw() {
    const entry_height: number = 28;
    const top_margin: number = 2;
    const bottom_margin: number = 2;
    const category_offset: number = 200;

    let x = d3.scaleLinear()
      .domain([0, 1])
      .range([category_offset, this.options.width-10]);
    let y = d3.scaleLinear()
      .domain([0, 1])
      .range([top_margin, entry_height - bottom_margin]);

    let bpdata:BoxplotDataEntry[] = this.boxplot.bpdata;
    let axis = d3.axisTop(x);//.ticks(10).tickFormat(d => d3.format("f")(d));

    let chart = d3.select(".boxplot")
      .attr("width", this.options.width)
      .attr("height", entry_height * bpdata.length);
      //.append('g')
    //.call(d3.axisTop(x));
    d3.selectAll(".boxplot_wait").remove();
    d3.selectAll(".boxplot_axis > *").remove();
    d3.select(".boxplot_axis")
      .attr('transform', 'translate(0,30)')
      .call(g => {
      g.call(axis);
      //g.selectAll(".tick text").attr('fill', 'black');
      //g.selectAll(".tick line").attr('stroke', '#777').attr('stroke-width',1);
    });

    //, (d:BoxplotDataEntry) => d.category) // d?d.categry:this.id
    chart.selectAll(".boxplot_data > *").remove();
    let bar = chart.selectAll(".boxplot_data")
      .data(bpdata)
      .enter().append("g")
      .attr("transform", (d, i) => `translate(0, ${i * entry_height})`);

    bar.append("text")
      .attr('class', 'bp-cat')
      .attr('x', 5)
      .attr('y', y(0.5))
      .attr('dy', '.35em')
      .style('cursor', 'default')
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
      .attr('width', d => x(d.q3)-x(d.q1))
      .attr('height', y(0.9)-y(0.1))
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
      .attr('y1', y(0))
      .attr('y2', y(1))
      .style('stroke', '#3C3C3C')
      .style('stroke-width', 1);
    bar.append('line')
      .attr('class', 'bp-max')
      .attr('x1', d => x(d.max))
      .attr('x2', d => x(d.max))
      .attr('y1', y(0))
      .attr('y2', y(1))
      .style('stroke', '#3C3C3C')
      .style('stroke-width', 1);

  }

  ngOnInit() {
  }

  ngAfterContentInit() {
    //if (this.boxplot) this.draw();
  }

  ngOnChanges() {
    console.log(this.boxplot);
    if (this.boxplot) this.draw();
  }
}
