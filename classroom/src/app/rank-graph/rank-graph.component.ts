import { Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import * as d3 from 'd3';

import { RankData, RankDataEntry } from '../boxplot-data';

interface Options {
  width: number;
  height: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

@Component({
  selector: 'app-rank-graph',
  templateUrl: './rank-graph.component.html',
  styleUrls: ['./rank-graph.component.css']
})
export class RankGraphComponent implements OnChanges, OnInit {
  @Input() rank_data: RankData;
  @Input() max_value: number;
  @ViewChild('rankSort', {static: false}) sort: MatSort;
  ranking: MatTableDataSource<RankDataEntry>;

  options: Options = { width: 250, height: 30, margins: { left: 10, top: 5, bottom: 5, right: 10 }};
  displayedColumns: string[] = [/*'position',*/ 'text', 'value', 'meanbar'/*, 'bar'*/];

  constructor() { }

  ngOnInit() {
  }
  ngOnChanges() {
    if (this.rank_data) {
      this.ranking = new MatTableDataSource(this.rank_data.result);
    }
  }
  ngAfterViewChecked() {
    if (this.rank_data) {
      this.ranking.sort = this.sort;
    }
  }

  mean_start(value: number) {
    return Math.min(value, this.rank_data.average);
  }
  mean_end(value: number) {
    return Math.max(value, this.rank_data.average);
  }
  mean_width(value: number) {
    return Math.abs(value - this.rank_data.average);
  }
  get scale() {
    return d3.scaleLinear().domain([0, this.max_value])
      .range([this.options.margins.left, this.options.width - this.options.margins.right]).nice().clamp(true);
  }
  get x() {
    return d3.scaleLinear().domain([0, this.max_value * 100])
      .range([this.options.margins.left, this.options.width - this.options.margins.right]).nice().clamp(true);
  }
  /*scale(value: number): number {
    return 100 * value / this.max_value;
  }*/

  open(doc_id: string) {
    if (doc_id != '') {
      window.open(`stv/${doc_id}`);
    }
  }
}
