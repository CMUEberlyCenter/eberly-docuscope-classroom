import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { forkJoin } from 'rxjs';
import { AssignmentService } from '../assignment.service';
import { CommonDictionary, Entry } from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import {
  CategoryData,
  category_value,
  DocumentData,
  DocuScopeData,
  DsDataService,
  max_document_data_value,
} from '../ds-data.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-scatterplot',
  templateUrl: './scatterplot.component.html',
  styleUrls: ['./scatterplot.component.scss'],
})
export class ScatterplotComponent implements OnInit {
  corpus: string[] = [];
  data: DocuScopeData | undefined;
  dictionary: CommonDictionary | undefined;
  scatter_data: [number, number, string, string, string][] = [];
  get categories(): CategoryData[] {
    return this.data?.categories ?? [];
  }
  max_value = 0;
  margin = { top: 16, right: 16, bottom: 30, left: 48 };
  p_width = 400;
  p_height = 400;
  width = this.p_width + this.margin.left + this.margin.right;
  height = this.p_height + this.margin.top + this.margin.bottom;
  x: d3.ScaleLinear<number, number, never> = d3
    .scaleLinear()
    .range([0, this.p_width])
    .nice()
    .clamp(true);
  x_axis: Entry | undefined;
  x_category: CategoryData | undefined;
  y: d3.ScaleLinear<number, number, never> = d3
    .scaleLinear()
    .range([this.p_height, 0])
    .nice()
    .clamp(true);
  y_axis: Entry | undefined;
  y_category: CategoryData | undefined;
  unit = 100;

  constructor(
    private corpusService: CorpusService,
    private dictionaryService: CommonDictionaryService,
    private assignment_service: AssignmentService,
    private dataService: DsDataService,
    private settingsService: SettingsService
  ) {}

  get_value(category: CategoryData, datum: DocumentData): number {
    return this.unit * category_value(category, datum);
  }
  get_max_value(x_category: CategoryData, y_category: CategoryData): number {
    return !this.data
      ? 0
      : Math.max(
          ...this.data.data.map((doc) =>
            Math.max(
              this.get_value(x_category, doc),
              this.get_value(y_category, doc)
            )
          )
        );
  }
  is_model(datum: DocumentData) {
    return datum.ownedby === 'instructor';
  }

  ngOnInit(): void {
    this.corpusService.getCorpus().subscribe((corpus) => {
      this.corpus = corpus;
      return forkJoin([
        this.dictionaryService.getJSON(),
        this.settingsService.getSettings(),
        this.dataService.getData(this.corpus),
      ]).subscribe(([common, settings, data]) => {
        // Dictionary
        this.dictionary = common;
        // Settings
        this.unit = settings.unit;
        //this.options.width = settings.scatter.width;
        //this.options.height = settings.scatter.height;
        // DocuScope Data
        this.data = data;
        this.assignment_service.setAssignmentData(data);
        this.max_value = max_document_data_value(data);
        const x = this.dictionary.categories[0];
        const y = this.dictionary.categories[1];
        this.x_category = this.get_category(x.name ?? x.label);
        this.y_category = this.get_category(y.name ?? y.label);
        this.x_axis = x;
        this.y_axis = y;
        this.update_axis();
      });
    });
  }
  update_axis(): void {
    this.max_value = this.get_max_value(this.x_category, this.y_category);
    this.x.domain([0, this.max_value]).nice();
    this.y.domain([0, this.max_value]).nice();
  }
  on_select_x(clust: Entry): void {
    this.x_axis = clust;
    this.x_category = this.get_category(clust.name ?? clust.label);
    this.update_axis();
    //this.genPoints();
  }
  on_select_y(clust: Entry): void {
    this.y_axis = clust;
    this.y_category = this.get_category(clust.name ?? clust.label);
    this.update_axis();
    //this.genPoints();
  }
  get_category(category: string): CategoryData | undefined {
    return this.categories.find((c) => c.id === category);
  }
  point_tooltip(datum: DocumentData): string {
    return `${datum.title}
              ${this.x_axis.label}: ${this.get_value(
                this.x_category,
                datum
              ).toFixed(2)}
              ${this.y_axis.label}: ${this.get_value(
                this.y_category,
                datum
              ).toFixed(2)}`;
  }
}
