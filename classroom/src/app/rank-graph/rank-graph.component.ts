import { Component, Input, OnChanges, OnInit, ViewChild } from "@angular/core";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";

import * as d3 from "d3";

import {
  CategoryData,
  DocumentData,
  DocuScopeData,
  category_value,
  max_boxplot_value,
} from "../ds-data.service";

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
  selector: "app-rank-graph",
  templateUrl: "./rank-graph.component.html",
  styleUrls: ["./rank-graph.component.css"],
})
export class RankGraphComponent implements OnChanges, OnInit {
  @Input() set data(ds_data: DocuScopeData) {
    this.ds_data = ds_data;
    this._max_cache = null;
  }
  get data(): DocuScopeData {
    return this.ds_data;
  }
  @Input() category: CategoryData;
  @Input() unit: number;
  @ViewChild("rankSort") sort: MatSort;
  ranking: MatTableDataSource<DocumentData>;

  options: Options = {
    width: 250,
    height: 30,
    margins: { left: 10, top: 5, bottom: 5, right: 10 },
  };
  displayedColumns: string[] = [
    /* 'position',*/ "title",
    "value",
    "meanbar" /* , 'bar'*/,
  ];

  private _max_cache: number;
  private ds_data: DocuScopeData;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (this.data) {
      if (this.category) {
        for (const datum of this.data.data) {
          datum.value = this.unit * category_value(this.category, datum);
        }
      }
      this.ranking = new MatTableDataSource(this.data.data);
      this._max_cache = this.unit * max_boxplot_value(this.data);
    }
  }
  ngAfterViewChecked(): void {
    if (this.data && this.ranking) {
      this.ranking.sort = this.sort;
    }
  }

  get median(): number {
    return this.unit * this.category.q2;
  }

  get max_value(): number {
    if (!this._max_cache) {
      this._max_cache = this.unit * max_boxplot_value(this.data);
    }
    return this._max_cache;
  }
  mean_start(value: number): number {
    return Math.min(value, this.median);
  }
  mean_width(value: number): number {
    return Math.abs(value - this.median);
  }
  bar_tip(value: number): string {
    const diff = value - this.median;
    const val: string = value.toFixed(2);
    const avg: string = this.median.toFixed(2);
    const d: string = Math.abs(diff).toFixed(2);
    const sign: string = diff >= 0 ? "more" : "less";
    return `${val} which is about ${d} ${sign} than the median of ${avg}.`;
  }
  get left(): number {
    return this.options.margins.left;
  }
  get right(): number {
    return this.options.width - this.options.margins.right;
  }
  get x() {
    return d3
      .scaleLinear()
      .domain([0, this.max_value])
      .range([this.left, this.right])
      .nice()
      .clamp(true);
  }
  open(doc_id: string): void {
    if (doc_id !== "") {
      window.open(`stv/${doc_id}`);
    }
  }
}
