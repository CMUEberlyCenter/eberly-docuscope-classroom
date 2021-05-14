/* Component for comparing two documents

This component displays two documents to be compared 'side-by-side'.
It is based on the single document text-view component.
*/
import { SelectionModel } from '@angular/cdk/collections';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
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
import { Documents, DocumentService } from '../document.service';
import { ComparePatternData, pattern_compare } from '../patterns.service';
import { Settings, SettingsService } from '../settings.service';

/**
 * Nodes in the dictionary tree.
 */
class CompareTreeNode {
  id: string; // category id
  label: string; // human readable id
  help: string; // notes about category
  children?: CompareTreeNode[]; // child tree nodes
  patterns?: ComparePatternData[]; // patterns for this category

  constructor(
    node: CommonDictionaryTreeNode,
    children: CompareTreeNode[],
    patterns: ComparePatternData[]
  ) {
    this.id = node.id;
    this.label = node.label;
    this.help = node.help;
    this.children = children;
    patterns.sort(pattern_compare);
    this.patterns = patterns;
  }
  /** Total count over all instances in category. */
  get count(): number {
    return this.counts.reduce((p, c) => p + c, 0);
  }
  /** Total counts of instances in category for each document. */
  get counts(): number[] {
    const zero: number[] = [0, 0];
    if (this.patterns?.length) { // if leaf node
      return this.patterns.reduce(
        (totals, current) => totals.map((t, i) => t + current.counts[i]),
        zero
      );
    } else if (this.children?.length) {
      return this.children.reduce(
        (tot, cur) => tot.map((t, i) => t + cur.counts[i]),
        zero
      );
    }
    return zero;
  }
  /** Max count value over all patterns in this category. */
  get max_count(): number {
    return Math.max(...this.counts);
  }
  /**
   * Scales first document count for area comparison.
   * @param max The maximum count.
   */
  left(max: number): number {
    return (50 * this.counts[0]) / max;
  }
  /**
   * Scales second document count for area comparison.
   * @param max The maximum count.
   */
  right(max: number): number {
    return (50 * this.counts[1]) / max;
  }
}

@Component({
  selector: 'app-comparison',
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css'],
})
export class ComparisonComponent implements OnInit {
  corpus: string[]; // list of document UUID's
  dictionary: CommonDictionary;
  colors = d3.scaleOrdinal(d3.schemeCategory10); // Colors to use for underlining
  dColors = ['#1c66aa', '#639c54']; // document colors
  doc_colors = d3.scaleOrdinal(this.dColors); // ['royalblue', 'seagreen'];
  documents: Documents; // retrieved document data
  direction: 'horizontal' | 'vertical' = 'horizontal'; // document stacking
  max_clusters = d3.schemeCategory10.length; // max clusters based on number of colors.
  max_count = 1; // maximum instance count over all patterns and documents.
  selection = new SelectionModel<CompareTreeNode>(true, []);
  treeControl = new NestedTreeControl<CompareTreeNode>((node) => node.children);
  treeData = new MatTreeNestedDataSource<CompareTreeNode>();

  html_content: SafeHtml[];

  constructor(
    private _assignmentService: AssignmentService,
    private _corpusService: CorpusService,
    private _dictionary: CommonDictionaryService,
    private _router: Router,
    private _sanitizer: DomSanitizer,
    private _settings_service: SettingsService,
    private _snackBar: MatSnackBar,
    private _spinner: NgxUiLoaderService,
    private _doc_service: DocumentService
  ) {}

  ngOnInit(): void {
    this._spinner.start();
    this._corpusService.getCorpus().subscribe((corpus) => {
      this.corpus = corpus;
      if (corpus.length === 0) {
        // ERROR: no documents
        this.reportError('No documents specified!');
        return;
      } else if (corpus.length === 1) {
        // WARNING: not enough documents
        this.reportError(
          'Only one document specified, need two for comparison.'
        );
        this._spinner.stop();
        void this._router.navigate(['/stv', corpus[0]]); // redirect to single text-view
        return;
      } else if (corpus.length > 2) {
        // WARNING: too many documents
        this.reportError(
          'More than two documents specified, only showing the first two.'
        );
        this.corpus = corpus.slice(0, 2);
      }
      forkJoin([ // parallel retrieval
        this._settings_service.getSettings(),
        this._dictionary.getJSON(),
        this._doc_service.getData(this.corpus),
      ]).subscribe((results: [Settings, CommonDictionary, Documents]): void => {
        const [settings, common, documents] = results;
        // Settings
        //this.max_clusters = settings.stv.max_clusters;
        this.direction = settings.mtv.horizontal ? 'horizontal' : 'vertical'; // split layout
        this.doc_colors = d3.scaleOrdinal(settings.mtv.documentColors);
        // Dictionary
        this.dictionary = common;
        // Documents
        this.documents = documents;
        this._assignmentService.setAssignmentData(documents);
        // have to bypass some security otherwise the id's and data-key's get stripped.
        // TODO: annotate html so it is safe.
        this.html_content = documents.documents.map((doc) =>
          this._sanitizer.bypassSecurityTrustHtml(doc.html_content)
        );

        // transform data to tree nodes.
        // zero vector for initializing counts.
        const zero: number[] = documents.documents.map(() => 0);
        const cpmap = new Map<string, Map<string, number[]>>();
        documents.documents.forEach((doc, i) => {
          doc.patterns.forEach((cluster) => {
            if (!cpmap.has(cluster.category)) {
              cpmap.set(cluster.category, new Map<string, number[]>());
            }
            cluster.patterns.forEach((pat) => {
              const counts =
                cpmap.get(cluster.category).get(pat.pattern) ?? zero.slice();
              counts[i] += pat.count; // simple assignment works on unique assumption
              cpmap.get(cluster.category).set(pat.pattern, counts);
            });
          });
        });
        const dfsmap = (node: CommonDictionaryTreeNode): CompareTreeNode =>
          new CompareTreeNode(
            node,
            node.children?.map(dfsmap),
            Array.from(cpmap.get(node.id)?.entries() ?? []).map(
              ([pat, counts]) => new ComparePatternData(pat, counts)
            )
          );
        this.treeData.data = common.tree.map(dfsmap);
        this.treeControl.dataNodes = this.treeData.data;
        this.max_count = Math.max(
          ...this.treeData.data.map((root) => root.max_count)
        );
        this._spinner.stop();
      });
    });
  }

  /**
   * Does the given node have any children.
   * @param _ index of node, ignored.
   * @param node instance of tree node.
   */
  hasChild(_: number, node: CompareTreeNode): boolean {
    return !!node.children && node.children.length > 0;
  }
  /**
   * Does the given node have any patterns.
   * @param _ index of node, ignored.
   * @param node instance of tree node.
   */
  hasPatterns(_: number, node: CompareTreeNode): boolean {
    return !!node.patterns && node.patterns.length > 0;
  }

  /**
   * Are all of the descendants of the node selected.
   * @param node a given tree node.
   */
  descendantsAllSelected(node: CompareTreeNode): boolean {
    const descendants = this.treeControl
      .getDescendants(node)
      .filter((c) => c.count > 0);
    return (
      descendants.length > 0 &&
      descendants.every((child) => this.selection.isSelected(child))
    );
  }
  /**
   * Are some of the decendants of the node selected.
   * @param node a given tree node.
   */
   descendantsPartiallySelected(node: CompareTreeNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    return (
      descendants.some((child) => this.selection.isSelected(child)) &&
      !this.descendantsAllSelected(node)
    );
  }
  /**
   * Retrieve the parent of the given node.
   * @param node a given tree node.
   */
  getParentNode(node: CompareTreeNode): CompareTreeNode | null {
    if (this.treeControl?.dataNodes && this.treeData) {
      for (const root of this.treeControl.dataNodes) {
        if (root.children?.includes(node)) {
          return root;
        }
        const desc = this.treeControl
          .getDescendants(root)
          .find((c) => c.children?.includes(node));
        if (desc) {
          return desc;
        }
      }
    }
    return null;
  }
  /**
   * Get the ancestors of the node up to the root.
   * @param node a given tree node.
   */
  getAncestors(node: CompareTreeNode): CompareTreeNode[] {
    const ancstors: CompareTreeNode[] = [];
    let parent: CompareTreeNode | null = this.getParentNode(node);
    while (parent) {
      ancstors.push(parent);
      parent = this.getParentNode(parent);
    }
    return ancstors;
  }
  /**
   * Get all of the classes to add to a tree node element.
   * @param node a given tree node.
   */
  getCategories(node: CompareTreeNode): string[] {
    return [
      'pattern_label',
      node.id,
      ...this.getAncestors(node).map((a) => a.id),
    ];
  }
  /**
   * Fix tree node selection based on the selection state
   * of all descendants.
   * @param node a given tree node.
   */
  checkRootNodeSelection(node: CompareTreeNode): void {
    const nodeSelected = this.selection.isSelected(node);
    const descendants = this.treeControl
      .getDescendants(node)
      .filter((c) => c.count > 0);
    const descAllSel =
      descendants.length > 0 &&
      descendants.every((c) => this.selection.isSelected(c));
    if (nodeSelected && !descAllSel) {
      this.selection.deselect(node);
    } else if (!nodeSelected && descAllSel) {
      this.selection.select(node);
    }
  }
  /**
   * Fix tree node selection based on the selection state of
   * the parent node.
   * @param node a given tree node.
   */
  checkAllParentsSelection(node: CompareTreeNode): void {
    let parent: CompareTreeNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /**
   * Event handler for handling click events in the text window
   * that reveals or hides the category annotations.
   * @param $event event triggered by clicking on text.
   */
  click_select($event: MouseEvent): void {
    let target: HTMLElement | null = $event.target as HTMLElement;
    while (target && !target.getAttribute('data-key')) {
      target = target.parentElement;
    }
    if (target && this.documents) {
      const key = target?.getAttribute('data-key');
      if (key && key.trim()) {
        const isSelected = d3.select(target).classed('selected_text');
        d3.selectAll('.selected_text').classed('selected_text', false);
        d3.selectAll('.cluster_id').classed('d_none', true);
        if (!isSelected) {
          d3.select(target).classed('selected_text', true);
          d3.select(target).select('sup.cluster_id').classed('d_none', false);
        }
      }
    }
  }
  /** Report error to user. */
  reportError(message: string): void {
    this._snackBar.open(message, '\u2612');
  }
  /** Check if user is using Safari */
  get is_safari(): boolean {
    // return true;
    return (
      navigator.userAgent.indexOf('Safari') !== -1 &&
      navigator.userAgent.indexOf('Chrome') === -1
    );
  }
  /**
   * Updates selection state of tree nodes given the change in selection
   * checkbox associated with a tree node.
   * @param $event Event from clicking on category checkbox.
   * @param node The tree node associated with the checkbox.
   */
  selectionChange($event: MatCheckboxChange, node: CompareTreeNode): void {
    if ($event && node) {
      this.selection.toggle(node);
      const descendants = this.treeControl
        .getDescendants(node)
        .filter((c) => c.count > 0);
      if (this.selection.isSelected(node)) {
        // select all descendants
        this.selection.select(...descendants);
      } else {
        // deselect all descendants
        this.selection.deselect(...descendants);
      }
      descendants.forEach((child) => this.selection.isSelected(child));
      this.checkAllParentsSelection(node); // update parents
      this.highlightSelection(); // update color underlining
    }
  }
  /**
   * Event handler for checkbox clicks on leaf nodes.
   * @param $event Event from clicking on checkbox's at the leaf nodes.
   * @param node The clicked tree leaf node.
   */
  selectionLeafChange($event: MatCheckboxChange, node: CompareTreeNode): void {
    if ($event && node) {
      this.selection.toggle(node);
      this.checkAllParentsSelection(node); // update parents
      this.highlightSelection(); // update color underlining
    }
  }
  /**
   * Updates to color underlining of selected categories.
   */
  highlightSelection(): void {
    this.colors.range(d3.schemeCategory10); // reset colors
    d3.selectAll('.cluster').classed('cluster', false);
    // Walk tree for highest levels of selected nodes in each branch
    // Relies on the parent and decendant checks to maintain the
    // proper state of all the nodes.
    for (const root of this.treeControl.dataNodes) {
      if (this.selection.isSelected(root)) {
        d3.selectAll(`.${root.id}`)
          .classed('cluster', true)
          .style('border-bottom-color', this.colors(root.id));
      } else {
        for (const sub of root.children) {
          if (this.selection.isSelected(sub)) {
            d3.selectAll(`.${sub.id}`)
              .classed('cluster', true)
              .style('border-bottom-color', this.colors(sub.id));
          } else {
            for (const cat of sub.children) {
              if (this.selection.isSelected(cat)) {
                d3.selectAll(`.${cat.id}`)
                  .classed('cluster', true)
                  .style('border-bottom-color', this.colors(cat.id));
              }
            }
          }
        }
      }
    }
  }
}
