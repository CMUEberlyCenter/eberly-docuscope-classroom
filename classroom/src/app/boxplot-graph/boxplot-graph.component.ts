import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';

import * as d3 from 'd3';

import { BoxplotData, BoxplotDataEntry, Outlier } from '../boxplot-data';

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
    return `${(100 * value).toFixed(2)}`;
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

  get_outliers(category: string): Outlier[] {
    return this._boxplot.outliers.filter(out => out.category === category);
  }

  open(doc_id: string) {
    window.open(doc_id);
  }
  ngOnInit() {
  }
}
