import { Component, OnInit } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';
import { RankData, RankDataEntry, BoxplotDataEntry, max_boxplot_value } from '../boxplot-data';
import { BoxplotDataService } from '../boxplot-data.service';

@Component({
  selector: 'app-rank',
  templateUrl: './rank.component.html',
  styleUrls: ['./rank.component.css']
})
export class RankComponent implements OnInit {
  corpus: Corpus;
  data: RankData;
  rank_data: [string, number][];
  categories: Map<string, string> = new Map<string, string>();
  category: string;
  max_value: number;
  options = {
    legend: 'none',
    hAxis: {
      viewWindow: {
        min: 0,
        max: 10
      }
    }
  };

  constructor(private _corpus_service: CorpusService,
              private _spinner: NgxUiLoaderService,
              private _data_service: BoxplotDataService) { }

  getCorpus(): void {
    this._spinner.start();
    this._corpus_service.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        this._spinner.stop();
        this.getCategories();
      });
  }
  getCategories(): void {
    this._spinner.start();
    this._data_service.getBoxPlotData(this.corpus)
      .subscribe(data => {
        this.categories = new Map<string, string>(
          data.bpdata.map((bpd: BoxplotDataEntry): [string, string] => [bpd.category, bpd.category_label]));
        this.max_value = max_boxplot_value(data);
        this.options.hAxis.viewWindow.max = this.max_value * 100;
        this.category = this.categories.keys().next().value;
        this._spinner.stop();
        this.getData();
      });
  }
  getData(): void {
    this._spinner.start();
    this._data_service.getRankedList(this.corpus, this.category)
      .subscribe(data => {
        this.data = data;
        this.rank_data = this.data.result.map((rp: RankDataEntry) => [rp.text, rp.value * 100]);
        this._spinner.stop();
      });
  }
  ngOnInit() {
    this.getCorpus();
  }
  on_select(event): void {
    // console.log(this.category);
    this.getData();
  }
  get_label(category: string): string {
    return this.categories.get(category);
  }
}
