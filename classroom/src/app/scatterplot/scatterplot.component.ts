import { Component, OnInit } from '@angular/core';
import { ChartType } from 'angular-google-charts';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AssignmentService } from '../assignment.service';
import { CorpusService } from '../corpus.service';
import { CategoryData, category_value, DocumentData, DocuScopeData, DsDataService } from '../ds-data.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-scatterplot',
  templateUrl: './scatterplot.component.html',
  styleUrls: ['./scatterplot.component.css']
})
export class ScatterplotComponent implements OnInit {
  corpus: string[];
  data: DocuScopeData;
  scatter_data: [number, number, string, string, string][];
  get categories(): CategoryData[] {
    return this.data.categories;
  }
  x_categories: Set<CategoryData>;
  x_axis: string;
  x_category: CategoryData;
  y_categories: Set<CategoryData>;
  y_axis: string;
  y_category: CategoryData;
  unit = 100;
  chartType: ChartType = ChartType.ScatterChart;
  chart_width = 400;
  chart_height = 400;

  options = {
    legend: 'none',
    colors: ['black'],
    dataOpacity: 0.6,
    hAxis: {
      title: 'x-axis',
      minValue: 0,
      maxValue: 1,
      gridlines: {
        count: 5
      }
    },
    vAxis: {
      title: 'y-axis',
      minValue: 0,
      maxValue: 1,
      gridlines: {
        count: 5
      }
    },
    explorer: {
      maxZoomOut: 1,
      keepInBounds: true
    }
  };

  constructor(
    private corpusService: CorpusService,
    private _assignment_service: AssignmentService,
    private _spinner: NgxUiLoaderService,
    private dataService: DsDataService,
    private settingsService: SettingsService
  ) {}

  getCorpus(): void {
    this._spinner.start();
    this.corpusService.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        // this._spinner.stop();
        this.getData();
      });
  }
  getData(): void {
    this._spinner.start();
    this.dataService.getData(this.corpus)
      .subscribe(data => {
        this.data = data;
        this._assignment_service.setAssignmentData(data);
        this.x_category = this.categories[0];
        this.y_category = this.categories[1];
        this.x_axis = this.x_category.id;
        this.y_axis = this.y_category.id;
        this.x_categories = new Set<CategoryData>(this.categories);
        this.y_categories = new Set<CategoryData>(this.categories);
        this.x_categories.delete(this.y_category);
        this.y_categories.delete(this.x_category);
        this.genPoints();
        this._spinner.stop();
      });
  }

  getSettings(): void {
    this.settingsService.getSettings().subscribe(settings => {
      this.unit = settings.unit;
      this.chart_width = settings.scatter.width;
      this.chart_height = settings.scatter.height;
    });
  }

  genPoints(): void {
    if (this.x_axis && this.y_axis && this.x_axis !== this.y_axis) {
      const model = 'point {fill-color: blue; dataOpacity:0.4}';
      const xLabel = this.x_category.id;
      const yLabel = this.y_category.id; // FIXME: use label from common
      const xVal = (x: DocumentData): number => this.unit * category_value(this.x_category, x);
      const yVal = (y: DocumentData): number => this.unit * category_value(this.y_category, y);
      const max_val: number = Math.ceil(this.data.data.reduce((a, p) => Math.max(a, xVal(p), yVal(p)), 0));
      this.options.hAxis.title = xLabel;
      this.options.hAxis.maxValue = max_val;
      this.options.vAxis.title = yLabel;
      this.options.vAxis.maxValue = max_val;
      this.scatter_data = this.data.data.map(
        (datum: DocumentData): [number, number, string, string, string] => [
          xVal(datum), // {v: xVal(datum), f: `${datum.title}\n${xLabel}: ${xVal(datum).toFixed(2)}`},
          yVal(datum), // {v: yVal(datum), f: `${yLabel}: ${yVal(datum).toFixed(2)}`},
          datum.id,
          datum.ownedby === 'instructor' ? model : null,
          `${datum.title}\n${xLabel}: ${xVal(datum).toFixed(2)}\n${yLabel}: ${yVal(datum).toFixed(2)}`
        ]);
    }
  }

  ngOnInit() {
    this.getSettings();
    this.getCorpus();
  }
  on_select_x(clust: string): void {
    this.x_category = this.get_category(clust);
    this.genPoints();
  }
  on_select_y(clust: string): void {
    this.y_category = this.get_category(clust);
    this.genPoints();
  }
  on_select(): void {
    this.x_category = this.get_category(this.x_axis);
    this.y_category = this.get_category(this.y_axis);
    console.log(this.x_category.id, this.y_category.id);
    // const x_cat: Set<CategoryData> = new Set<CategoryData>(this.categories);
    // x_cat.delete(this.y_category);
    // this.x_categories = x_cat;
    // const y_cat: Set<CategoryData> = new Set<CategoryData>(this.categories);
    // y_cat.delete(this.x_category);
    // this.y_categories = y_cat;
    this.genPoints();
  }
  get_category(category: string): CategoryData {
    return this.categories.find(c => c.id === category);
  }
  select_point(plot, evt): void {
    for (const sel of evt.selection) {
      const id: string = plot.dataTable.getValue(sel.row, 2);
      window.open(`stv/${id}`);
    }
  }
}
