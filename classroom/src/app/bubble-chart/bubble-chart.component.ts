import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import * as d3 from 'd3';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { AssignmentService } from '../assignment.service';
import { CommonDictionary, Entry } from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import {
  category_value,
  DocumentData,
  DsDataService,
} from '../ds-data.service';
import { SettingsService } from '../settings.service';

interface ICell {
  proportion: number;
  title: string;
  value: number;
  category: string;
}

@Component({
  selector: 'app-bubble-chart',
  templateUrl: './bubble-chart.component.html',
  styleUrls: ['./bubble-chart.component.scss'],
})
export class BubbleChartComponent implements OnInit {
  @ViewChild('bubble') bubble!: ElementRef;
  @ViewChild('documentSort') sort: MatSort;
  columns: string[] = [];
  corpus: string[] = [];
  #depth = 'Category';
  dictionary: CommonDictionary | undefined;
  data: DocumentData[] = [];
  maxRadius = 20;
  maxValue = 0;
  scale!: d3.ScaleLinear<number, number, never>;
  stickyHeader = true;
  tableData: MatTableDataSource<DocumentData> | undefined;
  unit = 100;

  get depth(): string {
    return this.#depth;
  }
  set depth(d: string) {
    this.#depth = d;
    this.columns = this.genColumns();
  }
  constructor(
    private assignmentService: AssignmentService,
    private commonDictionaryService: CommonDictionaryService,
    private corpusService: CorpusService,
    private dataService: DsDataService,
    private settingsService: SettingsService,
    private spinner: NgxUiLoaderService
  ) {}

  calcMaxValue(): number {
    const maxValue = Math.max(
      ...this.data.map((doc) =>
        Math.max(
          ...Object.values(doc)
            .map((p) => Number(p))
            .filter((n) => !isNaN(n) && n <= 1) // Remove NaN and total count
        )
      )
    );
    return maxValue > 0 ? maxValue : 1;
  }

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit(): void {
    this.spinner.start();
    this.corpusService.getCorpus().subscribe((corpus) => {
      this.corpus = corpus;
      return forkJoin([
        this.settingsService.getSettings(),
        this.commonDictionaryService.getJSON(),
        this.dataService.getData(corpus),
      ]).subscribe(([settings, common, data]) => {
        this.unit = settings.unit;
        this.stickyHeader = settings.sticky_headers;
        this.dictionary = common;
        this.columns = this.genColumns();
        this.data = data.data;
        this.tableData = new MatTableDataSource(this.data);
        this.tableData.sort = this.sort;
        this.maxValue = this.calcMaxValue();
        this.scale = d3
          .scaleSqrt()
          //.scaleLinear()
          .domain([0, this.maxValue])
          .range([0, this.maxRadius])
          .nice();
        this.assignmentService.setAssignmentData(data);
        this.spinner.stop();
      });
    });
  }
  /*ngAfterViewChecked(): void {
    if (this.dictionary && this.data) {
      this.tableSort.sort = this.sort;
    }
  }*/

  genColumns(): string[] {
    let cols: string[] = [];
    if (this.dictionary) {
      if (this.depth == 'Category') {
        cols = this.dictionary.categories.map((c) => c.name ?? c.label);
      } else if (this.depth == 'Subcategory') {
        cols = this.dictionary.categories.reduce(
          (a, c) => [...a, ...c.subcategories.map((s) => s.name ?? s.label)],
          [] as string[]
        );
      } else if (this.depth == 'Cluster') {
        cols = this.dictionary.categories.reduce(
          (a, c) => [
            ...a,
            ...c.subcategories.reduce(
              (sa, sub) => [
                ...sa,
                ...sub.clusters.map((cl) => cl.name ?? cl.label),
              ],
              [] as string[]
            ),
          ],
          [] as string[]
        );
      }
    }
    return [
      'name',
      ...cols,
      //...this.dictionary.categories.map((c) => c.name ?? c.label),
      //...this.dictionary.nodes.map((c) => c.name ?? c.label),
    ];
  }
  getCell(doc: DocumentData, category: Entry): ICell {
    const value = category_value(category.name ?? category.label, doc);
    //const value = category_value(category.id, doc);
    return {
      title: doc.title,
      value: value * this.unit,
      proportion: this.scale(value),
      category: category.label,
    };
  }
  legend_offset(i: number): number {
    return (
      this.scale
        .ticks(4)
        .slice(1, 1 + i)
        .reduce((p, t) => p + this.scale(t), 0) * 2
    );
  }
  open(doc_id: string): void {
    if (doc_id) {
      window.open(`stv/${doc_id}`);
    }
  }
}
