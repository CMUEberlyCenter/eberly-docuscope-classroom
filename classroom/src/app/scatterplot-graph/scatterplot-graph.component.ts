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
    let ex_x = d3.extent(this.points.spdata, d => d['catX']);
    let ex_y = d3.extent(this.points.spdata, d => d['catY']);
    let max_value = Math.max(ex_x[1], ex_y[1]);
    let x = d3.scaleLinear()
      .domain([0, max_value])
      .range([0, this.options.width]).nice();
    let y = d3.scaleLinear()
      .domain([0, max_value])
      .range([this.options.height, 0]).nice();
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
      .style('fill', 'skyblue')
      .on("mouseover", d => {
        console.log(`mouseover: ${d}`);
        let div = d3.select('div.tooltip');
        div.transition().duration(200).style("opacity", .9);
        div.html(d.title)
          .style('left', (d3.event.pageX)+'px')
          .style('top', (d3.event.pageY-30)+'px');
      })
      .on('mouseout', d => d3.select('div.tooltip').transition().duration(500).style('opacity',0))
      .on('click', d => window.open(`/stv/${d.text_id}`));
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
