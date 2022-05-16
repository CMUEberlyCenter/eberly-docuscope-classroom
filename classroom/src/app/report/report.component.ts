import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
    private introService: ReportIntroductionService,
    private reportService: ReportService
  ) {}

  getCorpus(): void {
    this.corpusService.getCorpus().subscribe((corpus) => {
      this.corpus = corpus;
    });
  }

  getIntro(): void {
    this.introService.getIntroductionText().subscribe((intro) => {
      this.intro = intro.introduction;
      this.stv_intro = intro.stv_introduction;
    });
  }

  ngOnInit(): void {
    this.getCorpus();
    this.getIntro();
  }

  generate_report(_$event: MouseEvent): void {
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
      });
  }
}
