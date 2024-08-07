/* Component for displaying frequency data for a category.
  The display shows a table with the columns:
  - Document name
  - Frequency value
  - graphical deviation from median
*/
import {
  AfterViewChecked,
  Component,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import * as d3 from 'd3';
import {
  CategoryData,
  category_value,
  DocumentData,
  DocuScopeData,
  max_boxplot_value,
} from '../ds-data.service';

interface Options {
  width: number;
  height: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

interface FrequencyItem {
  title: string;
  id: string;
  ownedby: string;
  value: number;
}

@Component({
  selector: 'app-frequency-graph',
  templateUrl: './frequency-graph.component.html',
  styleUrls: ['./frequency-graph.component.scss'],
})
export class FrequencyGraphComponent implements OnChanges, AfterViewChecked {
  @Input() set data(ds_data: DocuScopeData | undefined) {
    this.ds_data = ds_data;
    this._max_cache = null;
  }
  get data(): DocuScopeData | undefined {
    return this.ds_data;
  }
  @Input() category: CategoryData | null = null;
  @Input() unit!: number;
  @Input() sticky = true;
  @ViewChild('rankSort') sort!: MatSort;
  ranking: MatTableDataSource<FrequencyItem> = new MatTableDataSource();

  options: Options = {
    width: 250,
    height: 30,
    margins: { left: 10, top: 5, bottom: 5, right: 10 },
  };
  displayedColumns: string[] = ['title', 'value', 'meanbar'];

  private _max_cache: number | null = null;
  private ds_data: DocuScopeData | undefined;

  ngOnChanges(): void {
    if (this.data) {
      /*if (this.category) {
        for (const datum of this.data.data) {
          datum.value = this.unit * category_value(this.category, datum);
        }
      }*/
      this.ranking.data = this.data.data.map((datum) => ({
        ...datum,
        value: this.getValue(datum),
      }));
      this._max_cache = this.unit * max_boxplot_value(this.data);
    }
  }
  ngAfterViewChecked(): void {
    if (this.data && this.ranking) {
      this.ranking.sort = this.sort;
    }
  }

  /** Get the median value of the category. */
  get median(): number {
    return this.unit * (this.category?.q2 ?? 0);
  }

  /** The maximum value over all documents and categories. */
  get max_value(): number {
    if (!this._max_cache) {
      this._max_cache = this.unit * max_boxplot_value(this.data);
    }
    return this._max_cache;
  }
  /**
   * Gets the value of the currently selected category of the given
   * DocumentData
   * @param datum An entry from the document section of the DocuscopeData.
   */
  getValue(datum: DocumentData): number {
    return this.unit * category_value(this.category, datum);
  }
  /**
   * Get the min of the given value and the median.
   * Needed because drawing is always from left to right.
   * @param value Frequency value.
   */
  mean_start(value: number): number {
    return Math.min(value, this.median);
  }
  /**
   * Get the deviation of the value from the mean.
   * @param value Frequency value.
   */
  mean_width(value: number): number {
    return Math.abs(value - this.median);
  }
  /**
   * Tooltip text for a given value.
   * @param value Frequency value.
   */
  bar_tip(value: number): string {
    const diff = value - this.median;
    const val: string = value.toFixed(2);
    const avg: string = this.median.toFixed(2);
    const d: string = Math.abs(diff).toFixed(2);
    const sign: string = diff >= 0 ? 'more' : 'less';
    return `${val} which is about ${d} ${sign} than the median of ${avg}.`;
  }
  /** Left margin size. */
  get left(): number {
    return this.options.margins.left;
  }
  /** Right margin size. */
  get right(): number {
    return this.options.width - this.options.margins.right;
  }
  /** Scale value to x coordinate. */
  get x(): d3.ScaleLinear<number, number> {
    return d3
      .scaleLinear()
      .domain([0, this.max_value])
      .range([this.left, this.right])
      .nice()
      .clamp(true);
  }
  /**
   * Opens the single text view for the document.
   * @param doc_id A document UUID.
   */
  open(doc_id: string): void {
    if (doc_id !== '') {
      window.open(`stv/${doc_id}`);
    }
  }
}
