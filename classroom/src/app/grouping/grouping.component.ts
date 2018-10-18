import { Component, OnInit } from '@angular/core';

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
  group_sizes: number[] = [2, 3, 4];
  group_size: string = "2";
  groups: GroupsData;
  students: [string, boolean][] = [
    ['John', true],
    ['Mike', true],
    ['Alex', true],
    ['Kate', true],
    ['Sarah', true],
  ];

  constructor(private corpus_service: CorpusService,
              private data_service: BoxplotDataService) { }

  getCorpus(): void {
    this.corpus_service.getCorpus()
      .subscribe(corpus => this.corpus = corpus);
  }

  getGroupsData(): void {
    this.data_service.getGroupsData(this.corpus, +this.group_size)
      .subscribe(data => {this.groups = data; console.log(data);});
  }

  ngOnInit() {
    this.getCorpus();
  }

  generate_groups(e): void {
    if (this.group_size)
      this.getGroupsData();
    else
      alert("Select a group size");
  }

}
