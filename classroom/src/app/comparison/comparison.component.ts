import { Component, OnInit, ViewChild } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SelectionModel } from '@angular/cdk/collections';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import * as d3 from 'd3';
import * as $ from 'jquery';

import { AssignmentService } from '../assignment.service';
import { DictionaryInformation } from '../assignment-data';
import { ClusterData, cluster_compare } from '../cluster-data';
import { CorpusService } from '../corpus.service';
import { Documents, DocumentService } from '../document.service';
import { ComparePatternData, pattern_compare } from '../patterns.service';
import { SettingsService } from '../settings.service';

class TextClusterData implements ClusterData {
  id: string;
  name: string;
  description?: string;
  patterns: ComparePatternData[];
  get count(): number {
    return this.patterns.reduce(
      (total: number, current: ComparePatternData): number => total + current.count, 0);
  }
  get counts(): number[] {
    if (this.patterns.length) {
      const zero: number[] = this.patterns[0].counts.map(() => 0);
      return this.patterns.reduce(
        (t: number[], p: ComparePatternData): number[] => t.map(
          (x: number, i: number): number => x + p.counts[i]), zero);
    }
    return [0];
  }
  get max_count(): number { return Math.max(...this.counts); }
  left(max: number): number { return 50 * this.count0 / max; }
  right(max: number): number { return 50 * this.count1 / max; }
  col_count(col: number): number {
    return this.patterns.reduce((t: number, c: ComparePatternData): number => t + c.counts[col], 0);
  }
  get count0(): number { return this.col_count(0); }
  get count1(): number { return this.col_count(1); }
  get pattern_count(): number { return this.patterns.length; }
  constructor(di: DictionaryInformation, patterns: Map<string, number[]>) {
    this.id = di.id;
    this.name = di.name;
    this.description = di.description;
    const pats: ComparePatternData[] = Array.from(patterns.entries()).map(
      (pc): ComparePatternData => new ComparePatternData(pc[0], pc[1]));
    pats.sort(pattern_compare);
    this.patterns = pats;
  }
}

@Component({
  selector: 'app-comparison',
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed, void => collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      // Fix for mixing sort and expand: https://github.com/angular/components/issues/11990 and from angular component source code.
    ]),
    trigger('indicatorRotate', [
      state('collapsed, void', style({transform: 'rotate(0deg)'})),
      state('expanded', style({transform: 'rotate(180deg)'})),
      transition('expanded <=> collapsed, void => collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
  ]
})
export class ComparisonComponent implements OnInit {
  @ViewChild('TableSort', {static: true}) sort: MatSort;

  cluster_columns = ['name', 'bar', 'expand'];
  cluster_info: Map<string, DictionaryInformation>;
  clusters: MatTableDataSource<TextClusterData> = new MatTableDataSource<TextClusterData>();
  corpus: string[];
  doc_colors = ['#1c66aa', '#639c54']; // ['royalblue', 'seagreen'];
  documents: Documents;
  direction = 'horizontal';
  expanded: TextClusterData | null = null;
  html_content: SafeHtml[];
  max_clusters = 4;
  max_count = 1;
  patterns: Map<string, Map<string, number[]>>;
  selection = new SelectionModel<TextClusterData>(true, []);

  private _css_classes: string[] = [
    'cluster_0',
    'cluster_1',
    'cluster_2',
    'cluster_3',
    'cluster_4',
    'cluster_5'];
  private _css_classes_length = this._css_classes.length;
  get max_selected_clusters(): number {
    return Math.min(this.max_clusters, this._css_classes_length);
  }
  private _selected_clusters: Map<string, string> = new Map<string, string>();

  constructor(
    private _assignmentService: AssignmentService,
    private _corpusService: CorpusService,
    private _router: Router,
    private _sanitizer: DomSanitizer,
    private _settings_service: SettingsService,
    private _snackBar: MatSnackBar,
    private _spinner: NgxUiLoaderService,
    private _doc_service: DocumentService
  ) {}

  getCorpus(): void {
    this._spinner.start();
    this._corpusService.getCorpus().subscribe(corpus => {
      this.corpus = corpus;
      if (corpus.length === 0) {
        // ERROR: no documents
        this.reportError('No documents specified!');
        return;
      } else if (corpus.length === 1) {
        // WARNING: not enough documents
        this.reportError('Only one document specified, need two for comparison.');
        this._spinner.stop();
        this._router.navigate(['/stv', corpus[0]]);
        return;
      } else if (corpus.length > 2) {
        // WARNING: too many documents
        this.reportError('More than two documents specified, only showing the first two.');
        this.corpus = corpus.slice(0, 2);
      }
      this.getTaggedText();
    });
  }

  click_select($event) {
    if ($('.cluster_id').length === 0) {
      const l2c = (c: string): string => this.cluster_info.get(c).name;
      $('[data-key]').each(function() {
        const lat: string = $(this).attr('data-key');
        const cluster_name: string = l2c(lat);
        $(this).append(`<sup class="cluster_id">{${cluster_name}}</sup>`);
      });
    }
    const parent_key = $event.target.parentNode.getAttribute('data-key');
    if (parent_key && this.documents) {
      const lat = parent_key.trim();
      if (this.cluster_info.has(lat)) {
        d3.selectAll('.selected_text').classed('selected_text', false);
        d3.selectAll('.cluster_id').style('display', 'none');
        d3.select($event.target.parentNode).classed('selected_text', true);
        d3.select($event.target.parentNode).select('.cluster_id').style('display', 'inline');
      }
    }
  }
  getSettings(): void {
    this._settings_service.getSettings().subscribe(settings => {
      this.max_clusters = settings.stv.max_clusters;
      this.direction = settings.mtv.horizontal ? 'horizontal' : 'vertical';
      this.doc_colors = settings.mtv.documentColors;
    });
  }
  getTaggedText() {
    this._spinner.start();
    return this._doc_service.getData(this.corpus)
      .subscribe(docs => {
        this.documents = docs;
        this._assignmentService.setAssignmentData(docs);
        this.html_content = docs.documents.map(
          doc => this._sanitizer.bypassSecurityTrustHtml(doc.html_content));
        this.cluster_info = new Map<string, DictionaryInformation>();
        if (docs && docs.categories) {
          for (const cluster of docs.categories) {
            this.cluster_info.set(cluster.id, cluster);
          }
        }
        const cluster_ids = new Set<string>(this.cluster_info.keys());
        cluster_ids.delete('Other');

        const pats = new Map<string, Map<string, number[]>>();
        cluster_ids.forEach(c => pats.set(c, new Map<string, number[]>()));
        let i = 0;
        const zero: number[] = this.html_content.map((): number => 0);
        for (const doc of this.html_content) {
          $(doc['changingThisBreaksApplicationSecurity']).find('[data-key]').each(function() {
            const cluster: string = $(this).attr('data-key');
            const example: string = $(this).text().replace(/(\n|\s)+/g, ' ').toLowerCase().trim();
            if (pats.has(cluster)) {
              if (!pats.get(cluster).has(example)) {
                pats.get(cluster).set(example, zero.slice());
              }
              const p_val: number[] = pats.get(cluster).get(example);
              p_val[i] = p_val[i] + 1;
            }
          });
          i++;
        }
        this.patterns = pats;
        const clusters: TextClusterData[] = Array.from(cluster_ids).map(
          (cid: string): TextClusterData =>
            new TextClusterData(this.cluster_info.get(cid), pats.get(cid)));
        clusters.sort(cluster_compare);
        this.max_count = Math.max(...clusters.map(c => c.max_count));
        this.clusters.data = clusters;
        this._spinner.stop();
      }
    );
  }
  ngOnInit(): void {
    this.getSettings();
    this.getCorpus();
    this.clusters.sort = this.sort;
  }
  reportError(message: string): void {
    this._snackBar.open(message, '\u2612');
  }
  get_cluster_class(cluster: string): string {
    if (this._selected_clusters.has(cluster)) {
      return this._selected_clusters.get(cluster);
    }
    if (this._css_classes.length) {
      this._selected_clusters.set(cluster, this._css_classes.shift());
      return this._selected_clusters.get(cluster);
    }
    return 'cluster_default';
  }
  selection_change($event, cluster) {
    if ($event && cluster) {
      if ($event.checked && this.selection.selected.length >= this.max_selected_clusters) {
        $event.source.checked = false;
      } else {
        this.selection.toggle(cluster);
      }
    }
    const css_class = this.get_cluster_class(cluster.id);
    if (!$event.source.checked && this._selected_clusters.has(cluster.id)) {
      this._css_classes.unshift(this._selected_clusters.get(cluster.id));
      this._selected_clusters.delete(cluster.id);
    }
    d3.selectAll(`[data-key=${cluster.id}]`).classed(css_class, $event.source.checked);
  }
  show_expanded(cluster: TextClusterData|null) {
    if (this.expanded && cluster && cluster.id === this.expanded.id) {
      return 'expanded';
    }
    return 'collapsed';
  }
  expand_handler($event, cluster: TextClusterData|null) {
    this.expanded = this.expanded === cluster ? null : cluster;
    $event.stopPropagation();
  }
}
