import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';
import { ReportService } from '../report.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  corpus: Corpus;
  @ViewChild('download_link', { static: false }) private download_link: ElementRef;

  constructor(private corpusService: CorpusService,
              private _spinner: NgxSpinnerService,
              private reportService: ReportService) { }

  getCorpus(): void {
    this._spinner.show();
    this.corpusService.getCorpus()
      .subscribe(corpus => {
        this.corpus = corpus;
        this._spinner.hide();
      });
  }

  ngOnInit() {
    this.getCorpus();
  }

  generate_report($event): void {
    this._spinner.show();
    this.reportService.getReports(this.corpus).subscribe(data => {
      const url = window.URL.createObjectURL(data);
      const link = this.download_link.nativeElement;
      link.href = url;
      link.download = 'reports.zip';
      this._spinner.hide();
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
