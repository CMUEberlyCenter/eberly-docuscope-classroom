import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
  corpus: string[] = [];
  dictionary: CommonDictionary | undefined;
  data: DocumentData[] = [];
  maxRadius = 20;
  maxValue = 0;
  scale!: d3.ScaleLinear<number, number, never>;
  stickyHeader = true;
  unit = 100;

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
        this.data = data.data;
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

  get columns(): string[] {
    return [
      'name',
      ...this.dictionary.categories.map((c) => c.name ?? c.label),
    ];
  }
  getValue(doc: DocumentData, category: Entry): number {
    return category_value(category.name ?? category.label, doc) / this.maxValue;
  }
  getCell(doc: DocumentData, category: Entry): ICell {
    const value = category_value(category.name ?? category.label, doc);
    return {
      title: doc.title,
      value: value * this.unit,
      proportion: this.scale(value),
      category: category.name ?? category.label,
    };
  }
  lscale(i: number): number {
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
