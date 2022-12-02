/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Spied } from 'src/testing';
import { asyncData } from '../../testing/async-observable-helpers';
import { CorpusService } from '../corpus.service';
import { ReportIntroductionService } from './report-introduction.service';
import { ReportComponent } from './report.component';
import { ReportService } from './report.service';

describe('ReportComponent', () => {
  let component: ReportComponent;
  let fixture: ComponentFixture<ReportComponent>;
  let corpus_service_spy: Spied<CorpusService>;
  let report_service_spy: Spied<ReportService>;
  let intro_service_spy: Spied<ReportIntroductionService>;

  beforeEach(async () => {
    corpus_service_spy = jasmine.createSpyObj('CorpusService', [
      'getCorpus',
    ]) as Spied<CorpusService>;
    corpus_service_spy.getCorpus.and.returnValue(asyncData([]));
    report_service_spy = jasmine.createSpyObj('ReportService', [
      'getReports',
    ]) as Spied<ReportService>;
    report_service_spy.getReports.and.returnValue(asyncData(''));
    intro_service_spy = jasmine.createSpyObj('ReportIntroductionService', [
      'getIntroductionText',
    ]) as Spied<ReportIntroductionService>;
    intro_service_spy.getIntroductionText.and.returnValue(
      asyncData({
        introduction: 'Intro Text',
        stv_introduction: 'STV Introduction',
      })
    );

    await TestBed.configureTestingModule({
      declarations: [ReportComponent],
      imports: [
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: CorpusService, useValue: corpus_service_spy },
        { provide: ReportService, useValue: report_service_spy },
        { provide: ReportIntroductionService, useValue: intro_service_spy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', async () => {
    await expect(component).toBeDefined();
  });

  it('generate_report empty', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    spyOn(window.URL, 'createObjectURL').and.returnValue('bogus.pdf');
    spyOn(window.URL, 'revokeObjectURL');
    component.download_link.nativeElement.click = jasmine.createSpy('click');
    component.generate_report(new MouseEvent('click'));
    fixture.detectChanges();

    // TODO: check if spinner openned.
    await expect(report_service_spy.getReports).toHaveBeenCalled();
    // TODO: check if spinner closed.
  });

  it('generate_report', async () => {
    await fixture.whenStable();
    report_service_spy.getReports.and.returnValue(asyncData('data'));
    fixture.detectChanges();
    spyOn(window.URL, 'createObjectURL').and.returnValue('bogus.pdf');
    spyOn(window.URL, 'revokeObjectURL');
    component.download_link.nativeElement.click = jasmine.createSpy('click');
    component.generate_report(new MouseEvent('click'));
    fixture.detectChanges();

    // TODO: check if spinner openned.
    await expect(report_service_spy.getReports).toHaveBeenCalled();
    // TODO: check if spinner closed.
  });
  it('generate_report error', async () => {
    await fixture.whenStable();
    report_service_spy.getReports.and.throwError('test');
    fixture.detectChanges();
    await expect(() =>
      component.generate_report(new MouseEvent('click'))
    ).toThrowError('test');
    fixture.detectChanges();
  });
});
