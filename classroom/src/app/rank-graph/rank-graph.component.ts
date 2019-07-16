import { Component, OnInit, Input, OnChanges } from '@angular/core';

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
export class RankGraphComponent implements OnInit, OnChanges {
  @Input() rank_data: RankData;
  @Input() max_value: number;

  options: Options = { width: 250, height: 30, margins: { left: 10, top: 5, bottom: 5, right: 10 }};
  displayedColumns: string[] = ['position', 'name', 'value', 'bar'];

  constructor() { }

  ngOnInit() {
  }

  get x() {
    return d3.scaleLinear().domain([0, this.max_value * 100])
      .range([this.options.margins.left, this.options.width - this.options.margins.right]).nice().clamp(true);
  }
  scale(value: number): number {
    return 100 * value / this.max_value;
  }

  open(doc_id: string) {
    window.open(doc_id);
  }
  ngOnChanges() {
  }
}
