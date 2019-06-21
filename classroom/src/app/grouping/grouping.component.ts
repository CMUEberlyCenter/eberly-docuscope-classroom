import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';

import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';
import { BoxplotDataService } from '../boxplot-data.service';
import { GroupsData } from '../boxplot-data';

@Component({
  selector: 'app-grouping',
  templateUrl: './grouping.component.html',
  styleUrls: ['./grouping.component.css']
})
export class GroupingComponent implements OnInit {
  corpus: Corpus;
  //group_sizes: number[] = ['2', '3', '4'];
  group_size: number = 2; //string = '2';
  groups: GroupsData;
  absent: string[] = [];

  constructor(private corpus_service: CorpusService,
              private _spinner: NgxSpinnerService,
              private data_service: BoxplotDataService) { }

  getCorpus(): void {
    this._spinner.show();
    this.corpus_service.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        this._spinner.hide();
      });
  }

  getGroupsData(): void {
    this._spinner.show();
    this.data_service.getGroupsData(this.corpus, +this.group_size)
      .subscribe(data => {
        this.groups = data;
        this.absent = [];
        this._spinner.hide();
      });
  }

  ngOnInit() {
    this.getCorpus();
  }

  generate_groups(e): void {
    if (this.group_size) {
      this.getGroupsData();
    } else {
      alert('Select a group size.');
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
