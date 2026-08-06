/* Table display component for comparing instance counts.

A table that lists the exemplars that make up the category
with the counts of the occurrences of those patterns in
two documents.
*/
import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ComparePatternData } from '../patterns.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-compare-patterns-table',
  templateUrl: './compare-patterns-table.component.html',
  styleUrls: ['./compare-patterns-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [MatSortModule, MatTableModule, MatIconModule],
})
export class ComparePatternsTableComponent implements OnInit {
  @ViewChild('patternTableSort', { static: true }) sort!: MatSort;
  @Input() patterns!: ComparePatternData[]; // parameterized table data
  @Input() colors!: string[]; // parameterized column colors

  displayColumns = ['pattern', 'count0', 'count1']; // columns to display
  pattern_data: MatTableDataSource<ComparePatternData> | undefined;

  ngOnInit(): void {
    this.pattern_data = new MatTableDataSource(this.patterns);
    this.pattern_data.sort = this.sort;
  }

  /** Get color for first document. */
  get left_color(): string {
    return this.colors && this.colors.length > 0 ? this.colors[0] : 'black';
  }
  /** Get color for second document. */
  get right_color(): string {
    return this.colors && this.colors.length > 1 ? this.colors[1] : 'black';
  }
}
