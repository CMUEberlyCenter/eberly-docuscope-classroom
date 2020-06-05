import { Component, OnInit } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AssignmentService } from '../assignment.service';
import { CorpusService } from '../corpus.service';
import { BoxplotDataService } from '../boxplot-data.service';
import { GroupsData } from '../boxplot-data';

@Component({
  selector: 'app-grouping',
  templateUrl: './grouping.component.html',
  styleUrls: ['./grouping.component.css']
})
export class GroupingComponent implements OnInit {
  size_min = 2;
  get size_max(): number {
    return this.corpus
      ? Math.max(this.size_min,
        Math.floor(this.corpus.length / 2))
      : this.size_min;
  }
  corpus: string[];
  group_size = 2;
  groups: GroupsData;
  absent: string[] = [];

  constructor(
    private corpus_service: CorpusService,
    private _assignment_service: AssignmentService,
    private _spinner: NgxUiLoaderService,
    private _snack_bar: MatSnackBar,
    private data_service: BoxplotDataService) { }

  getCorpus(): void {
    this._spinner.start();
    this.corpus_service.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        // this._spinner.stop();
        this.getGroupsData();
      });
  }

  getGroupsData(): void {
    this._spinner.start();
    this.data_service.getGroupsData(this.corpus, +this.group_size)
      .subscribe(data => {
        this.groups = data;
        this._assignment_service.setAssignmentData(data);
        this.absent = [];
        this._spinner.stop();
      });
  }

  ngOnInit() {
    this.getCorpus();
  }

  get num_documents(): number { return this.corpus ? this.corpus.length : 0; }
  generate_groups(e): void {
    if (this.group_size) {
      if (this.num_documents < 4) {
        this._snack_bar.open('There needs to be at least four documents in order to form groups.', '\u2612');
      } else if (this.group_size < this.size_min) {
        this._snack_bar.open(`The group size needs to be at least ${this.size_min}.`, '\u2612');
      } else if (this.group_size > this.size_max) {
        this._snack_bar.open(`The group size can not be greater than half the number of documents (${this.size_max}).`, '\u2612');
      } else {
        this.getGroupsData();
      }
    } else {
      this._snack_bar.open('Please set a group size.', '\u2612');
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data,
        event.previousIndex,
        event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
  }
}
