/// <reference types="@types/google.visualization" />
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
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
import { GoogleChartsLoaderService } from '../google-charts-loader.service';
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
export class ScatterplotComponent implements AfterViewInit, OnInit {
  @ViewChild('chart') scatterplot!: ElementRef<Element>;
  chart: google.visualization.ScatterChart;
  corpus: string[] = [];
  data: DocuScopeData | undefined;
  data_table: google.visualization.DataTable;
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

  options: google.visualization.ScatterChartOptions = {
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
    height: 400,
    width: 400,
  };

  constructor(
    private corpusService: CorpusService,
    private dictionaryService: CommonDictionaryService,
    private _assignment_service: AssignmentService,
    private dialog: MatDialog,
    private dataService: DsDataService,
    private settingsService: SettingsService,
    private googleChartService: GoogleChartsLoaderService
  ) {}

  genPoints(): void {
    if (this.x_axis && this.y_axis && this.chart) {
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
            datum.ownedby !== 'instructor' ? model : '',
            `${datum.title}\n${xLabel}: ${xVal(datum).toFixed(
              2
            )}\n${yLabel}: ${yVal(datum).toFixed(2)}`,
          ]
        ) ?? [];
      const data = new google.visualization.DataTable();
      data.addColumn('number', xLabel, 'x');
      data.addColumn('number', yLabel, 'y');
      data.addColumn({ type: 'string', role: 'id' });
      data.addColumn({ type: 'string', role: 'style', id: 'student' });
      data.addColumn({ type: 'string', role: 'tooltip', id: 'tip' });
      data.addRows(this.scatter_data);
      this.data_table = data;
      this.chart.draw(data, this.options);
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
        this.options.width = settings.scatter.width;
        this.options.height = settings.scatter.height;
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
  ngAfterViewInit(): void {
    void this.makeChart();
  }
  async makeChart(): Promise<void> {
    await this.googleChartService.load();
    // Google Chart
    this.chart = new google.visualization.ScatterChart(
      this.scatterplot.nativeElement
    );

    google.visualization.events.addListener(this.chart, 'select', () => {
      for (const item of this.chart.getSelection()) {
        console.log(item);
        if (item.row !== null) {
          const id = this.data_table.getValue(item.row, 2) as string;
          if (id) {
            window.open(`stv/${id}`);
          }
        }
      }
    });
    this.genPoints();
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
}
