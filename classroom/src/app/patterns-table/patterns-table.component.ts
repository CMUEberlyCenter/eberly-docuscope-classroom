/* Component for displaying a table of patterns with counts. */
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { PatternData } from '../patterns.service';

@Component({
  selector: 'app-patterns-table',
  templateUrl: './patterns-table.component.html',
  styleUrls: ['./patterns-table.component.css'],
})
export class PatternsTableComponent implements OnInit {
  @ViewChild('patternTableSort', { static: true }) sort: MatSort;
  @Input() patterns: PatternData[];

  displayColumns = ['pattern', 'count'];
  pattern_data: MatTableDataSource<PatternData>;

  ngOnInit(): void {
    this.pattern_data = new MatTableDataSource(this.patterns);
    this.pattern_data.sort = this.sort;
  }
}
