import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewChecked, Component, EventEmitter, OnInit, Input, Output, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import * as d3 from 'd3';

import { BoxplotData, BoxplotDataEntry, Outlier } from '../boxplot-data';

@Component({
  selector: 'app-boxplot-graph',
  templateUrl: './boxplot-graph.component.html',
  styleUrls: ['./boxplot-graph.component.css']
})
export class BoxplotGraphComponent implements OnInit, AfterViewChecked {
  boxplot_data: MatTableDataSource<BoxplotDataEntry>;
  selection = new SelectionModel<BoxplotDataEntry>(false, []);
  @Input()
  set boxplot(bpd: BoxplotData) {
    this._boxplot = bpd;
    if (bpd) {
      this.boxplot_data = new MatTableDataSource(this._boxplot.bpdata);
      if (this.sort) { this.boxplot_data.sort = this.sort; }
    }
  }
  get boxplot(): BoxplotData { return this._boxplot; }

  @Output() selected_category = new EventEmitter<string>();
  @Input() max_value: number;
  @ViewChild('boxplotSort') sort: MatSort;

  displayColumns: string[] = [ 'category_label', 'boxplot' ];

  private _boxplot: BoxplotData;
  private _options: { width; height } = { width: 500, height: 50 };
  private _box_options = {
    width: 300,
    height: 30,
    margin: {
      left: 10,
      right: 10,
      top: 2,
      bottom: 2
    }
  };

  constructor() { }

  get options(): { width; height } {
    return this._options; /* = {
      width: window.innerWidth,
      height: window.innerHeight
    };*/
  }

  handle_selection(row: BoxplotDataEntry) {
    this.selection.toggle(row);
    if (this.selection.selected.length) {
      this.selected_category.emit(row.category);
    } else {
      this.selected_category.emit('');
    }
  }

  percent(value: number): string {
    return `${(100 * value).toFixed(2)}`;
  }
  get x() {
    const left = this._box_options.margin.left;
    const width = this._box_options.width -
      (left + this._box_options.margin.right);
    return d3.scaleLinear().domain([0, this.max_value * 100])
      .range([left, width]).nice().clamp(true);
  }
  scale_x(value: number): number {
    const left = this._box_options.margin.left;
    const width = this._box_options.width -
      (left + this._box_options.margin.right);
    const x = d3.scaleLinear()
      .domain([0, this.max_value])
      .range([left, width]).nice().clamp(true);
    return x(value);
  }
  scale_y(value: number): number {
    const top = this._box_options.margin.top;
    const height = this._box_options.height -
      (top + this._box_options.margin.bottom);
    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([top, height]);
    return y(value);
  }

  get_outliers(category: string): Outlier[] {
    return this._boxplot.outliers.filter(out => out.category === category);
  }

  open(doc_id: string) {
    window.open(doc_id);
  }
  ngOnInit() {}
  ngAfterViewChecked() {
    if (this.sort) { this.boxplot_data.sort = this.sort; }
  }
}
