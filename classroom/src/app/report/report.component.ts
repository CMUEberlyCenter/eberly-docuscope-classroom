import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { CorpusService } from '../corpus.service';
import { ReportIntroductionService } from './report-introduction.service';
import { ReportService } from './report.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
})
export class ReportComponent implements OnInit {
  @ViewChild('download_link') download_link: ElementRef;
  corpus: string[];
  intro: string;
  stv_intro: string;

  constructor(
    private corpusService: CorpusService,
    private _spinner: NgxUiLoaderService,
    private introService: ReportIntroductionService,
    private reportService: ReportService
  ) {}

  getCorpus(): void {
    this._spinner.start();
    this.corpusService.getCorpus().subscribe((corpus) => {
      this.corpus = corpus;
      this._spinner.stop();
    });
  }

  getIntro(): void {
    this.introService.getIntroductionText().subscribe((intro) => {
      this.intro = intro.introduction;
      this.stv_intro = intro.stv_introduction;
    });
  }

  ngOnInit() {
    this.getCorpus();
    this.getIntro();
  }

  generate_report(_$event): void {
    this._spinner.start();
    this.reportService
      .getReports(this.corpus, this.intro, this.stv_intro)
      .subscribe((data) => {
        if (data) {
          const url = window.URL.createObjectURL(data);
          const link = this.download_link.nativeElement;
          link.href = url;
          link.download = 'reports.zip';
          this._spinner.stop();
          link.click();
          window.URL.revokeObjectURL(url);
        } else {
          this._spinner.stop();
        }
      });
  }
}
