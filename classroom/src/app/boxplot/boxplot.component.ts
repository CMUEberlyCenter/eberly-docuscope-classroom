import { Component, OnInit, Input } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';
import { BoxplotData, RankData, max_boxplot_value } from '../boxplot-data';
import { BoxplotDataService } from '../boxplot-data.service';

@Component({
  selector: 'app-boxplot',
  templateUrl: './boxplot.component.html',
  styleUrls: ['./boxplot.component.css']
})
export class BoxplotComponent implements OnInit {
  corpus: Corpus;
  data: BoxplotData;
  rank_data: RankData;
  selected_category: string;
  max_value: number;

  constructor(private corpusService: CorpusService,
              private spinner: NgxSpinnerService,
              private dataService: BoxplotDataService) { }

  getCorpus(): void {
    //const id = +this.route.snapshot.paramMap.get('id');
    this.spinner.show();
    this.corpusService.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        this.spinner.hide();
        this.getData();
      });
  }
  getData():void {
    this.spinner.show();
    this.dataService.getBoxPlotData(this.corpus)
      .subscribe(data => {
        this.data = data;
        this.max_value = max_boxplot_value(data);
        this.spinner.hide();
      });
  }
  getRankData(selected_category:string):void {
    if (selected_category) {
      this.spinner.show();
      this.dataService.getRankedList(this.corpus, selected_category)
        .subscribe(data => {
          this.rank_data = data;
          this.spinner.hide();
        });
    }
  }
  ngOnInit() {
    console.log("boxplot.component ngOnInit()");
    this.getCorpus();
  }
  ngAfterViewCheck() {
    //this.getCorpus();
  }
  ngAfterViewInit() {
    //this.getCorpus();
  }
  ngOnDestroy() {
    //this.data = null;
  }
  onSelectCategory(category:string) {
    this.selected_category = category;
    this.getRankData(category);
  }
}
