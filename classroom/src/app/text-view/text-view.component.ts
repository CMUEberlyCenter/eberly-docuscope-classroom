import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { TaggedTextService } from '../tagged-text.service';

@Component({
  selector: 'app-text-view',
  templateUrl: './text-view.component.html',
  styleUrls: ['./text-view.component.css']
})
export class TextViewComponent implements OnInit {
  tagged_text;

  constructor(
    private _route: ActivatedRoute,
    private _location: Location,
    private _text_service: TaggedTextService
  ) { }

  getTaggedText() {
    const id = this._route.snapshot.paramMap.get('doc');
    this._text_service.getTaggedText(id)
      .subscribe(txt => this.tagged_text = txt);
  }
  ngOnInit() {
    this.getTaggedText();
  }

}
