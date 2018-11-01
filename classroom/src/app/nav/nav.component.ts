import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {

  constructor(private _route: ActivatedRoute) { }

  is_current(id:string) {
    return id === `/${this._route.snapshot.url.join('/')}`;
  }
  ngOnInit() { }

}
