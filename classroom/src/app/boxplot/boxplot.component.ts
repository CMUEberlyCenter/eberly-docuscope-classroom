/*
Component for displaying the boxplot analysis page.
This includes a list of boxplots, a word cloud based on category frequency,
and ranking list based on the currently selected category.
*/
import { Component, OnInit } from '@angular/core';
import { CloudData } from 'angular-tag-cloud-module';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { AssignmentService } from '../assignment.service';
import { CommonDictionary } from '../common-dictionary';
import { CorpusService } from '../corpus.service';
// import { DictionaryTreeService } from '../dictionary-tree.service';
import { CategoryData, DocuScopeData, DsDataService } from '../ds-data.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-boxplot',
  templateUrl: './boxplot.component.html',
  styleUrls: ['./boxplot.component.css']
})
export class BoxplotComponent implements OnInit {
  cloud_data: CloudData[];
  commonDictionary: CommonDictionary;
  corpus: string[];
  data: DocuScopeData;
  show_cloud = true;
  selected_category: CategoryData;
  unit = 100;

  constructor(
    private assignmentService: AssignmentService,
    // private commonDictionaryService: DictionaryTreeService,
    private corpusService: CorpusService,
    private dataService: DsDataService,
    private settingsService: SettingsService,
    private spinner: NgxUiLoaderService
  ) { }

  /** Retrieve the category hierarchy and help. */
  // getCommonDictionary(): void {
  //  this.commonDictionaryService.getJSON().subscribe(data => {
  //    this.commonDictionary = data;
  //  });
  // }

  /** Retrieve the list of document ids to analyze. */
  getCorpus(): void {
    this.spinner.start();
    this.corpusService.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        // this.spinner.stop();
        this.getData();
      });
  }

  /** Retrieve the data for the component's corpus of documents. */
  getData(): void {
    this.spinner.start();
    this.dataService.getData(this.corpus)
      .subscribe(data => {
        this.data = data;
        this.assignmentService.setAssignmentData(data);
        this.cloud_data = this.data.categories.map(
          (bpd: CategoryData): CloudData =>
            // TODO: check for empty category/name
            ({text: bpd.id, weight: bpd.q2} as CloudData));
        // this.max_value = max_boxplot_value(data);
        this.spinner.stop();
      });
  }

  /** Retrieve the system settings file and apply them. */
  getSettings(): void {
    this.settingsService.getSettings().subscribe(settings => {
      this.unit = settings.unit;
      this.show_cloud = settings.boxplot.cloud;
    });
  }

  /** On component initialization, initiate information retrieval. */
  ngOnInit() {
    this.getSettings();
    // this.getCommonDictionary();
    this.getCorpus();
  }

  /** Event handler for when a category is selected in the boxplot-graph. */
  onSelectCategory(category: CategoryData) {
    this.selected_category = category;
  }
}
