import { SelectionModel } from '@angular/cdk/collections';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatLegacyCheckboxChange as MatCheckboxChange } from '@angular/material/legacy-checkbox';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import * as d3 from 'd3';
import { forkJoin } from 'rxjs';
import { AssignmentService } from '../assignment.service';
import {
  CommonDictionary,
  CommonDictionaryTreeNode,
} from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';
import { Documents, DocumentService } from '../document.service';
import { partition, PatternTreeNode } from '../pattern-tree-node';
import { PatternData } from '../patterns.service';
import { SunburstNode } from '../sunburst-chart/sunburst-chart.component';

@Component({
  selector: 'app-text-view',
  templateUrl: './text-view.component.html',
  styleUrls: ['./text-view.component.scss'],
})
export class TextViewComponent implements OnInit {
  colors = d3.scaleOrdinal(d3.schemeCategory10);
  dictionary: CommonDictionary | undefined;
  htmlContent: SafeHtml | undefined;
  tagged_text: Documents | undefined;
  treeControl = new NestedTreeControl<PatternTreeNode>((node) => node.children);
  treeData = new MatTreeNestedDataSource<PatternTreeNode>();
  max_clusters = d3.schemeCategory10.length;
  selection = new SelectionModel<PatternTreeNode>(true, []);
  sundata: SunburstNode | undefined;
  sunwidth = 300;

  constructor(
    private _route: ActivatedRoute,
    private _assignmentService: AssignmentService,
    private _dictionary: CommonDictionaryService,
    private _sanitizer: DomSanitizer,
    // private _settings_service: SettingsService,
    private snackbar: MatSnackBar,
    private _text_service: DocumentService
  ) {}

  ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('doc');
    if (!id) {
      this.snackbar.open('Error: No document specified!');
      return;
    }
    forkJoin([
      // this._settings_service.getSettings(),
      this._dictionary.getJSON(),
      this._text_service.getData([id]),
    ]).subscribe(([/*settings,*/ common, documents]) => {
      // this.max_clusters = settings.stv.max_clusters;
      this.dictionary = common;
      this._assignmentService.setAssignmentData(documents);
      const doc = documents.documents[0];
      this.tagged_text = documents;
      // have to bypass some security otherwise the id's and data-key's get stripped. TODO: annotate html so it is safe.
      this.htmlContent = this._sanitizer.bypassSecurityTrustHtml(
        doc.html_content
      );
      const cpmap = new Map<string, PatternData[]>(
        doc.patterns.map((d) => [d.category, d.patterns ?? []])
      );
      const dfsmap = (node: CommonDictionaryTreeNode): PatternTreeNode =>
        new PatternTreeNode(
          node,
          node.children?.map(dfsmap) ?? [],
          cpmap.get(node.id) ?? []
        );
      this.treeData.data = common.tree.map(dfsmap);
      this.treeControl.dataNodes = this.treeData.data; // needed to get expand all to work
      const sunmap = (node: CommonDictionaryTreeNode): SunburstNode => ({
        name: node.label,
        children: cpmap.get(node.id)
          ? cpmap.get(node.id).map((p) => ({
              name: p.pattern,
              value: p.count,
            }))
          : node.children?.map(sunmap),
      });
      this.sundata = { name: 'root', children: common.tree.map(sunmap) };
    });
  }
  hasChild(_: number, node: PatternTreeNode): boolean {
    return !!node.children && node.children.length > 0;
  }
  hasPatterns(_: number, node: PatternTreeNode): boolean {
    return !!node.patterns && node.patterns.length > 0;
  }
  descendantsAllSelected(node: PatternTreeNode): boolean {
    const descendants = this.treeControl
      .getDescendants(node)
      .filter((c) => c.count > 0);
    return (
      descendants.length > 0 &&
      descendants.every((child) => this.selection.isSelected(child))
    );
  }
  descendantsPartiallySelected(node: PatternTreeNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    return (
      descendants.some((child) => this.selection.isSelected(child)) &&
      !this.descendantsAllSelected(node)
    );
  }
  getParentNode(node: PatternTreeNode): PatternTreeNode | null {
    if (this.treeControl.dataNodes) {
      for (const root of this.treeControl.dataNodes) {
        if (root.children.includes(node)) {
          return root;
        }
        const desc = this.treeControl
          .getDescendants(root)
          .find((c) => c.children.includes(node));
        if (desc) {
          return desc;
        }
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
    return [
      'pattern_label',
      node.id,
      ...this.getAncestors(node).map((a) => a.id),
    ];
  }
  checkRootNodeSelection(node: PatternTreeNode): void {
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
  checkAllParentsSelection(node: PatternTreeNode): void {
    let parent: PatternTreeNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /**
   * Handler for click event on the document text.
   * It reveals or hides the categorization path annotation.
   *
   * @param $event a MouseEvent like clicking.
   */
  click_select($event: MouseEvent): void {
    let target: HTMLElement | null = $event.target as HTMLElement;
    while (target && !target.getAttribute('data-key')) {
      target = target.parentElement;
    }
    const key = target?.getAttribute('data-key');
    if (target && this.tagged_text && key && key.trim()) {
      const isSelected = d3.select(target).classed('selected_text');
      d3.selectAll('.selected_text').classed('selected_text', false);
      d3.selectAll('.cluster_id').classed('d_none', true);
      if (!isSelected) {
        d3.select(target).classed('selected_text', true);
        d3.select(target).select('sup.cluster_id').classed('d_none', false);
      }
    }
  }

  selectionChange($event: MatCheckboxChange, node: PatternTreeNode): void {
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
  selectionLeafChange($event: MatCheckboxChange, node: PatternTreeNode): void {
    if ($event && node) {
      this.selection.toggle(node);
      this.checkAllParentsSelection(node);
      this.highlightSelection();
    }
  }
  highlightById(id: string): void {
    d3.selectAll(`.${id}`)
      .classed('cluster', true)
      .style('border-bottom-color', this.colors(id));
  }
  /**
   * Updates to color underlining of selected categories.
   */
  highlightSelection(): void {
    this.colors.range(d3.schemeCategory10);
    d3.selectAll('.cluster').classed('cluster', false);
    // Walk tree for highest levels of selected nodes in each branch
    // Relies on the parent and decendant checks to maintain the
    // proper state of all the nodes.
    const [selectedRoot, unselectedRoot] = partition(
      this.treeControl.dataNodes,
      (root) => this.selection.isSelected(root)
    );
    selectedRoot.forEach((root) => this.highlightById(root.id));
    const subs = unselectedRoot.reduce<PatternTreeNode[]>(
      (acc, cur) => [...acc, ...cur.children],
      []
    );
    const [selectedSubs, unselectedSubs] = partition(subs, (sub) =>
      this.selection.isSelected(sub)
    );
    selectedSubs.forEach((sub) => this.highlightById(sub.id));
    const cats = unselectedSubs.reduce<PatternTreeNode[]>(
      (acc, cur) => [...acc, ...cur.children],
      []
    );
    cats
      .filter((cat) => this.selection.isSelected(cat))
      .forEach((cat) => this.highlightById(cat.id));
  }
}
