/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AboutComponent } from '../about/about.component';
import { AssignmentService } from '../assignment.service';
import { Settings, SettingsService } from '../settings.service';
import { HeaderComponent } from './header.component';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { of } from 'rxjs';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let service: AssignmentService;
  let settings_spy: Mocked<SettingsService>;
  const mat_dialog_spy: Mocked<MatDialog> = {
    open: vi.fn().mockName('MatDialog.open'),
  } as unknown as Mocked<MatDialog>;

  beforeEach(async () => {
    settings_spy = {
      getSettings: vi
        .fn()
        .mockName('SettingsService.getSettings')
        .mockReturnValue(
          of({
            title: 'DocuScope Classroom',
            institution: 'Home',
            unit: 100,
            homepage:
              'https://www.cmu.edu/dietrich/english/research/docuscope.html',
            scatter: { width: 400, height: 400 },
            boxplot: { cloud: true },
            stv: { max_clusters: 4 },
          })
        ),
    } as unknown as Mocked<SettingsService>;
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [HeaderComponent],
      providers: [
        AssignmentService,
        { provide: MatDialog, useValue: mat_dialog_spy },
        { provide: SettingsService, useValue: settings_spy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    //fixture.detectChanges();
    service = TestBed.inject(AssignmentService);
  });

  it('should create', () => {
    void expect(component).toBeTruthy();
  });

  it('should have as title "DocuScope Classroom @ CMU"', async () => {
    expect(component.title).toEqual('DocuScope Classroom');
    expect(component.institution).toEqual('@ CMU');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.institution).toEqual('@ Home');
  });

  it('check assignment', async () => {
    service.setAssignment('assignment');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('#assignment_name').textContent).toContain(
      'assignment'
    );
  });
  it('check course', async () => {
    service.setCourse('course');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('#course_name').textContent).toContain(
      'course'
    );
  });
  it('check instructor', async () => {
    service.setInstructor('instructor');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('#instructor_name').textContent).toContain(
      'instructor'
    );
  });

  it('about', async () => {
    component.openAbout();
    expect(mat_dialog_spy.open).toHaveBeenCalled();
    expect(mat_dialog_spy.open).toHaveBeenCalledWith(AboutComponent);
  });

  it('getSettings', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.institution).toBe('@ Home');

    settings_spy.getSettings.mockReturnValue(
      of({
        title: 'DocuScope Classroom',
        institution: '',
        unit: 100,
        homepage:
          'https://www.cmu.edu/dietrich/english/research/docuscope.html',
        scatter: { width: 400, height: 400 },
        boxplot: { cloud: true },
        stv: { max_clusters: 4 },
      } as unknown as Settings)
    );
    component.getSettings();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.institution).toBe('');
  });
});
