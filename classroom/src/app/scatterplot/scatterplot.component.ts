import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ChartSelectionChangedEvent,
  ChartType,
  GoogleChartComponent,
} from 'angular-google-charts';
import { forkJoin } from 'rxjs';
import { AssignmentService } from '../assignment.service';
import { CommonDictionary, Entry } from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import {
  CategoryData,
  category_value,
  DocumentData,
  DocuScopeData,
  DsDataService,
} from '../ds-data.service';
import { SettingsService } from '../settings.service';
import {
  SpinnerConfig,
  SpinnerPageComponent,
} from '../spinner-page/spinner-page.component';

@Component({
  selector: 'app-scatterplot',
  templateUrl: './scatterplot.component.html',
  styleUrls: ['./scatterplot.component.scss'],
})
export class ScatterplotComponent implements OnInit {
  corpus: string[] = [];
  data: DocuScopeData | undefined;
  dictionary: CommonDictionary | undefined;
  scatter_data: [number, number, string, string, string][] = [];
  get categories(): CategoryData[] {
    return this.data?.categories ?? [];
  }
  x_axis: Entry | undefined;
  x_category: CategoryData | undefined;
  y_axis: Entry | undefined;
  y_category: CategoryData | undefined;
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
        count: 5,
      },
    },
    vAxis: {
      title: 'y-axis',
      minValue: 0,
      maxValue: 1,
      gridlines: {
        count: 5,
      },
    },
    explorer: {
      maxZoomOut: 1,
      keepInBounds: true,
    },
  };

  constructor(
    private corpusService: CorpusService,
    private dictionaryService: CommonDictionaryService,
    private _assignment_service: AssignmentService,
    private dialog: MatDialog,
    private dataService: DsDataService,
    private settingsService: SettingsService
  ) {}

  genPoints(): void {
    if (this.x_axis && this.y_axis) {
      const model = 'point {fill-color: blue; dataOpacity:0.4}';
      const xLabel = this.x_axis.label;
      const yLabel = this.y_axis.label;
      const xVal = (x: DocumentData): number =>
        this.unit * category_value(this.x_category, x);
      const yVal = (y: DocumentData): number =>
        this.unit * category_value(this.y_category, y);
      const max_val: number = Math.ceil(
        this.data?.data.reduce((a, p) => Math.max(a, xVal(p), yVal(p)), 0) ?? 0
      );
      this.options.hAxis.title = xLabel;
      this.options.hAxis.maxValue = max_val;
      this.options.vAxis.title = yLabel;
      this.options.vAxis.maxValue = max_val;
      this.scatter_data =
        this.data?.data.map(
          (datum: DocumentData): [number, number, string, string, string] => [
            xVal(datum),
            yVal(datum),
            datum.id,
            datum.ownedby === 'instructor' ? model : '',
            `${datum.title}\n${xLabel}: ${xVal(datum).toFixed(
              2
            )}\n${yLabel}: ${yVal(datum).toFixed(2)}`,
          ]
        ) ?? [];
    }
  }

  ngOnInit(): void {
    const spinner = this.dialog.open(SpinnerPageComponent, SpinnerConfig);
    this.corpusService.getCorpus().subscribe((corpus) => {
      this.corpus = corpus;
      return forkJoin([
        this.dictionaryService.getJSON(),
        this.settingsService.getSettings(),
        this.dataService.getData(this.corpus),
      ]).subscribe(([common, settings, data]) => {
        // Dictionary
        this.dictionary = common;
        // Settings
        this.unit = settings.unit;
        this.chart_width = settings.scatter.width;
        this.chart_height = settings.scatter.height;
        // DocuScope Data
        this.data = data;
        this._assignment_service.setAssignmentData(data);
        const x = this.dictionary.categories[0];
        const y = this.dictionary.categories[1];
        this.x_category = this.get_category(x.name ?? x.label);
        this.y_category = this.get_category(y.name ?? y.label);
        this.x_axis = x;
        this.y_axis = y;
        this.genPoints();

        spinner.close();
      });
    });
  }
  on_select_x(clust: Entry): void {
    this.x_axis = clust;
    this.x_category = this.get_category(clust.name ?? clust.label);
    this.genPoints();
  }
  on_select_y(clust: Entry): void {
    this.y_axis = clust;
    this.y_category = this.get_category(clust.name ?? clust.label);
    this.genPoints();
  }
  get_category(category: string): CategoryData | undefined {
    return this.categories.find((c) => c.id === category);
  }
  select_point(
    plot: GoogleChartComponent, //{ dataTable?: { getValue: (a: number, b: number) => string } },
    evt: ChartSelectionChangedEvent
  ): void {
    for (const sel of evt.selection) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const id: string = plot.chartWrapper
        .getDataTable()
        .getValue(sel.row ?? 0, 2) as string;
      window.open(`stv/${id}`);
    }
  }
}
