/***** DEPRECATED ******/

/* Component for displaying a list of boxplots, one for each category.

Takes as input a DocuScopeData object and a unit scale which are used to
construct and scale the boxplots.
Emits when a category is selected by clicking on it.
The boxplots are also user sortable based on category name.
 */
import { SelectionModel } from '@angular/cdk/collections';
import { NestedTreeControl } from '@angular/cdk/tree';
import {
  AfterViewChecked,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import * as d3 from 'd3';
import {
  CommonDictionary,
  CommonDictionaryTreeNode,
} from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';
import {
  CategoryData,
  category_value,
  DocumentData,
  DocuScopeData,
  max_boxplot_value,
} from '../ds-data.service';

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
  selector: 'app-boxplot-graph',
  templateUrl: './boxplot-graph.component.html',
  styleUrls: ['./boxplot-graph.component.css'],
})
export class BoxplotGraphComponent implements OnInit, AfterViewChecked {
  /** When the boxplot data parameter is set, update relevant fields. */
  @Input() set boxplot(data: DocuScopeData) {
    this.ds_data = data;
    this.max_value = 0.0;
    this.outliers = new Map<string, Outlier[]>();
    if (data) {
      this.boxplot_data = new MatTableDataSource(this.ds_data.categories);
      if (this.sort) {
        this.boxplot_data.sort = this.sort;
      }
      this.max_value = max_boxplot_value(data);
      this.setData();
    }
    this.scale_x = d3
      .scaleLinear()
      .domain([0, this.max_value])
      .range([this.left, this.right])
      .nice()
      .clamp(true);
    this.x = d3
      .scaleLinear()
      .domain([0, this.max_value * this.unit])
      .range([this.left, this.right])
      .nice()
      .clamp(true);
  }
  @Input() set unit(scale: number) {
    this._unit = scale;
    this.x = d3
      .scaleLinear()
      .domain([0, this.max_value * this._unit])
      .range([this.left, this.right])
      .nice()
      .clamp(true);
  }
  get unit(): number {
    return this._unit;
  }
  @Output() selected_category = new EventEmitter<CategoryData>();
  @ViewChild('boxplotSort') sort: MatSort;

  boxplot_data: MatTableDataSource<CategoryData>;
  commonDictionary: CommonDictionary;
  get data(): DocuScopeData {
    return this.ds_data;
  }
  ds_data: DocuScopeData;
  //displayColumns: string[] = [ 'name', 'boxplot' ];
  max_value = 0.0;
  outliers: Map<string, Outlier[]>;
  selection = new SelectionModel<CategoryData>(false, []);
  scale_y: d3.ScaleLinear<number, number, never>;
  scale_x: d3.ScaleLinear<number, number, never>;
  x: d3.ScaleLinear<number, number, never>;

  treeControl = new NestedTreeControl<BoxTreeNode>((node) => node.children);
  treeData = new MatTreeNestedDataSource<BoxTreeNode>();

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

  private _unit = 100;

  constructor(private commonDictionaryService: CommonDictionaryService) {}

  // get options(): { width; height } {
  //  return this.options; /* = {
  //    width: window.innerWidth,
  //    height: window.innerHeight
  //  };*/
  // }

  handle_selection(row: CategoryData) {
    this.selection.toggle(row);
    if (this.selection.selected.length) {
      this.selected_category.emit(row);
    } else {
      this.selected_category.emit(null);
    }
  }

  scale(value: number): string {
    return `${(this.unit * value).toFixed(2)}`;
  }
  get left(): number {
    return this.options.margin.left;
  }
  get right(): number {
    return this.options.width - this.options.margin.right;
  }
  get top(): number {
    return this.options.margin.top;
  }
  get bottom(): number {
    return this.options.height - this.options.margin.bottom;
  }

  getCommonDictionary(): void {
    this.commonDictionaryService.getJSON().subscribe((data) => {
      this.commonDictionary = data;
      this.setData();
    });
  }
  setData() {
    if (this.ds_data && this.commonDictionary) {
      const dfsmap = (node: CommonDictionaryTreeNode): BoxTreeNode => ({
        label: node.label,
        help: node.help,
        children: node.children?.map(dfsmap),
        ...this.getCategoryData(node.id ?? node.label),
        documents: node.id ? this.getDocumentData(node.id) : [],
      });
      this.treeData.data = this.commonDictionary.tree?.map(dfsmap);
    }
  }
  getCategoryData(id: string) {
    return this.ds_data?.categories.filter((c) => c.id === id)[0];
  }
  getDocumentData(category: string): DocBox[] {
    const cat = this.getCategoryData(category);
    if (!cat) {
      return [];
    }
    const median: number = cat.q2;
    return this.ds_data?.data.map((d) => ({
      label: d.title,
      id: d.id,
      median,
      start: Math.min(d[category] ?? 0, median),
      width: Math.abs((d[category] ?? 0) - median),
      value: d[category] ?? 0,
      instructor: d.ownedby === 'instructor',
    }));
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
      // console.log(`outliers for ${category.id}, ${lf}, ${uf}:`, outs);
      this.outliers.set(category.id, outs ?? []);
    }
    return this.outliers.get(category.id);
  }

  hasChild(_: number, node: BoxTreeNode): boolean {
    return !!node.children && node.children.length > 0;
  }
  hasDocuments(_: number, node: BoxTreeNode): boolean {
    return !!node.documents && node.documents.length > 0;
  }

  open(doc_id: string): void {
    window.open(doc_id);
  }
  ngOnInit() {
    this.scale_y = d3
      .scaleLinear()
      .domain([0, 1])
      .range([this.top, this.bottom]);
    this.getCommonDictionary();
  }
  ngAfterViewChecked() {
    if (this.sort) {
      this.boxplot_data.sort = this.sort;
    }
  }
}
