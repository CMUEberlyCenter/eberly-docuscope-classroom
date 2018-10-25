import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';
import { RankData, BoxplotDataEntry, max_boxplot_value } from '../boxplot-data';
import { BoxplotDataService } from '../boxplot-data.service';

@Component({
  selector: 'app-rank',
  templateUrl: './rank.component.html',
  styleUrls: ['./rank.component.css']
})
export class RankComponent implements OnInit {
  corpus: Corpus;
  data: RankData;
  categories: string[];
  category: string;
  max_value: number;

  constructor(private _corpus_service: CorpusService,
              private _spinner: NgxSpinnerService,
              private _data_service: BoxplotDataService) { }

  getCorpus(): void {
    this._spinner.show();
    this._corpus_service.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        this._spinner.hide();
        this.getCategories();
      });
  }
  getCategories(): void {
    this._spinner.show();
    this._data_service.getBoxPlotData(this.corpus)
      .subscribe(data => {
        this.categories = data.bpdata.map(
          (bpd: BoxplotDataEntry):string => { return bpd.category; });
        this.max_value = max_boxplot_value(data);
        this.category = this.categories[0];
        this._spinner.hide();
        this.getData();
      });
  }
  getData(): void {
    this._spinner.show();
    this._data_service.getRankedList(this.corpus, this.category)
      .subscribe(data => {
        this.data = data;
        this._spinner.hide();
      });
  }
  ngOnInit() {
    this.getCorpus();
  }
  on_select(event):void {
    console.log(this.category);
    this.getData();
  }
}
