import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
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
import { DictionaryInformation } from '../assignment-data';
import { AssignmentService } from '../assignment.service';
import { ClusterData } from '../cluster-data';
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
    this.patterns = patterns;
  }
  get counts(): number[] {
    const zero: number[] = this.patterns[0].counts.map(() => 0);
    if (this.patterns) {
      return this.patterns.reduce(
        (totals, current) => totals.map((t, i) => t + current[i]),
        zero
      );
    } else if (this.children) {
      return this.children.reduce(
        (tot, cur) => tot.map((t, i) => t + cur[i]),
        zero
      );
    }
    return zero;
  }
  get max_count(): number {
    return Math.max(...this.counts);
  }
}
class TextClusterData implements ClusterData {
  id: string;
  name: string;
  description?: string;
  patterns: ComparePatternData[];
  get count(): number {
    return this.patterns.reduce(
      (total: number, current: ComparePatternData): number =>
        total + current.count,
      0
    );
  }
  get counts(): number[] {
    if (this.patterns.length) {
      const zero: number[] = this.patterns[0].counts.map(() => 0);
      return this.patterns.reduce(
        (t: number[], p: ComparePatternData): number[] =>
          t.map((x: number, i: number): number => x + p.counts[i]),
        zero
      );
    }
    return [0];
  }
  get max_count(): number {
    return Math.max(...this.counts);
  }
  get count0(): number {
    return this.col_count(0);
  }
  get count1(): number {
    return this.col_count(1);
  }
  get pattern_count(): number {
    return this.patterns.length;
  }
  constructor(di: DictionaryInformation, patterns: Map<string, number[]>) {
    this.id = di.id;
    this.name = di.name;
    this.description = di.description;
    const pats: ComparePatternData[] = Array.from(patterns.entries()).map(
      (pc): ComparePatternData => new ComparePatternData(pc[0], pc[1])
    );
    pats.sort(pattern_compare);
    this.patterns = pats;
  }
  left(max: number): number {
    return (50 * this.count0) / max;
  }
  right(max: number): number {
    return (50 * this.count1) / max;
  }
  col_count(col: number): number {
    return this.patterns.reduce(
      (t: number, c: ComparePatternData): number => t + c.counts[col],
      0
    );
  }
}

@Component({
  selector: 'app-comparison',
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed, void => collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
      // Fix for mixing sort and expand: https://github.com/angular/components/issues/11990 and from angular component source code.
    ]),
    trigger('indicatorRotate', [
      state('collapsed, void', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition(
        'expanded <=> collapsed, void => collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class ComparisonComponent implements OnInit {
  //@ViewChild('TableSort', { static: true }) sort: MatSort;

  corpus: string[];
  dictionary: CommonDictionary;
  doc_colors = ['#1c66aa', '#639c54']; // ['royalblue', 'seagreen'];
  documents: Documents;
  direction: 'horizontal' | 'vertical' = 'horizontal';
  max_clusters = 4;
  max_count = 1;
  selection = new SelectionModel<CompareTreeNode>(true, []);
  treeControl = new NestedTreeControl<CompareTreeNode>((node) => node.children);
  treeData = new MatTreeNestedDataSource<CompareTreeNode>();
  unit = 100;

  //cluster_columns = ['name', 'bar', 'expand'];
  //cluster_info: Map<string, DictionaryInformation>;
  //clusters: MatTableDataSource<TextClusterData> = new MatTableDataSource<TextClusterData>();
  //expanded: TextClusterData | null = null;
  html_content: SafeHtml[];
  //patterns: Map<string, Map<string, number[]>>;

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
    return Math.min(this.max_clusters, this._css_classes_length);
  }
  private _selected_clusters: Map<string, string> = new Map<string, string>();

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
        this.max_clusters = settings.stv.max_clusters;
        this.direction = settings.mtv.horizontal ? 'horizontal' : 'vertical'; // split layout
        this.doc_colors = settings.mtv.documentColors;
        this.unit = settings.unit;
        // Dictionary
        this.dictionary = common;
        // Documents
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
        console.log(common.tree.map(dfsmap));
        this.treeData.data = common.tree.map(dfsmap);
        this.treeControl.dataNodes = this.treeData.data;
        this.max_count = Math.max(
          ...this.treeData.data.map((root) => root.max_count)
        );
        console.log(this.treeData.data);
        console.log(this.max_count);
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

  click_select($event: MouseEvent) {
    let target: HTMLElement | null = $event.target as HTMLElement;
    while (target && !target.getAttribute('data-key')) {
      target = target.parentElement;
    }
    if (target && this.documents) {
      const key = target?.getAttribute('data-key');
      if (key && key.trim()) {
        d3.selectAll('.selected_text').classed('selected_text', false);
        d3.selectAll('.cluster_id').classed('d_none', true);
        d3.select(target).classed('selected_text', true);
        d3.select(target).select('sup.cluster_id').classed('d_none', false);
      }
    }
  }
  /*getTaggedText() {
    this._spinner.start();
    return this._doc_service.getData(this.corpus)
      .subscribe(docs => {
        const cluster_ids = new Set<string>(this.cluster_info.keys());
        cluster_ids.delete('Other');

        const pats = new Map<string, Map<string, number[]>>();
        cluster_ids.forEach(c => pats.set(c, new Map<string, number[]>()));
        let i = 0;
        const zero: number[] = this.html_content.map((): number => 0);
        for (const doc of this.html_content) {
          const weight = this.unit / docs.documents[i].word_count;
          $(doc['changingThisBreaksApplicationSecurity']).find('[data-key]').each(function() {
            const cluster: string = $(this).attr('data-key');
            const example: string = $(this).text().replace(/(\n|\s)+/g, ' ').toLowerCase().trim();
            if (pats.has(cluster)) {
              if (!pats.get(cluster).has(example)) {
                pats.get(cluster).set(example, zero.slice());
              }
              const p_val: number[] = pats.get(cluster).get(example);
              p_val[i] = p_val[i] + weight;
            }
          });
          i++;
        }
        this.patterns = pats;
        const clusters: TextClusterData[] = Array.from(cluster_ids).map(
          (cid: string): TextClusterData =>
            new TextClusterData(this.cluster_info.get(cid), pats.get(cid)));
        clusters.sort(cluster_compare);
      }
      );
  }*/
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
  selection_change($event: MatCheckboxChange, node: CompareTreeNode) {
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
      d3.selectAll(`.{id}`).classed(css_class, $event.source.checked);
      d3.select(`#${$event.source.id} .pattern_label`).classed(
        css_class,
        $event.source.checked
      );
    }
  }
  /*show_expanded(cluster: TextClusterData | null) {
    if (this.expanded && cluster && cluster.id === this.expanded.id) {
      return 'expanded';
    }
    return 'collapsed';
  }
  expand_handler($event, cluster: TextClusterData | null) {
    this.expanded = this.expanded === cluster ? null : cluster;
    $event.stopPropagation();
  }*/
  get is_safari(): boolean {
    // return true;
    return (
      navigator.userAgent.indexOf('Safari') !== -1 &&
      navigator.userAgent.indexOf('Chrome') === -1
    );
  }
}
