import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ComparePatternData } from '../patterns.service';

@Component({
  selector: 'app-compare-patterns-table',
  templateUrl: './compare-patterns-table.component.html',
  styleUrls: ['./compare-patterns-table.component.css']
})
export class ComparePatternsTableComponent implements OnInit {
  @ViewChild('patternTableSort', {static: true}) sort: MatSort;
  @Input() patterns: ComparePatternData[];
  @Input() colors: string[];

  displayColumns = ['pattern', 'count0', 'count1'];
  pattern_data: MatTableDataSource<ComparePatternData>;

  constructor() { }

  ngOnInit(): void {
    this.pattern_data = new MatTableDataSource(this.patterns);
    this.pattern_data.sort = this.sort;
  }

  get left_color(): string {
    return this.colors && this.colors.length > 0 ? this.colors[0] : 'black';
  }
  get right_color(): string {
    return this.colors && this.colors.length > 1 ? this.colors[1] : 'black';
  }
}
