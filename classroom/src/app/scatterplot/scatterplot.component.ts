import { Component, OnInit } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';
import { ScatterplotData, BoxplotDataEntry } from '../boxplot-data';
import { BoxplotDataService } from '../boxplot-data.service';

@Component({
  selector: 'app-scatterplot',
  templateUrl: './scatterplot.component.html',
  styleUrls: ['./scatterplot.component.css']
})
export class ScatterplotComponent implements OnInit {
  corpus: Corpus;
  data: ScatterplotData;
  categories: BoxplotDataEntry[];
  x_categories: Set<BoxplotDataEntry>;
  x_axis: string;
  y_categories: Set<BoxplotDataEntry>;
  y_axis: string;

  constructor(private corpusService: CorpusService,
              private _spinner: NgxUiLoaderService,
              private dataService: BoxplotDataService) {}

  getCorpus(): void {
    this._spinner.start();
    this.corpusService.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        this._spinner.stop();
        this.getCategories();
      });
  }
  getCategories(): void {
    this._spinner.start();
    this.dataService.getBoxPlotData(this.corpus)
      .subscribe(data => {
        // if (!data.bpdata) // TODO check for not enough categories
        this.categories = data.bpdata;
        this.x_categories = new Set<BoxplotDataEntry>(this.categories);
        this.y_categories = new Set<BoxplotDataEntry>(this.categories);
        this.x_axis = this.categories[0].category;
        this.y_axis = this.categories[1].category;
        this.x_categories.delete(this.categories.find(c => c.category === this.y_axis));
        this.y_categories.delete(this.categories.find(c => c.category === this.x_axis));
        this._spinner.stop();
        this.getData();
      });
  }
  getData(): void {
    // make sure that there are valid axis before getting data.
    if (this.x_axis && this.y_axis && this.x_axis !== this.y_axis) {
      this._spinner.start();
      this.dataService.getScatterPlotData(this.corpus, this.x_axis, this.y_axis)
        .subscribe(data => {
          this.data = data;
          this._spinner.stop();
        });
    }
    // TODO: add messages for failures.
  }

  ngOnInit() {
    this.getCorpus();
  }
  on_select(event): void {
    console.log(this.x_axis, this.y_axis);
    const x_cat: Set<BoxplotDataEntry> = new Set<BoxplotDataEntry>(this.categories);
    x_cat.delete(this.categories.find(c => c.category === this.y_axis));
    this.x_categories = x_cat;
    const y_cat: Set<BoxplotDataEntry> = new Set<BoxplotDataEntry>(this.categories);
    y_cat.delete(this.categories.find(c => c.category === this.x_axis));
    this.y_categories = y_cat;
    this.getData();
  }
}
