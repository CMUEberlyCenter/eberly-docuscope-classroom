import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewChecked, Component, EventEmitter, OnInit, Input, Output, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import * as d3 from 'd3';

import { genCategoryInfoMap, CategoryInfoMap } from '../assignment-data';
import { CategoryData, category_value, DocumentData, DocuScopeData, max_boxplot_value } from '../ds-data.service';

class Outlier {
  constructor(public id: string, public title: string, public value: number) {}
}

@Component({
  selector: 'app-boxplot-graph',
  templateUrl: './boxplot-graph.component.html',
  styleUrls: ['./boxplot-graph.component.css']
})
export class BoxplotGraphComponent implements OnInit, AfterViewChecked {
  @Input() set boxplot(data: DocuScopeData) {
    this.ds_data = data;
    this.max_value = 0.0;
    this.outliers = new Map<string, Outlier[]>();
    if (data) {
      this.boxplot_data = new MatTableDataSource(this.ds_data.categories);
      if (this.sort) { this.boxplot_data.sort = this.sort; }
      this.max_value = max_boxplot_value(data);
    }
    this.scale_x = d3.scaleLinear().domain([0, this.max_value])
      .range([this.left, this.right]).nice().clamp(true);
    this.x = d3.scaleLinear().domain([0, this.max_value * this.unit])
      .range([this.left, this.right]).nice().clamp(true);
  }
  @Input() set unit(scale: number) {
    this._unit = scale;
    this.x = d3.scaleLinear().domain([0, this.max_value * this._unit])
      .range([this.left, this.right]).nice().clamp(true);
  }
  @Output() selected_category = new EventEmitter<CategoryData>();
  @ViewChild('boxplotSort') sort: MatSort;

  boxplot_data: MatTableDataSource<CategoryData>;
  get data(): DocuScopeData { return this.ds_data; }
  ds_data: DocuScopeData;
  displayColumns: string[] = [ 'name', 'boxplot' ];
  max_value = 0.0;
  outliers: Map<string, Outlier[]>;
  selection = new SelectionModel<CategoryData>(false, []);
  scale_y;
  scale_x;
  get unit(): number { return this._unit; }
  x;

  options = {
    width: 500,
    height: 50,
    margin: {
      left: 10,
      right: 10,
      top: 2,
      bottom: 2
    }
  };

  private _unit = 100;

  constructor() { }

  // get options(): { width; height } {
  //  return this.options; /* = {
  //    width: window.innerWidth,
  //    height: window.innerHeight
  //  };*/
  // }

  handle_selection(row: CategoryData) {
    this.selection.toggle(row);
    if (this.selection.selected.length) {
      this.selected_category.emit(row);
    } else {
      this.selected_category.emit(null);
    }
  }

  scale(value: number): string {
    return `${(this.unit * value).toFixed(2)}`;
  }
  get left(): number { return this.options.margin.left; }
  get right(): number { return this.options.width - this.options.margin.right; }
  get top(): number { return this.options.margin.top; }
  get bottom(): number { return this.options.height - this.options.margin.bottom; }

  get_outliers(category: CategoryData): Outlier[] {
    if (!this.outliers.has(category.id)) {
      const uf: number = category.uifence, lf: number = category.lifence;
      const outs: Outlier[] = this.data.data.map(
        (datum: DocumentData): Outlier => new Outlier(datum.id, datum.title, category_value(category, datum))
      ).filter(
        (out: Outlier): boolean => (out.value > uf) || (out.value < lf)
      );
      // console.log(`outliers for ${category.id}, ${lf}, ${uf}:`, outs);
      this.outliers.set(category.id, outs);
    }
    return this.outliers.get(category.id);
  }

  open(doc_id: string): void {
    window.open(doc_id);
  }
  ngOnInit() {
    this.scale_y = d3.scaleLinear().domain([0, 1]).range([this.top, this.bottom]);
  }
  ngAfterViewChecked() {
    if (this.sort) { this.boxplot_data.sort = this.sort; }
  }
}
