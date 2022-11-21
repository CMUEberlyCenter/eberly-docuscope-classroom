/* Component for visualizing proportions of category instance averages
  for each document and category combination.
  It shows a table where the rows are:
  - Document name
  - One for each category (category level is selectable)
  And each cell contains a circle whose size is proportional to the
  frequency of instances of that category in the document.
*/
import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import * as d3 from 'd3';
import { forkJoin } from 'rxjs';
import { AssignmentService } from '../assignment.service';
import { CommonDictionary, Entry } from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import {
  category_value,
  DocumentData,
  DsDataService,
  max_document_data_value,
} from '../ds-data.service';
import { SettingsService } from '../settings.service';

interface ICell {
  proportion: number;
  title: string;
  value: number;
  category: string;
  path?: string;
}

@Component({
  selector: 'app-bubble-chart',
  templateUrl: './bubble-chart.component.html',
  styleUrls: ['./bubble-chart.component.scss'],
})
export class BubbleChartComponent implements OnInit, AfterViewChecked {
  @ViewChild('bubble') bubble!: ElementRef;
  @ViewChild('documentSort') sort: MatSort;
  columns: string[] = []; // current set of columns to show.
  corpus: string[] = []; // list of document ids.
  #depth = 'Category'; // Currently selected depth to show.
  dictionary: CommonDictionary | undefined;
  data: DocumentData[] = [];
  maxRadius = 20; // max radius of any given circle.
  maxValue = 0; // maximum value across all categories and documents.
  scale!: d3.ScaleLinear<number, number, never>;
  stickyHeader = true; // if the column headers should be sticky.
  tableData: MatTableDataSource<DocumentData> | undefined;
  unit = 100; // multiplier for proportion values.

  /** Currently selected dictionary level to show. */
  get depth(): string {
    return this.#depth;
  }
  /** Set the currently selected dictionary level and update columns */
  set depth(d: string) {
    this.#depth = d;
    this.columns = this.genColumns();
  }

  constructor(
    private assignmentService: AssignmentService,
    private commonDictionaryService: CommonDictionaryService,
    private corpusService: CorpusService,
    private dataService: DsDataService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.corpusService.getCorpus().subscribe((corpus) => {
      this.corpus = corpus;
      return forkJoin([
        this.settingsService.getSettings(),
        this.commonDictionaryService.getJSON(),
        this.dataService.getData(corpus),
      ]).subscribe(([settings, common, data]) => {
        this.unit = settings.unit;
        this.depth = settings.bubble.initial_level;
        this.stickyHeader = settings.sticky_headers;
        this.dictionary = common;
        this.columns = this.genColumns();
        this.data = data.data;
        this.tableData = new MatTableDataSource(this.data);
        //this.tableData.sort = this.sort;
        this.maxValue = max_document_data_value(data);
        this.scale = d3
          .scaleSqrt()
          //.scaleLinear()
          .domain([0, this.maxValue])
          .range([0, this.maxRadius])
          .nice();
        this.assignmentService.setAssignmentData(data);
      });
    });
  }

  ngAfterViewChecked(): void {
    if (this.dictionary && this.data) {
      this.tableData.sort = this.sort;
    }
  }

  /**
   * Generate the list of table column ids to show based on the currently
   * selected dictionary level.
   * @returns list of current table columns to show.
   */
  genColumns(): string[] {
    let cols: string[] = [];
    if (this.dictionary) {
      if (this.depth == 'Category') {
        cols = this.dictionary.categories.map((c) => c.name ?? c.label);
      } else if (this.depth == 'Subcategory') {
        cols = this.dictionary.categories.reduce(
          (a, c) => [...a, ...c.subcategories.map((s) => s.name ?? s.label)],
          [] as string[]
        );
      } else if (this.depth == 'Cluster') {
        cols = this.dictionary.categories.reduce(
          (a, c) => [
            ...a,
            ...c.subcategories.reduce(
              (sa, sub) => [...sa, ...sub.clusters.map((cl) => cl.name)],
              [] as string[]
            ),
          ],
          [] as string[]
        );
      }
    }
    return ['title', ...cols];
  }
  /**
   * Get the data necessary to render the cell as indexed by its document and category.
   * @param doc The cell's document
   * @param category The cell's category.
   * @returns information needed to render the cell.
   */
  getCell(doc: DocumentData, category: Entry): ICell {
    const value = category_value(category.name ?? category.label, doc);
    //const value = category_value(category.id, doc);
    return {
      title: doc.title,
      value: value * this.unit,
      proportion: this.scale(value),
      category: category.label,
      path: category.path ?? category.label,
    };
  }
  genTooltip(cell: ICell): string {
    return `Name: ${cell.title}
    Category: ${cell.path}
    Value: ${cell.value.toFixed(2)}`;
  }
  /**
   * Calculate where the i'th circle for the size legend should be drawn.
   * @param i index of legend circle.
   * @returns the x offset for where to draw the i'th circle
   */
  legend_offset(i: number): number {
    return (
      this.scale
        .ticks(4)
        .slice(1, 1 + i)
        .reduce((p, t) => p + this.scale(t), 0) * 2
    );
  }
}
