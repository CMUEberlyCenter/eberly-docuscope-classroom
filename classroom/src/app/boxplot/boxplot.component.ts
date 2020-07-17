import { Component, OnInit } from '@angular/core';
import { CloudData } from 'angular-tag-cloud-module';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { AssignmentService } from '../assignment.service';
import { CorpusService } from '../corpus.service';
import { CategoryData, DocuScopeData, DsDataService } from '../ds-data.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-boxplot',
  templateUrl: './boxplot.component.html',
  styleUrls: ['./boxplot.component.css']
})
export class BoxplotComponent implements OnInit {
  cloud_data: CloudData[];
  corpus: string[];
  data: DocuScopeData;
  show_cloud = true;
  selected_category: CategoryData;
  unit = 100;

  constructor(
    private assignmentService: AssignmentService,
    private corpusService: CorpusService,
    private dataService: DsDataService,
    private settingsService: SettingsService,
    private spinner: NgxUiLoaderService
  ) { }

  getCorpus(): void {
    this.spinner.start();
    this.corpusService.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        // this.spinner.stop();
        this.getData();
      });
  }

  getData(): void {
    this.spinner.start();
    this.dataService.getData(this.corpus)
      .subscribe(data => {
        this.data = data;
        this.assignmentService.setAssignmentData(data);
        this.cloud_data = this.data.categories.map(
          (bpd: CategoryData): CloudData =>
            // TODO: check for empty category/name
            ({text: bpd.name, weight: bpd.q2} as CloudData));
        // this.max_value = max_boxplot_value(data);
        this.spinner.stop();
      });
  }

  getSettings(): void {
    this.settingsService.getSettings().subscribe(settings => {
      this.unit = settings.unit;
      this.show_cloud = settings.boxplot.cloud;
    });
  }

  ngOnInit() {
    this.getSettings();
    this.getCorpus();
  }

  onSelectCategory(category: CategoryData) {
    this.selected_category = category;
  }
}
