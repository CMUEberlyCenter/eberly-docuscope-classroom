import { Component, EventEmitter, OnInit, Input, Output, AfterContentInit, OnChanges } from '@angular/core';

import * as d3 from 'd3';

import { BoxplotData, BoxplotDataEntry } from '../boxplot-data';

@Component({
  selector: 'app-boxplot-graph',
  templateUrl: './boxplot-graph.component.html',
  styleUrls: ['./boxplot-graph.component.css']
})
export class BoxplotGraphComponent implements OnInit, AfterContentInit, OnChanges {
  private _boxplot: BoxplotData;
  @Input()
  set boxplot(bpd: BoxplotData) { this._boxplot = bpd; };
  get boxplot():BoxplotData { return this._boxplot; }
  @Output() selected_category = new EventEmitter<string>();

  private _options: { width, height } = { width: 500, height: 50 };

  get options(): { width, height } {
    return this._options; /* = {
      width: window.innerWidth,
      height: window.innerHeight
    };*/
  }

  update_selection(category:string) {
    //console.log(category);
    this.selected_category.emit(category);
  }

  constructor() { }

  draw() {
    console.log("boxplot-graph.draw",this.boxplot);
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

    d3.selectAll('.boxplot_wait').remove();
    let chart = d3.select(".boxplot")
      .attr("width", this.options.width)
      .attr("height", 30 + entry_height * bpdata.length);
    chart.selectAll('.boxplot_entry').remove();
    chart.selectAll('.boxplot_data > *').remove();

    let axis_group = chart.select('.boxplot_data').append('g');
    axis_group
      .attr('transform', 'translate(0,30)')
      .append('g')
      .call(g => {
        g.call(axis);
      //g.selectAll(".tick text").attr('fill', 'black');
      //g.selectAll(".tick line").attr('stroke', '#777').attr('stroke-width',1);
      });

    const component = this;

    let data_group = axis_group.selectAll('.boxplot_entry').data(bpdata);
    data_group.exit().remove();
    let bar = data_group
      .enter().append("g")
      .attr('class', 'boxplot_entry')
      .attr("transform", (d, i) => `translate(0, ${i * entry_height})`)
      .on("click", (d, i) => component.update_selection(d.category));

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
    //if (this.boxplot) this.draw();
  }

  ngAfterContentInit() {
    //if (this.boxplot) this.draw();
  }
  ngAfterViewInit() {
    if (this.boxplot) this.draw();
  }
  ngOnChanges() {
    //console.log(this.boxplot);
    if (this.boxplot) this.draw();
  }
}
