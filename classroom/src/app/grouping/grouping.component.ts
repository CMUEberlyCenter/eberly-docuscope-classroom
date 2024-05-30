/* Component for requesting, displaying, and modifying groupings of students. */
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AssignmentService } from '../assignment.service';
import { CorpusService } from '../corpus.service';
import { GroupsData, GroupsService } from './groups.service';

@Component({
  selector: 'app-grouping',
  templateUrl: './grouping.component.html',
  styleUrls: ['./grouping.component.scss'],
})
export class GroupingComponent implements OnInit {
  size_min = 2; // Minimum size of groups (no singletons)
  /** Calculates the maximum size of the groupings. */
  get size_max(): number {
    return this.corpus.length
      ? Math.max(this.size_min, Math.floor(this.corpus.length / 2))
      : this.size_min;
  }
  corpus: string[] = []; // List of document UUID's.
  group_size: number | null = 2; // Current group size.
  groups: GroupsData | undefined; // data from GroupsService.
  absent: string[] = []; // extra group for absent students.

  constructor(
    private corpus_service: CorpusService,
    private _assignment_service: AssignmentService,
    private _snack_bar: MatSnackBar,
    private data_service: GroupsService
  ) {}

  /** Sets the list of documents using corpus service. */
  getCorpus(): void {
    this.corpus_service.getCorpus().subscribe((corpus) => {
      this.corpus = corpus;
      this.getGroupsData();
    });
  }

  /**
   * Retrieve the groupings.
   */
  getGroupsData(): void {
    this.data_service
      .getGroupsData(this.corpus, this.group_size ?? 2)
      .subscribe((data) => {
        this.groups = data;
        this._assignment_service.setAssignmentData(data);
        this.absent = [];
      });
  }

  ngOnInit(): void {
    this.getCorpus();
  }

  /** The size of the list of documents */
  get num_documents(): number {
    return this.corpus.length;
  }
  /**
   * Event handler to start grouping.
   * @param _e Event triggering grouping
   */
  generate_groups(_e: unknown): void {
    if (this.group_size) {
      if (this.num_documents < 4) {
        this._snack_bar.open(
          'There needs to be at least four documents in order to form groups.',
          '\u2612'
        );
      } else if (this.group_size < this.size_min) {
        this._snack_bar.open(
          `The group size needs to be at least ${this.size_min}.`,
          '\u2612'
        );
      } else if (this.group_size > this.size_max) {
        this._snack_bar.open(
          `The group size can not be greater than half the number of documents (${this.size_max}).`,
          '\u2612'
        );
      } else {
        this.getGroupsData();
      }
    } else {
      this._snack_bar.open('Please set a group size.', '\u2612');
    }
  }

  /**
   * Event handler for manual moving students between groups.
   * @param event drag and drop event
   */
  drop(event: CdkDragDrop<string[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
}
