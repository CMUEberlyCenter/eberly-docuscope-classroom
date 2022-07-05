/*
Component for displaying the boxplot analysis page.

This includes a list of boxplots that can be decomposed
to the various levels of hierarchical categories.
At the bottom level, the bar graphs of the documents
can be seen.
*/
import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import * as d3 from 'd3';
import { forkJoin } from 'rxjs';
import { AssignmentService } from '../assignment.service';
import {
  CommonDictionary,
  CommonDictionaryTreeNode,
} from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
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

/** Interface for the nodes in the tree display */
interface BoxTreeNode extends CategoryData {
  label: string;
  help: string;
  children?: BoxTreeNode[];
  documents?: DocBox[];
}
/** Interface for the documents in the tree display node */
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
  styleUrls: ['./boxplot.component.scss'],
})
export class BoxplotComponent implements OnInit {
  commonDictionary: CommonDictionary | undefined; // Hierachical dictionary
  corpus: string[] = []; // List of document UUID's
  data: DocuScopeData | undefined; // Results of /ds-data call
  max_value = 0.0; // corpus wide maximum value for proper scaling
  //selected_category: CategoryData;
  unit = 100; // scale of the unit value.
  scale_x!: d3.ScaleLinear<number, number, never>; // scaling x axis values
  scale_y!: d3.ScaleLinear<number, number, never>; // scaling y axis values
  x!: d3.ScaleLinear<number, number, never>; // scaling x in unit values

  // Managers for tree component.
  treeControl = new NestedTreeControl<BoxTreeNode>((node) => node.children);
  treeData = new MatTreeNestedDataSource<BoxTreeNode>();

  // Mapping of category_id -> Outlier[]
  outliers = new Map<string, Outlier[]>();

  // Display options  // FIXME: should be settable from settings.json
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
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    const top = this.options.margin.top;
    const bottom = this.options.height - this.options.margin.bottom;
    this.scale_y = d3.scaleLinear().domain([0, 1]).range([top, bottom]);
    this.corpusService.getCorpus().subscribe((corpus) => {
      this.corpus = corpus;
      return forkJoin([
        // done in parallel as there is no interdependence
        this.settingsService.getSettings(),
        this.commonDictionaryService.getJSON(),
        this.dataService.getData(corpus),
      ]).subscribe(([settings, common, data]) => {
        // Settings
        this.unit = settings.unit;
        // Dictionary
        this.commonDictionary = common;
        // dsdata
        this.data = data;
        this.assignmentService.setAssignmentData(data);
        this.max_value = max_boxplot_value(data);

        // Scaling for boxplots
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

        // Reformat data to work with tree component
        const get_category_data = (id: string): CategoryData | undefined =>
          data.categories?.find((c) => c.id === id);
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
          children: node.children?.map(dfsmap) ?? [],
          ...get_category_data(node.id),
          documents: get_document_data(node.id),
        });
        this.treeData.data = this.commonDictionary.tree.map(dfsmap);

        // Clear outliers.
        this.outliers = new Map<string, Outlier[]>();
      });
    });
  }

  /** Does the given node have any children. */
  hasChild(_: number, node: BoxTreeNode): boolean {
    return !!node.children && node.children.length > 0;
  }
  /** Does the given node have any documents. */
  hasDocuments(_: number, node: BoxTreeNode): boolean {
    return !!node.documents && node.documents.length > 0;
  }
  /**
   * Scales and truncates number to the unit scale.
   * @param value a number value from DocuScope data.
   */
  scale(value: number): string {
    return `${(this.unit * value).toFixed(2)}`;
  }
  /**
   * Returns the outliers for the given category.
   * Memoizes results.
   * @param category The category to retrieve outliers for.
   */
  get_outliers(category: CategoryData): Outlier[] {
    if (!this.outliers.has(category.id)) {
      const uf: number = category.uifence;
      const lf: number = category.lifence;
      const outs = this.data?.data
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
  //onSelectCategory(category: CategoryData): void { // used when side-by-side rank
  //  this.selected_category = category;
  //}
}
