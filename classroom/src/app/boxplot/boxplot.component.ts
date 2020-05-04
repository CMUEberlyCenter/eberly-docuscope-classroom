import { Component, OnInit } from '@angular/core';
import { CloudData } from 'angular-tag-cloud-module';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { AssignmentService } from '../assignment.service';
import { CorpusService } from '../corpus.service';
import { BoxplotData, BoxplotDataEntry, RankData, max_boxplot_value } from '../boxplot-data';
import { BoxplotDataService } from '../boxplot-data.service';

@Component({
  selector: 'app-boxplot',
  templateUrl: './boxplot.component.html',
  styleUrls: ['./boxplot.component.css']
})
export class BoxplotComponent implements OnInit {
  corpus: string[];
  data: BoxplotData;
  rank_data: RankData;
  cloud_data: CloudData[];
  selected_category: string;
  max_value: number;

  constructor(
    private corpusService: CorpusService,
    private spinner: NgxUiLoaderService,
    private dataService: BoxplotDataService,
    private assignmentService: AssignmentService) { }

  getCorpus(): void {
    this.spinner.start();
    this.corpusService.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        this.spinner.stop();
        this.getData();
      });
  }
  getData(): void {
    this.spinner.start();
    this.dataService.getBoxPlotData(this.corpus)
      .subscribe(data => {
        this.data = data;
        this.assignmentService.setAssignmentData(data);
        this.cloud_data = this.data.bpdata.map(
          (bpd: BoxplotDataEntry): CloudData =>
            ({text: bpd.category_label, weight: bpd.q2} as CloudData));
        this.max_value = max_boxplot_value(data);
        this.spinner.stop();
      });
  }
  getRankData(selected_category: string): void {
    if (selected_category) {
      this.spinner.start();
      this.dataService.getRankedList(this.corpus, selected_category)
        .subscribe(data => {
          this.rank_data = data;
          this.spinner.stop();
        });
    } else {
      this.rank_data = null;
    }
  }

  ngOnInit() {
    this.getCorpus();
  }

  onSelectCategory(category: string) {
    this.selected_category = category;
    this.getRankData(category);
  }
}
