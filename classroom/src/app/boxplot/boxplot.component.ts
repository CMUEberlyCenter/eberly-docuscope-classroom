import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';
import { BoxplotData, RankData } from '../boxplot-data';
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

  constructor(private corpusService: CorpusService,
              private dataService: BoxplotDataService,
              private route: ActivatedRoute,
              private location: Location) { }

  getCorpus(): void {
    //const id = +this.route.snapshot.paramMap.get('id');
    this.corpusService.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        this.getData();
      });
  }
  getData():void {
    //let corpus_scheme: DocumentSchema[] = this.corpus.documents.map((d: string):DocumentSchema => { return {id: d}; });
    this.dataService.getBoxPlotData(this.corpus)
    //this.dataService.getBoxPlotData({
    //  corpus: corpus_scheme,
    //  level: Level.Cluster,
    //  dictionary: this.corpus.ds_dictionary
    //})
      .subscribe(data => this.data = data);
  }
  /*getRankData():void {
    this.dataService.getRankedList(this.corpus, this.sort_by)
      .subscribe(data => this.rank_data = data);
  }*/
  ngOnInit() {
    this.getCorpus();
    //this.getData();
  }

}
