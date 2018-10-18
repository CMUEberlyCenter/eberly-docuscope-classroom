import { Component, OnInit, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import * as d3 from 'd3';

import { TaggedTextService, TextContent } from '../tagged-text.service';

@Component({
  selector: 'app-text-view',
  templateUrl: './text-view.component.html',
  styleUrls: ['./text-view.component.css']
})
export class TextViewComponent implements OnInit {
  tagged_text: TextContent;
  clusters: Set<string>;
  html_content: SafeHtml;

  selection: string = 'No Selection';
  selected_lat: string;
  selected_dimension: string;
  selected_cluster: string;

  constructor(
    private _route: ActivatedRoute,
    private _location: Location,
    private _text_service: TaggedTextService,
    private _sanitizer: DomSanitizer
  ) { }

  getTaggedText() {
    const id = this._route.snapshot.paramMap.get('doc');
    this._text_service.getTaggedText(id)
      .subscribe(txt => {
        console.log(txt);
        this.tagged_text = txt;
        // have to bypass some security otherwise the id's and data-key's get stripped. TODO: annotate html so it is safe.
        this.html_content = this._sanitizer.bypassSecurityTrustHtml(txt.html_content);
        let clusters = new Set<string>();
        for (let d in txt.dict) {
          let cluster = txt.dict[d]['cluster'];
          clusters.add(cluster);
        }
        clusters.delete('Other');
        this.clusters = clusters;
      });
  }
  ngOnInit() {
    this.getTaggedText();
  }

  click_select($event) {
    console.log($event);
    let parent_key = $event.target.parentNode.getAttribute('data-key');
    if (parent_key) {
      let lat = parent_key.trim();
      this.selected_lat = lat;
      let obj = this.tagged_text.dict[lat];
      if (obj) {
        this.selected_dimension = obj['dimension'];
        this.selected_cluster = obj['cluster'];
        this.selection = $event.target.textContent;
      }
    }
  }
  *get_lats(cluster:string) {
    for (let lat in this.tagged_text.dict) {
      if (this.tagged_text.dict[lat]['cluster'] === cluster) {
        yield lat;
      }
    }
  }

  toggle_category($event) {
    console.log($event);
    console.log($event.target.checked, $event.target.value);
    let clust: string = $event.target.value;
    //let lats = this.tagged_text.dict
    console.log(`[data-key=${clust}]`);
    //d3.select($event.target).style('color','pink');
    //d3.select($event.target).style('color', 'black')
    let lats = this.get_lats(clust);
    let lat =  lats.next();
    while (!lat.done) {
      console.log(lat.value);
      d3.selectAll(`[data-key=${lat.value}]`)
        .classed('cluster_0', $event.target.checked);
        //.style('border-bottom-width', '3px');
      lat = lats.next();
    }

  }
  goBack(): void {
    this._location.back();
  }
}
