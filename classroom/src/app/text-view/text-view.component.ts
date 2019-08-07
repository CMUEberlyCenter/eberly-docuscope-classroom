import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import * as d3 from 'd3';
import * as $ from 'jquery';

import { ClusterData, cluster_compare, instance_count } from '../cluster-data';
import { PatternData, pattern_compare } from '../patterns.service';
import { TaggedTextService, TextContent, TextContentDictionaryInformation } from '../tagged-text.service';

class TextClusterData implements ClusterData {
  id: string;
  name: string;
  description?: string;
  patterns: PatternData[];
  get count(): number { return instance_count(this.patterns); }
  get pattern_count(): number { return this.patterns.length; }
  // expand: boolean = false; // to be used for multiple expansion.

  constructor(di: TextContentDictionaryInformation, patterns: Map<string, number>) {
    this.id = di.id;
    this.name = di.name;
    this.description = di.description;
    const pats: PatternData[] = Array.from(patterns.entries()).map(
      (pc): PatternData => ({pattern: pc[0], count: pc[1]} as PatternData));
    pats.sort(pattern_compare);
    this.patterns = pats;
  }
}

@Component({
  selector: 'app-text-view',
  templateUrl: './text-view.component.html',
  styleUrls: ['./text-view.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed',
                 animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void',
                 animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
      // Fix for mixing sort and expand: https://github.com/angular/components/issues/11990
    ]),
  ],
})
export class TextViewComponent implements OnInit {
  tagged_text: TextContent;
  cluster_columns = ['name', 'details', 'count', 'expand'];
  clusters: MatTableDataSource<TextClusterData>;
  expanded: TextClusterData | null = null;
  patterns: Map<string, Map<string, number>>;
  html_content: SafeHtml;

  @ViewChild('TableSort', {static: true}) sort: MatSort;

  _cluster_info: Map<string, TextContentDictionaryInformation>;

  private _css_classes: string[] = [
    'cluster_0',
    'cluster_1',
    'cluster_2',
    'cluster_3',
    'cluster_4',
    'cluster_5'];

  get max_selected_clusters(): number {
    return 4; // maximum of the total number of _css_classes.
  }

  private _selected_clusters: Map<string, string> = new Map<string, string>();

  constructor(
    private _route: ActivatedRoute,
    private _sanitizer: DomSanitizer,
    private _spinner: NgxUiLoaderService,
    private _text_service: TaggedTextService
  ) { }

  show_expanded(clust: TextClusterData|null) {
    if (this.expanded && clust && clust.id === this.expanded.id) {
      return 'expanded';
    }
    return 'collapsed';
  }
  expand_handler($event, cluster) {
    this.expanded = this.expanded === cluster ? null : cluster;
    $event.stopPropagation();
  }

  getTaggedText() {
    this._spinner.start();
    const id = this._route.snapshot.paramMap.get('doc');
    return this._text_service.getTaggedText(id)
      .subscribe(txt => {
        this.tagged_text = txt;
        // have to bypass some security otherwise the id's and data-key's get stripped. TODO: annotate html so it is safe.
        this.html_content = this._sanitizer.bypassSecurityTrustHtml(txt.html_content);
        // console.log(txt.html_content);
        // console.log(this.html_content);
        // console.log($(txt.html_content));
        this._cluster_info = new Map<string, TextContentDictionaryInformation>();
        if (this.tagged_text && this.tagged_text.dict_info && this.tagged_text.dict_info.cluster) {
          for (const clust of this.tagged_text.dict_info.cluster) {
            this._cluster_info.set(clust.id, clust);
          }
        }
        const cluster_ids = new Set<string>();
        for (const d of Object.keys(txt.dictionary)) {
          const cluster = txt.dictionary[d]['cluster'];
          cluster_ids.add(cluster);
        }
        cluster_ids.delete('Other');

        const pats = new Map<string, Map<string, number>>();
        cluster_ids.forEach((cl) => pats.set(cl, new Map<string, number>()));

        // const $html = $(txt.html_content);
        /*$html.find('[data-key]').each(function() {
          const lat = $(this).attr('data-key');
          const cluster = txt.dict[lat]['cluster'];
        });*/
        const tv = this;
        $(this.html_content['changingThisBreaksApplicationSecurity']).find('[data-key]').each(function() {
          const lat: string = $(this).attr('data-key');
          const cluster: string = txt.dictionary[lat]['cluster'];
          const cluster_name: string = tv.get_cluster_name(cluster);
          const example: string = $(this).text().replace(/(\n|\s)+/g, ' ').toLowerCase().trim();

          if (pats.has(cluster)) {
            if (pats.get(cluster).has(example)) {
              const p_val: number = pats.get(cluster).get(example);
              pats.get(cluster).set(example, p_val + 1);
            } else {
              pats.get(cluster).set(example, 1);
            }
          }
        });
        this.patterns = pats;
        const clusters: TextClusterData[] = Array.from(cluster_ids)
          .map((cid: string): TextClusterData =>
               new TextClusterData(this.get_cluster_info(cid), pats.get(cid)));
        clusters.sort(cluster_compare);
        this.clusters = new MatTableDataSource(clusters);
        if (this.sort) { this.clusters.sort = this.sort; }
        // this.html_content = this._sanitizer.bypassSecurityTrustHtml($html);
        this._spinner.stop();
      });
  }
  ngOnInit() {
    this.getTaggedText();
  }

  lat_to_cluster(lat: string): string {
    return this.get_cluster_name(this.tagged_text.dictionary[lat]['cluster']);
  }

  click_select($event) {
    // console.log($event);
    if ($('.cluster_id').length === 0) {
      const l2c = this.lat_to_cluster.bind(this);
      $('[data-key]').each(function() {
        const lat: string = $(this).attr('data-key');
        const cluster_name: string = l2c(lat);
        $(this).append(`<sup class="cluster_id">{${cluster_name}}</sup>`);
      });
    }
    const parent_key = $event.target.parentNode.getAttribute('data-key');
    if (parent_key) {
      const lat = parent_key.trim();
      // this.selected_lat = lat;
      const obj = this.tagged_text.dictionary[lat];
      if (obj) {
        // this.selected_dimension = obj['dimension'];
        // this.selected_cluster = this.get_cluster_name(obj['cluster']);
        // this.selection = $event.target.parentNode.textContent;
        d3.selectAll('.selected_text').classed('selected_text', false);
        d3.selectAll('.cluster_id').style('display', 'none');
        d3.select($event.target.parentNode).classed('selected_text', true);
        d3.select($event.target.parentNode).select('.cluster_id').style('display', 'inline');
      }
    }
  }

  *get_lats(cluster: string) {
    for (const lat in this.tagged_text.dictionary) {
      if (this.tagged_text.dictionary[lat]['cluster'] === cluster) {
        yield lat;
      }
    }
  }

  get_cluster_info(cluster: string): TextContentDictionaryInformation {
    return this._cluster_info.get(cluster);
  }

  /**
   * Tries to retrieve the human readable name of the given cluster.
   * If the cluster is not in the cluster information, return the cluster id.
   */
  get_cluster_name(cluster: string): string {
    const cluster_info = this.get_cluster_info(cluster);
    if (cluster_info) { return cluster_info.name; }
    return cluster;
  }
  get_pattern_count(cluster: string): number {
    if (this.patterns.has(cluster)) {
      return Array.from(this.patterns.get(cluster).values()).reduce((a: number, c: number) => a + c, 0);
    }
    return 0;
  }
  get_cluster_title(cluster: string): string {
    return `${this.get_cluster_name(cluster)} (${this.get_pattern_count(cluster)})`;
  }

  selection_change($event) {
    console.log($event.source.selectedOptions.selected.length, this.max_selected_clusters);
    if ($event.source.selectedOptions.selected.length > this.max_selected_clusters) {
      $event.option.selected = false;
    }
    const clust: string = $event.option.value;
    const lats = this.get_lats(clust);
    const css_class = this.get_cluster_class(clust);
    if (!$event.option.selected && this._selected_clusters.has(clust)) {
      this._css_classes.unshift(this._selected_clusters.get(clust));
      this._selected_clusters.delete(clust);
    }
    d3.select($event.option._getHostElement()).select('.mat-list-text').classed(css_class, $event.option.selected);
    let lat = lats.next();
    while (!lat.done) {
      d3.selectAll(`[data-key=${lat.value}]`)
        .classed(css_class, $event.option.selected);
      lat = lats.next();
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
