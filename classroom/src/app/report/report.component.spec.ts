/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { CorpusService } from '../corpus.service';
import { ReportIntroductionService } from './report-introduction.service';
import { ReportComponent } from './report.component';
import { ReportService } from './report.service';

describe('ReportComponent', () => {
  let component: ReportComponent;
  let fixture: ComponentFixture<ReportComponent>;
  let corpus_service_spy: Mocked<CorpusService>;
  let report_service_spy: Mocked<ReportService>;
  let intro_service_spy: Mocked<ReportIntroductionService>;

  beforeEach(async () => {
    corpus_service_spy = {
      getCorpus: vi
        .fn()
        .mockName('CorpusService.getCorpus')
        .mockReturnValue(of([])),
    } as unknown as Mocked<CorpusService>;
    report_service_spy = {
      getReports: vi
        .fn()
        .mockName('ReportService.getReports')
        .mockReturnValue(of('')),
    } as unknown as Mocked<ReportService>;
    intro_service_spy = {
      getIntroductionText: vi
        .fn()
        .mockName('ReportIntroductionService.getIntroductionText')
        .mockReturnValue(
          of({
            introduction: 'Intro Text',
            stv_introduction: 'STV Introduction',
          })
        ),
    } as unknown as Mocked<ReportIntroductionService>;

    await TestBed.configureTestingModule({
      declarations: [ReportComponent],
      imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule],
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
    expect(component).toBeDefined();
  });

  it('generate_report empty', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('bogus.pdf');
    vi.spyOn(window.URL, 'revokeObjectURL').mockReturnValue(undefined);
    component.download_link.nativeElement.click = vi.fn().mockName('click');
    component.generate_report(new MouseEvent('click'));
    fixture.detectChanges();

    // TODO: check if spinner openned.
    expect(report_service_spy.getReports).toHaveBeenCalled();
    // TODO: check if spinner closed.
  });

  it('generate_report', async () => {
    await fixture.whenStable();
    report_service_spy.getReports.mockReturnValue(of(new Blob(['data'])));
    fixture.detectChanges();
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('bogus.pdf');
    vi.spyOn(window.URL, 'revokeObjectURL').mockReturnValue(undefined);
    component.download_link.nativeElement.click = vi.fn().mockName('click');
    component.generate_report(new MouseEvent('click'));
    fixture.detectChanges();

    // TODO: check if spinner openned.
    expect(report_service_spy.getReports).toHaveBeenCalled();
    // TODO: check if spinner closed.
  });
  it('generate_report error', async () => {
    await fixture.whenStable();
    report_service_spy.getReports.mockImplementation(() => {
      throw new Error('test');
    });
    fixture.detectChanges();
    expect(() => component.generate_report(new MouseEvent('click'))).toThrow(
      'test'
    );
    fixture.detectChanges();
  });
});
