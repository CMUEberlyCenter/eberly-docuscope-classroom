import { Component, OnInit } from '@angular/core';

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
  categories: string[];
  x_categories: Set<string>;
  x_axis: string;
  y_categories: Set<string>;
  y_axis: string;

  constructor(private corpusService: CorpusService,
              private dataService: BoxplotDataService) {}

  getCorpus(): void {
    this.corpusService.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        this.getCategories();
      });
  }
  getCategories(): void {
    this.dataService.getBoxPlotData(this.corpus)
      .subscribe(data => {
        this.categories = data.bpdata.map(
          (bpd: BoxplotDataEntry):string => { return bpd.category; });
        this.x_categories = new Set<string>(this.categories);
        this.y_categories = new Set<string>(this.categories);
        this.x_axis = this.categories[0];
        this.y_axis = this.categories[1];
        this.x_categories.delete(this.y_axis);
        this.y_categories.delete(this.x_axis);
        this.getData();
      });
  }
  getData(): void {
    // make sure that there are valid axis before getting data.
    if (this.x_axis && this.y_axis && this.x_axis !== this.y_axis) {
      this.dataService.getScatterPlotData(this.corpus, this.x_axis, this.y_axis)
        .subscribe(data => { this.data = data; });
    }
    // TODO: add messages for failures.
  }

  ngOnInit() {
    this.getCorpus();
  }
  on_select(event):void {
    console.log(this.x_axis, this.y_axis);
    let x_cat:Set<string> = new Set<string>(this.categories);
    x_cat.delete(this.y_axis);
    this.x_categories = x_cat;
    let y_cat:Set<string> = new Set<string>(this.categories);
    y_cat.delete(this.x_axis);
    this.y_categories = y_cat;
    this.getData();
  }
}
