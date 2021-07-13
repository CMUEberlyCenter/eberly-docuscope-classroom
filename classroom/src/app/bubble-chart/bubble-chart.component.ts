import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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

interface ICell {
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
  get maxValue(): number {
    const maxValue = Math.max(
      ...this.data.map((doc) =>
        Math.max(
          ...Object.values(doc)
            .map((p) => Number(p))
            .filter((n) => n <= 1) // Remove NaN and total count
        )
      )
    );
    return maxValue > 0 ? maxValue : 1;
  }

  constructor(
    private assignmentService: AssignmentService,
    private commonDictionaryService: CommonDictionaryService,
    private corpusService: CorpusService,
    private dataService: DsDataService,
    private spinner: NgxUiLoaderService
  ) {}

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit(): void {
    this.spinner.start();
    this.corpusService.getCorpus().subscribe((corpus) => {
      this.corpus = corpus;
      return forkJoin([
        this.commonDictionaryService.getJSON(),
        this.dataService.getData(corpus),
      ]).subscribe(([common, data]) => {
        this.dictionary = common;
        this.data = data.data;
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
    return {
      title: doc.title,
      value: this.getValue(doc, category),
      category: category.name ?? category.label,
    };
  }
  open(doc_id: string): void {
    if (doc_id) {
      window.open(`stv/${doc_id}`);
    }
  }
}
