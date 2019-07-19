import { Component, OnInit } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';
import { ScatterplotData, BoxplotDataEntry } from '../boxplot-data';
import { BoxplotDataService } from '../boxplot-data.service';

@Component({
  selector: 'app-scatterplot',
  templateUrl: './scatterplot.component.html',
  styleUrls: ['./scatterplot.component.css']
})
export class ScatterplotComponent implements OnInit {
  corpus: Corpus;
  data: ScatterplotData;
  scatter_data: [number,number,string,string,string][];
  categories: BoxplotDataEntry[];
  x_categories: Set<BoxplotDataEntry>;
  x_axis: string;
  y_categories: Set<BoxplotDataEntry>;
  y_axis: string;

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
    }
  };

  constructor(private corpusService: CorpusService,
              private _spinner: NgxUiLoaderService,
              private dataService: BoxplotDataService) {}

  getCorpus(): void {
    this._spinner.start();
    this.corpusService.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        this._spinner.stop();
        this.getCategories();
      });
  }
  getCategories(): void {
    this._spinner.start();
    this.dataService.getBoxPlotData(this.corpus)
      .subscribe(data => {
        // if (!data.bpdata) // TODO check for not enough categories
        this.categories = data.bpdata;
        this.x_categories = new Set<BoxplotDataEntry>(this.categories);
        this.y_categories = new Set<BoxplotDataEntry>(this.categories);
        this.x_axis = this.categories[0].category;
        this.y_axis = this.categories[1].category;
        this.x_categories.delete(this.categories.find(c => c.category === this.y_axis));
        this.y_categories.delete(this.categories.find(c => c.category === this.x_axis));
        this._spinner.stop();
        this.getData();
      });
  }
  getData(): void {
    // make sure that there are valid axis before getting data.
    if (this.x_axis && this.y_axis && this.x_axis !== this.y_axis) {
      this._spinner.start();
      this.dataService.getScatterPlotData(this.corpus, this.x_axis, this.y_axis)
        .subscribe(data => {
          this.data = data;
          const x_label = this.get_label(this.x_axis);
          const y_label = this.get_label(this.y_axis);
          const max_val: number = Math.ceil(data.spdata.reduce((a, p) => Math.max(a, p.catX, p.catY), 0));
          this.options.hAxis.title = x_label;
          this.options.hAxis.maxValue = max_val;
          this.options.vAxis.title = y_label;
          this.options.vAxis.maxValue = max_val;
          const model: string = 'point {fill-color: blue; dataOpacity:0.4}';
          this.scatter_data = data.spdata.map(p => [
            p.catX, p.catY, p.text_id,
            p.ownedby==='instructor'?model:null,
            `${p.title}\n${x_label}: ${p.catX.toFixed(2)}\n${y_label}: ${p.catY.toFixed(2)}`
          ]);
          this._spinner.stop();
        });
    }
    // TODO: add messages for failures.
  }

  ngOnInit() {
    this.getCorpus();
  }
  on_select(event): void {
    // console.log(this.x_axis, this.y_axis);
    const x_cat: Set<BoxplotDataEntry> = new Set<BoxplotDataEntry>(this.categories);
    x_cat.delete(this.categories.find(c => c.category === this.y_axis));
    this.x_categories = x_cat;
    const y_cat: Set<BoxplotDataEntry> = new Set<BoxplotDataEntry>(this.categories);
    y_cat.delete(this.categories.find(c => c.category === this.x_axis));
    this.y_categories = y_cat;
    this.getData();
  }
  get_label(category: string): string {
    return this.categories.find(c => c.category === category).category_label;
  }
  select_point(plot, evt): void {
    const id: string = plot.dataTable.getValue(evt[0].row, 2);
    window.open(`stv/${id}`);
  }
}
