import { animateChild } from '@angular/animations';
import { SelectionModel } from '@angular/cdk/collections';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import * as d3 from 'd3';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { AssignmentService } from '../assignment.service';
import {
  CommonDictionary,
  CommonDictionaryTreeNode,
} from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';
import { Documents, DocumentService } from '../document.service';
import { PatternTreeNode } from '../pattern-tree-node';
import { PatternData } from '../patterns.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-text-view',
  templateUrl: './text-view.component.html',
  styleUrls: ['./text-view.component.css'],
})
export class TextViewComponent implements OnInit {
  tagged_text: Documents;
  treeControl = new NestedTreeControl<PatternTreeNode>((node) => node.children);
  treeData = new MatTreeNestedDataSource<PatternTreeNode>();
  dictionary: CommonDictionary;
  htmlContent: SafeHtml;
  max_clusters = 4;
  selection = new SelectionModel<PatternTreeNode>(true, []);
  colors = d3.scaleOrdinal(d3.schemeCategory10);

  private _css_classes: string[] = [
    'cluster_0',
    'cluster_1',
    'cluster_2',
    'cluster_3',
    'cluster_4',
    'cluster_5',
  ];
  private _css_classes_length = this._css_classes.length;

  get max_selected_clusters(): number {
    // maximum of the total number of original _css_classes or settings value.
    return Math.min(this.max_clusters, this._css_classes_length);
  }

  private _selected_clusters: Map<string, string> = new Map<string, string>();

  constructor(
    private _route: ActivatedRoute,
    private _assignmentService: AssignmentService,
    private _dictionary: CommonDictionaryService,
    private _sanitizer: DomSanitizer,
    private _settings_service: SettingsService,
    private _spinner: NgxUiLoaderService,
    private _text_service: DocumentService
  ) {}

  ngOnInit() {
    this._spinner.start();
    const id = this._route.snapshot.paramMap.get('doc');
    forkJoin([
      this._settings_service.getSettings(),
      this._dictionary.getJSON(),
      this._text_service.getData([id]),
    ]).subscribe(([settings, common, documents]) => {
      this.max_clusters = settings.stv.max_clusters;
      this.dictionary = common;
      this._assignmentService.setAssignmentData(documents);
      const doc = documents.documents[0];
      this.tagged_text = documents;
      // have to bypass some security otherwise the id's and data-key's get stripped. TODO: annotate html so it is safe.
      this.htmlContent = this._sanitizer.bypassSecurityTrustHtml(
        doc.html_content
      );
      const cpmap = new Map<string, PatternData[]>(
        doc.patterns.map((d) => [d.category, d.patterns])
      );
      const dfsmap = (node: CommonDictionaryTreeNode): PatternTreeNode =>
        new PatternTreeNode(
          node,
          node.children?.map(dfsmap),
          cpmap.get(node.id ?? node.label)
        );
      this.treeData.data = common.tree.map(dfsmap);
      this.treeControl.dataNodes = this.treeData.data; // needed to get expand all to work
      this._spinner.stop();
    });
  }
  hasChild(_: number, node: PatternTreeNode): boolean {
    return !!node.children && node.children.length > 0;
  }
  hasPatterns(_: number, node: PatternTreeNode): boolean {
    return !!node.patterns && node.patterns.length > 0;
  }
  descendantsAllSelected(node: PatternTreeNode): boolean {
    const descendants = this.treeControl.getDescendants(node).filter(c => c.count > 0);
    return descendants.length > 0 && descendants.every(
      child => this.selection.isSelected(child)
    );
  }
  descendantsPartiallySelected(node: PatternTreeNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    return descendants.some(child => this.selection.isSelected(child)) &&
      !this.descendantsAllSelected(node);
  }
  getParentNode(node: PatternTreeNode): PatternTreeNode | null {
    for (const root of this.treeControl.dataNodes) {
      if (root.children?.includes(node)) {
        return root;
      }
      const desc = this.treeControl.getDescendants(root).find(c => c.children?.includes(node));
      if (desc) {
        return desc;
      }
    }
    return null;
  }
  getAncestors(node: PatternTreeNode): PatternTreeNode[] {
    const ancstors: PatternTreeNode[] = [];
    let parent: PatternTreeNode | null = this.getParentNode(node);
    while (parent) {
      ancstors.push(parent);
      parent = this.getParentNode(parent);
    }
    return ancstors;
  }
  getCategories(node: PatternTreeNode): string[] {
    return ['pattern_label', node.id, ...this.getAncestors(node).map(a => a.id)];
  }
  checkRootNodeSelection(node: PatternTreeNode): void {
    const nodeSelected = this.selection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node).filter(c=>c.count>0);
    const descAllSel = descendants.length > 0 && descendants.every(c => this.selection.isSelected(c));
    if (nodeSelected && !descAllSel) {
      this.selection.deselect(node);
    } else if (!nodeSelected && descAllSel) {
      this.selection.select(node);
    }
  }
  checkAllParentsSelection(node: PatternTreeNode): void {
    let parent: PatternTreeNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /**
   * Handler for click event on the document text.
   * It reveals the categorization path annotation.
   *
   * @param $event a MouseEvent like clicking.
   */
  click_select($event: MouseEvent): void {
    let target: HTMLElement | null = $event.target as HTMLElement;
    while (target && !target.getAttribute('data-key')) {
      target = target.parentElement;
    }
    if (target && this.tagged_text) {
      const key = target?.getAttribute('data-key');
      if (key && key.trim()) {
        d3.selectAll('.selected_text').classed('selected_text', false);
        d3.selectAll('.cluster_id').classed('d_none', true);
        d3.select(target).classed('selected_text', true);
        d3.select(target).select('sup.cluster_id').classed('d_none', false);
      }
    }
  }

  selectionChange($event: MatCheckboxChange, node: PatternTreeNode) {
    if ($event && node) {
      this.selection.toggle(node);
      const descendants = this.treeControl.getDescendants(node).filter(c => c.count > 0);
      if (this.selection.isSelected(node)) {
        this.selection.select(...descendants);
      } else {
        this.selection.deselect(...descendants);
      }
      descendants.forEach(child => this.selection.isSelected(child));
      this.checkAllParentsSelection(node);
      this.highlightSelection();
    }
  }
  selectionLeafChange($event: MatCheckboxChange, node: PatternTreeNode) {
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
        d3.selectAll(`.${id}`).classed('cluster', true)
        .style('border-bottom-color', this.colors(id));
      } else {
        for (const sub of root.children) {
          const subId = sub.id || sub.label;
          if (this.selection.isSelected(sub)) {
            d3.selectAll(`.${subId}`).classed('cluster', true)
            .style('border-bottom-color', this.colors(subId));
          } else {
            for (const cat of sub.children) {
              const catId = cat.id || cat.label;
              if (this.selection.isSelected(cat)) {
                d3.selectAll(`.${catId}`).classed('cluster', true)
                .style('border-bottom-color', this.colors(catId));
              }
            }
          }
        }
      }
    }
  }
  selection_change($event: MatCheckboxChange, node: PatternTreeNode) {
    if ($event && node) {
      if (
        $event.checked &&
        this.selection.selected.length >= this.max_selected_clusters
      ) {
        $event.source.checked = false;
      } else {
        this.selection.toggle(node);
      }
      const id = node.id ?? node.label;
      const css_class = this.get_cluster_class(id);
      if (!$event.source.checked && this._selected_clusters.has(id)) {
        this._css_classes.unshift(this._selected_clusters.get(id));
        this._selected_clusters.delete(id);
      }
      d3.selectAll(`.${id}`).classed(css_class, $event.source.checked);
      d3.select(`#${$event.source.id} .pattern_label`).classed(
        css_class,
        $event.source.checked
      );
      const descendants = this.treeControl.getDescendants(node);
      //this.selection.isSelected(node)
    }
  }

  get_cluster_class(cluster: string): string {
    if (this._selected_clusters.has(cluster)) {
      return this._selected_clusters.get(cluster);
    } else if (this._css_classes.length) {
      this._selected_clusters.set(cluster, this._css_classes.shift());
      return this._selected_clusters.get(cluster);
    }
    return 'cluster_default';
  }
}
