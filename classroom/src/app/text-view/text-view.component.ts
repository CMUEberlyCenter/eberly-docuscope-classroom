import { Component, OnInit, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

import * as d3 from 'd3';
import * as $ from 'jquery';

import { TaggedTextService, TextContent, TextContentDictionaryInformation } from '../tagged-text.service';
// import { memoize } from '../memoize';

@Component({
  selector: 'app-text-view',
  templateUrl: './text-view.component.html',
  styleUrls: ['./text-view.component.css']
})
export class TextViewComponent implements OnInit {
  tagged_text: TextContent;
  clusters: Set<string>;
  patterns: Map<string, Map<string, number>>;
  html_content: SafeHtml;

  selection = 'No Selection';
  // selected_lat: string;
  // selected_dimension: string;
  selected_cluster: string;

  _cluster_info: Map<string, TextContentDictionaryInformation>;

  private _css_classes: string[] = [
    'cluster_0',
    'cluster_1',
    'cluster_2',
    'cluster_3',
    'cluster_4',
    'cluster_5'];

  get max_selected_clusters(): number {
    return 4;
  }

  private _selected_clusters: Map<string, string> = new Map<string, string>();

  constructor(
    private _route: ActivatedRoute,
    private _spinner: NgxSpinnerService,
    private _text_service: TaggedTextService,
    private _sanitizer: DomSanitizer
  ) { }

  getTaggedText() {
    this._spinner.show();
    const id = this._route.snapshot.paramMap.get('doc');
    this._text_service.getTaggedText(id)
      .subscribe(txt => {
        this.tagged_text = txt;
        // have to bypass some security otherwise the id's and data-key's get stripped. TODO: annotate html so it is safe.
        this.html_content = this._sanitizer.bypassSecurityTrustHtml(txt.html_content);
        const clusters = new Set<string>();
        for (const d of Object.keys(txt.dict)) {
          const cluster = txt.dict[d]['cluster'];
          clusters.add(cluster);
        }
        clusters.delete('Other');
        this.clusters = clusters;
        const pats = new Map<string, Map<string, number>>();
        clusters.forEach((cl) => pats.set(cl, new Map<string, number>()));

        const $html = $(txt.html_content);
        $html.find('[data-key]').each(function() {
          const lat = $(this).attr('data-key');
          const cluster = txt.dict[lat]['cluster'];
          const example = $(this).text().replace(/(\n|\s)+/g, ' ').toLowerCase().trim();

          if (pats.has(cluster)) {
            if (pats.get(cluster).has(example)) {
              const p_val = pats.get(cluster).get(example);
              pats.get(cluster).set(example, p_val + 1);
            } else {
              pats.get(cluster).set(example, 1);
            }
          }
        });
        this.patterns = pats;
        this._cluster_info = new Map<string, TextContentDictionaryInformation>();
        /* for (let clust of this.patterns.keys()) {
          console.log(clust);
          for (let pattern of this.patterns.get(clust).entries()) {
            console.log(` - "${pattern[0]}" (${pattern[1]})`);
          }
          } */
        this._spinner.hide();
      });
  }
  ngOnInit() {
    this.getTaggedText();
  }

  click_select($event) {
    console.log($event);
    const parent_key = $event.target.parentNode.getAttribute('data-key');
    if (parent_key) {
      const lat = parent_key.trim();
      // this.selected_lat = lat;
      const obj = this.tagged_text.dict[lat];
      if (obj) {
        // this.selected_dimension = obj['dimension'];
        this.selected_cluster = this.get_cluster_name(obj['cluster']);
        this.selection = $event.target.parentNode.textContent;
        d3.selectAll('.selected_text').classed('selected_text', false);
        d3.select($event.target.parentNode).classed('selected_text', true);
      }
    }
  }

  *get_lats(cluster: string) {
    for (const lat in this.tagged_text.dict) {
      if (this.tagged_text.dict[lat]['cluster'] === cluster) {
        yield lat;
      }
    }
  }

  get_cluster_info(cluster: string): TextContentDictionaryInformation {
    if (!this._cluster_info.has(cluster)) {
      for (const clust of this.tagged_text.dict_info.cluster) {
        if (clust.id === cluster) {
          this._cluster_info.set(cluster, clust);
          break;
        }
      }
    }
    return this._cluster_info.get(cluster);
  }

  // get_cluster_info(cluster: string) {
  //  return this.memo_cluster_info(cluster);
  // }

  /**
   * Tries to retrieve the human readable name of the given cluster.
   * If the cluster is not in the cluster information, return the cluster id.
   */
  get_cluster_name(cluster: string): string {
    let cluster_info = this.get_cluster_info(cluster);
    if (cluster_info) { return cluster_info.name; }
    return cluster;
  }

  toggle_category($event) {
    // console.log($event);
    // console.log($event.target.checked, $event.target.value);
    if ($($event.target).closest('aside').find(':checkbox:checked').length > this.max_selected_clusters) {
      $event.target.checked = false;
    }
    const clust: string = $event.target.value;
    const lats = this.get_lats(clust);
    const css_class = this.get_cluster_class(clust);
    if (!$event.target.checked && this._selected_clusters.has(clust)) {
      this._css_classes.unshift(this._selected_clusters.get(clust));
      this._selected_clusters.delete(clust);
    }
    d3.select($event.target.parentNode).classed(css_class, $event.target.checked);
    let lat = lats.next();
    while (!lat.done) {
      d3.selectAll(`[data-key=${lat.value}]`)
        .classed(css_class, $event.target.checked);
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
