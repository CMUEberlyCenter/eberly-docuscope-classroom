import { Component, OnInit } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

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
  group_size: number = 2; //string = '2';
  groups: GroupsData;
  absent: string[] = [];

  constructor(private corpus_service: CorpusService,
              private _spinner: NgxUiLoaderService,
              private data_service: BoxplotDataService) { }

  getCorpus(): void {
    this._spinner.start();
    this.corpus_service.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        this._spinner.stop();
      });
  }

  getGroupsData(): void {
    this._spinner.start();
    this.data_service.getGroupsData(this.corpus, +this.group_size)
      .subscribe(data => {
        this.groups = data;
        this.absent = [];
        this._spinner.stop();
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
