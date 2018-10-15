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
  x_axis: string;
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
          (bpd: BoxplotDataEntry):string => { return bpd.category; })
        this.x_axis = this.categories[0];
        this.y_axis = this.categories[1];
        this.getData();
      });
  }
  getData(): void {
    this.dataService.getScatterPlotData(this.corpus, this.x_axis, this.y_axis)
      .subscribe(data => { this.data = data; });
  }

  ngOnInit() {
    this.getCorpus();
  }
  on_select(event):void {
    console.log(this.x_axis, this.y_axis);
    this.getData();
  }
}
