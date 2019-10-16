import { Component, OnInit, ViewChild, QueryList } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { ClusterData, instance_count } from '../cluster-data';
import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';
import { CategoryPatternData, PatternData, PatternsService } from '../patterns.service';

export class PatternClusterData implements ClusterData {
  id: string;
  name: string;
  description?: string;
  patterns: PatternData[];
  get count(): number { return instance_count(this.patterns); }
  get pattern_count(): number { return this.patterns.length; }
  constructor(cluster: CategoryPatternData) {
    this.id = cluster.category.id;
    this.name = cluster.category.name;
    this.description = cluster.category.description;
    this.patterns = cluster.patterns;
  }
}

@Component({
  selector: 'app-patterns',
  templateUrl: './patterns.component.html',
  styleUrls: ['./patterns.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
    trigger('indicatorRotate', [
      state('collapsed, void', style({transform: 'rotate(0deg)'})),
      state('expanded', style({transform: 'rotate(180deg)'})),
      transition('expanded <=> collapsed, void => collapsed',
                 animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
  ],
})
export class PatternsComponent implements OnInit {
  corpus: Corpus;
  patterns_data: MatTableDataSource<PatternClusterData>;
  expanded: PatternClusterData | null;
  cluster_columns = ['name', /*'pattern_count',*/ 'count', 'expand'];

  @ViewChild('clusterTableSort', {static: true}) sort: MatSort;

  constructor(private corpusService: CorpusService,
              private dataService: PatternsService,
              private spinner: NgxUiLoaderService) { }

  ngOnInit() {
    this.spinner.start();
    this.corpusService.getCorpus().subscribe(corpus => {
      this.corpus = corpus;
      this.dataService.getPatterns(corpus).subscribe(data => {
        const cdata: ClusterData[] = data.map(c => new PatternClusterData(c));
        this.patterns_data = new MatTableDataSource(cdata);
        this.patterns_data.sort = this.sort;
        console.log(this.sort);
        this.spinner.stop();
      });
    });
  }
}
