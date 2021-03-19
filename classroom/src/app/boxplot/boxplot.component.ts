/*
Component for displaying the boxplot analysis page.
This includes a list of boxplots, a word cloud based on category frequency,
and ranking list based on the currently selected category.
*/
import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { CloudData } from 'angular-tag-cloud-module';
import * as d3 from 'd3';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { AssignmentService } from '../assignment.service';
import {
  CommonDictionary,
  CommonDictionaryTreeNode,
} from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
// import { DictionaryTreeService } from '../dictionary-tree.service';
import {
  CategoryData,
  category_value,
  DocumentData,
  DocuScopeData,
  DsDataService,
  max_boxplot_value,
} from '../ds-data.service';
import { SettingsService } from '../settings.service';

/** Class for storing boxplot outliers. */
class Outlier {
  constructor(public id: string, public title: string, public value: number) {}
}

interface BoxTreeNode extends CategoryData {
  label: string;
  help: string;
  children?: BoxTreeNode[];
  documents?: DocBox[];
}
interface DocBox {
  label: string;
  id: string;
  instructor: boolean;
  value: number;
  median: number;
  start: number;
  width: number;
}

@Component({
  selector: 'app-boxplot',
  templateUrl: './boxplot.component.html',
  styleUrls: ['./boxplot.component.css'],
})
export class BoxplotComponent implements OnInit {
  cloud_data: CloudData[];
  commonDictionary: CommonDictionary;
  corpus: string[];
  data: DocuScopeData;
  max_value = 0.0;
  show_cloud = false;
  selected_category: CategoryData;
  unit = 100;
  scale_x: d3.ScaleLinear<number, number, never>;
  scale_y: d3.ScaleLinear<number, number, never>;
  x: d3.ScaleLinear<number, number, never>;

  treeControl = new NestedTreeControl<BoxTreeNode>((node) => node.children);
  treeData = new MatTreeNestedDataSource<BoxTreeNode>();

  outliers: Map<string, Outlier[]>;

  options = {
    width: 500,
    height: 50,
    margin: {
      left: 10,
      right: 10,
      top: 2,
      bottom: 2,
    },
  };

  constructor(
    private assignmentService: AssignmentService,
    private commonDictionaryService: CommonDictionaryService,
    private corpusService: CorpusService,
    private dataService: DsDataService,
    private settingsService: SettingsService,
    private spinner: NgxUiLoaderService
  ) {}

  ngOnInit() {
    this.spinner.start();
    const top = this.options.margin.top;
    const bottom = this.options.height - this.options.margin.bottom;
    this.scale_y = d3.scaleLinear().domain([0, 1]).range([top, bottom]);
    this.corpusService.getCorpus().subscribe((corpus) => {
      this.corpus = corpus;
      return forkJoin([
        this.settingsService.getSettings(),
        this.commonDictionaryService.getJSON(),
        this.dataService.getData(corpus),
      ]).subscribe(([settings, common, data]) => {
        // Settings
        this.unit = settings.unit;
        this.show_cloud = settings.boxplot.cloud;
        // Dictionary
        this.commonDictionary = common;
        // dsdata
        this.data = data;
        this.assignmentService.setAssignmentData(data);
        this.max_value = max_boxplot_value(data);

        const left = this.options.margin.left;
        const right = this.options.width - this.options.margin.right;
        this.x = d3
          .scaleLinear()
          .domain([0, this.max_value * this.unit])
          .range([left, right])
          .nice()
          .clamp(true);
        this.scale_x = d3
          .scaleLinear()
          .domain([0, this.max_value])
          .range([left, right])
          .nice()
          .clamp(true);

        const get_category_data = (id: string) =>
          data.categories.filter((c) => c.id === id)[0];
        const get_document_data = (category: string): DocBox[] => {
          const cat = get_category_data(category);
          if (!cat) {
            return [];
          }
          const median: number = cat.q2;
          return data.data.map((d) => ({
            label: d.title,
            id: d.id,
            median,
            start: Math.min(category_value(category, d), median),
            width: Math.abs(category_value(category, d) - median),
            value: category_value(category, d),
            instructor: d.ownedby === 'instructor',
          }));
        };
        const dfsmap = (node: CommonDictionaryTreeNode): BoxTreeNode => ({
          label: node.label,
          help: node.help,
          children: node.children?.map(dfsmap),
          ...get_category_data(node.id),
          documents: get_document_data(node.id),
        });
        this.treeData.data = this.commonDictionary.tree.map(dfsmap);

        this.outliers = new Map<string, Outlier[]>();
        this.spinner.stop();
      });
    });
  }

  hasChild(_: number, node: BoxTreeNode): boolean {
    return !!node.children && node.children.length > 0;
  }
  hasDocuments(_: number, node: BoxTreeNode): boolean {
    return !!node.documents && node.documents.length > 0;
  }
  scale(value: number): string {
    return `${(this.unit * value).toFixed(2)}`;
  }
  open(doc_id: string): void {
    window.open(doc_id);
  }
  get_outliers(category: CategoryData): Outlier[] {
    if (!this.outliers.has(category.id)) {
      const uf: number = category.uifence;
      const lf: number = category.lifence;
      const outs: Outlier[] = this.data?.data
        .map(
          (datum: DocumentData): Outlier =>
            new Outlier(datum.id, datum.title, category_value(category, datum))
        )
        .filter((out: Outlier): boolean => out.value > uf || out.value < lf);
      this.outliers.set(category.id, outs ?? []);
    }
    return this.outliers.get(category.id);
  }

  /** Event handler for when a category is selected in the boxplot-graph. */
  onSelectCategory(category: CategoryData) {
    this.selected_category = category;
  }
}
