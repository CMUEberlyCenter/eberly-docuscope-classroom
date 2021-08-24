import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { CorpusService } from '../corpus.service';
import { ReportIntroductionService } from './report-introduction.service';
import { ReportService } from './report.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
})
export class ReportComponent implements OnInit {
  @ViewChild('download_link') download_link!: ElementRef;
  corpus: string[] = [];
  intro = '';
  stv_intro = '';

  constructor(
    private corpusService: CorpusService,
    private _spinner: NgxUiLoaderService,
    private introService: ReportIntroductionService,
    private reportService: ReportService
  ) {}

  getCorpus(): void {
    //this._spinner.start();
    this.corpusService.getCorpus().subscribe((corpus) => {
      this.corpus = corpus;
      //this._spinner.stop();
    });
  }

  getIntro(): void {
    this._spinner.start();
    this.introService.getIntroductionText().subscribe((intro) => {
      this.intro = intro.introduction;
      this.stv_intro = intro.stv_introduction;
      this._spinner.stop();
    });
  }

  ngOnInit(): void {
    this.getCorpus();
    this.getIntro();
  }

  generate_report(_$event: MouseEvent): void {
    this._spinner.start();
    this.reportService
      .getReports(this.corpus, this.intro, this.stv_intro)
      .subscribe({
        next: (data) => {
          if (data) {
            const url = window.URL.createObjectURL(data);
            const link = this.download_link.nativeElement as HTMLAnchorElement;
            link.href = url;
            link.download = 'reports.zip';
            link.click();
            window.URL.revokeObjectURL(url);
          }
        },
        error: (err) => {
          this._spinner.stop();
          if (err) throw err;
        },
        complete: () => this._spinner.stop(),
      });
  }
}
