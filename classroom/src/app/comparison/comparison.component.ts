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

class CompareTreeNode {
  id?: string;
  label: string;
  help: string;
  children?: CompareTreeNode[];
  patterns?: ComparePatternData[];
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
  get count(): number {
    return this.counts.reduce((p, c) => p + c, 0);
  }
  get counts(): number[] {
    const zero: number[] = [0, 0]; //this.patterns[0].counts.map(() => 0);
    if (this.patterns?.length) {
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
  get max_count(): number {
    return Math.max(...this.counts);
  }
  left(max: number): number {
    return (50 * this.counts[0]) / max;
  }
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
  corpus: string[];
  dictionary: CommonDictionary;
  colors = d3.scaleOrdinal(d3.schemeCategory10);
  dColors = ['#1c66aa', '#639c54'];
  doc_colors = d3.scaleOrdinal(this.dColors); // ['royalblue', 'seagreen'];
  documents: Documents;
  direction: 'horizontal' | 'vertical' = 'horizontal';
  max_clusters = d3.schemeCategory10.length;
  max_count = 1;
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

  ngOnInit() {
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
        this._router.navigate(['/stv', corpus[0]]);
        return;
      } else if (corpus.length > 2) {
        // WARNING: too many documents
        this.reportError(
          'More than two documents specified, only showing the first two.'
        );
        this.corpus = corpus.slice(0, 2);
      }
      forkJoin([
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
        // have to bypass some security otherwise the id's and data-key's get stripped. TODO: annotate html so it is safe.
        this.html_content = documents.documents.map((doc) =>
          this._sanitizer.bypassSecurityTrustHtml(doc.html_content)
        );

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
            Array.from(cpmap.get(node.id ?? node.label)?.entries() ?? []).map(
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

  hasChild(_: number, node: CompareTreeNode): boolean {
    return !!node.children && node.children.length > 0;
  }
  hasPatterns(_: number, node: CompareTreeNode): boolean {
    return !!node.patterns && node.patterns.length > 0;
  }

  descendantsAllSelected(node: CompareTreeNode): boolean {
    const descendants = this.treeControl
      .getDescendants(node)
      .filter((c) => c.count > 0);
    return (
      descendants.length > 0 &&
      descendants.every((child) => this.selection.isSelected(child))
    );
  }
  descendantsPartiallySelected(node: CompareTreeNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    return (
      descendants.some((child) => this.selection.isSelected(child)) &&
      !this.descendantsAllSelected(node)
    );
  }
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
  getAncestors(node: CompareTreeNode): CompareTreeNode[] {
    const ancstors: CompareTreeNode[] = [];
    let parent: CompareTreeNode | null = this.getParentNode(node);
    while (parent) {
      ancstors.push(parent);
      parent = this.getParentNode(parent);
    }
    return ancstors;
  }
  getCategories(node: CompareTreeNode): string[] {
    return [
      'pattern_label',
      node.id,
      ...this.getAncestors(node).map((a) => a.id),
    ];
  }
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
  checkAllParentsSelection(node: CompareTreeNode): void {
    let parent: CompareTreeNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  click_select($event: MouseEvent) {
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
  reportError(message: string): void {
    this._snackBar.open(message, '\u2612');
  }
  get is_safari(): boolean {
    // return true;
    return (
      navigator.userAgent.indexOf('Safari') !== -1 &&
      navigator.userAgent.indexOf('Chrome') === -1
    );
  }
  selectionChange($event: MatCheckboxChange, node: CompareTreeNode) {
    if ($event && node) {
      this.selection.toggle(node);
      const descendants = this.treeControl
        .getDescendants(node)
        .filter((c) => c.count > 0);
      if (this.selection.isSelected(node)) {
        this.selection.select(...descendants);
      } else {
        this.selection.deselect(...descendants);
      }
      descendants.forEach((child) => this.selection.isSelected(child));
      this.checkAllParentsSelection(node);
      this.highlightSelection();
    }
  }
  selectionLeafChange($event: MatCheckboxChange, node: CompareTreeNode) {
    if ($event && node) {
      this.selection.toggle(node);
      this.checkAllParentsSelection(node);
      this.highlightSelection();
    }
  }
  highlightSelection() {
    this.colors.range(d3.schemeCategory10);
    d3.selectAll('.cluster').classed('cluster', false);
    for (const root of this.treeControl.dataNodes) {
      const id = root.id || root.label;
      if (this.selection.isSelected(root)) {
        d3.selectAll(`.${id}`)
          .classed('cluster', true)
          .style('border-bottom-color', this.colors(id));
      } else {
        for (const sub of root.children) {
          const subId = sub.id || sub.label;
          if (this.selection.isSelected(sub)) {
            d3.selectAll(`.${subId}`)
              .classed('cluster', true)
              .style('border-bottom-color', this.colors(subId));
          } else {
            for (const cat of sub.children) {
              const catId = cat.id || cat.label;
              if (this.selection.isSelected(cat)) {
                d3.selectAll(`.${catId}`)
                  .classed('cluster', true)
                  .style('border-bottom-color', this.colors(catId));
              }
            }
          }
        }
      }
    }
  }
}
