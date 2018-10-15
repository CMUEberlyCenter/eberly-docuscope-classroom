import { Component, OnInit, Input, OnChanges } from '@angular/core';

import * as d3 from 'd3';

import { ScatterplotData, ScatterplotDataPoint } from '../boxplot-data';

@Component({
  selector: 'app-scatterplot-graph',
  templateUrl: './scatterplot-graph.component.html',
  styleUrls: ['./scatterplot-graph.component.css']
})
export class ScatterplotGraphComponent implements OnInit, OnChanges {
  @Input() points: ScatterplotData;

  private _options: {width,height} = { width: 400, height: 400 };

  get options(): { width, height } {
    return this._options;
  }

  constructor() { }

  draw() {
    let x = d3.scaleLinear()
      .domain([0, 100])
      .range([0, this.options.width]);
    let y = d3.scaleLinear()
      .domain([0, 100])
      .range([this.options.height, 0]);
    let x_axis = d3.axisBottom(x);
    let y_axis = d3.axisLeft(y);
    let chart = d3.select(".scatterplot")
      .attr("width", this.options.width + 40)
      .attr("height", this.options.height + 40);
    chart.selectAll('circle').remove();
    d3.select(".scatterplot_wait").remove();
    d3.selectAll('.scatterplot_axis > g').remove();
    let axis = d3.select(".scatterplot_axis").append('g');
    axis
      .attr('transform', 'translate(30,10)')
      .append('g')
      .attr('transform', `translate(0, ${this.options.height})`)
      .call(g => { g.call(x_axis); });
    axis
      .append('g')
      .call(g => { g.call(y_axis); });

    let spdata:ScatterplotDataPoint[] = this.points.spdata;
    //let color = d3.scale.category10();
    let graph = axis.selectAll(".dot")
      .data(spdata);
    graph.exit().remove();
    graph
      .enter().append("circle")
      .attr("class", "dot")
      .attr('r', 6)
      .attr("cx", d => x(d.catX))
      .attr('cy', d => y(d.catY))
      .style('fill', 'skyblue');
  }

  ngOnInit() {
  }

  ngOnChanges() {
    if (this.points) {
      /*d3.select(".scatterplot_wait").remove();
      d3.select(".scatterplot").append('g').attr('class', 'scatterplot_wait')
        .append('text').attr('y', '50%').attr('x', '50').text('Loading, please wait.');*/
      this.draw();
    }
  }
}
