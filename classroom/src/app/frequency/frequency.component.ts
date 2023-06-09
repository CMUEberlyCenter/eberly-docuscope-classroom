/* Component for comparing documents prevalence of categories.
  Select a category and the documents frequency of that category
  will be displayed in a table.

  TODO: add toggle for hiding model texts. (pending approval)
  TODO: side-by-side displays for comparison. (pending approval)
*/
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AssignmentService } from '../assignment.service';
import { CommonDictionary, Entry } from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import {
  CategoryData,
  CategoryInfoMap,
  DocuScopeData,
  DsDataService,
  genCategoryDataMap,
} from '../ds-data.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-frequency',
  templateUrl: './frequency.component.html',
  styleUrls: ['./frequency.component.scss'],
})
export class FrequencyComponent implements OnInit {
  corpus: string[] = []; // list of document UUID's
  data: DocuScopeData | undefined; // data from /ds_data
  dictionary: CommonDictionary | undefined;
  dsmap: CategoryInfoMap | undefined;
  category: CategoryData | undefined;
  selected_category: Entry | undefined;
  sticky = true;
  unit = 100; // multiplier for instance frequency

  /** Per category data. */
  get categories(): CategoryData[] {
    return this.data?.categories ?? [];
  }

  constructor(
    private _assignment_service: AssignmentService,
    private commonDictionaryService: CommonDictionaryService,
    private _corpus_service: CorpusService,
    private _data_service: DsDataService,
    private _settings_service: SettingsService
  ) {}

  ngOnInit(): void {
    this._corpus_service.getCorpus().subscribe((corpus) => {
      this.corpus = corpus;
      return forkJoin([
        // parallel join of requests.
        this._settings_service.getSettings(),
        this.commonDictionaryService.getJSON(),
        this._data_service.getData(corpus),
      ]).subscribe(([settings, common, data]) => {
        // Settings
        this.unit = settings.unit;
        // Dictionary
        this.dictionary = common;
        // DocuScope data
        this.data = data;
        this._assignment_service.setAssignmentData(data);
        this.dsmap = genCategoryDataMap(data);
        this.onSelectCategory(common.categories[0]);
      });
    });
  }
  /**
   * Populates the category data for the given category.
   * @param category the menu entry selected by user.
   */
  onSelectCategory(category: Entry): void {
    this.selected_category = category;
    this.category = this.dsmap?.get(category.name ?? category.label);
  }
}
