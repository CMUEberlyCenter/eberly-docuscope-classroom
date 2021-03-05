import { Component, OnInit } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { AssignmentService } from '../assignment.service';
import { CorpusService } from '../corpus.service';
import {
  CategoryData,
  DocuScopeData,
  DsDataService,
  CategoryInfoMap,
  genCategoryDataMap,
} from '../ds-data.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-rank',
  templateUrl: './rank.component.html',
  styleUrls: ['./rank.component.css'],
})
export class RankComponent implements OnInit {
  corpus: string[];
  data: DocuScopeData;
  dsmap: CategoryInfoMap;
  category: CategoryData;
  selected_category: string;
  unit = 100;

  get categories(): CategoryData[] {
    return this.data.categories;
  }

  constructor(
    private _assignment_service: AssignmentService,
    private _corpus_service: CorpusService,
    private _spinner: NgxUiLoaderService,
    private _data_service: DsDataService,
    private _settings_service: SettingsService
  ) {}

  getCorpus(): void {
    this._spinner.start();
    this._corpus_service.getCorpus().subscribe((corpus) => {
      this.corpus = corpus;
      // this._spinner.stop();
      this.getData();
    });
  }
  getData(): void {
    this._spinner.start();
    this._data_service.getData(this.corpus).subscribe((data) => {
      this.data = data;
      this._assignment_service.setAssignmentData(data);
      this.dsmap = genCategoryDataMap(data);
      this.category = this.categories[0];
      this.selected_category = this.category.id; // FIXME get label from common_dictionary
      this._spinner.stop();
    });
  }
  getSettings(): void {
    this._settings_service.getSettings().subscribe((settings) => {
      this.unit = settings.unit;
    });
  }
  ngOnInit() {
    this.getSettings();
    this.getCorpus();
  }
  onSelectCategory(category: string): void {
    this.selected_category = category;
    this.category = this.dsmap.get(category);
  }
}
