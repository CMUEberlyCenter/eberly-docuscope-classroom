/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { asyncData, Spied } from '../../testing';
import { AboutComponent } from '../about/about.component';
import { AssignmentService } from '../assignment.service';
import { SettingsService } from '../settings.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let service: AssignmentService;
  let settings_spy: Spied<SettingsService>;
  const mat_dialog_spy = jasmine.createSpyObj('MatDialog', [
    'open',
  ]) as Spied<MatDialog>;

  beforeEach(async () => {
    settings_spy = jasmine.createSpyObj('SettingsService', [
      'getSettings',
    ]) as Spied<SettingsService>;
    settings_spy.getSettings.and.returnValue(
      asyncData({
        title: 'DocuScope Classroom',
        institution: 'Home',
        unit: 100,
        homepage:
          'https://www.cmu.edu/dietrich/english/research/docuscope.html',
        scatter: { width: 400, height: 400 },
        boxplot: { cloud: true },
        stv: { max_clusters: 4 },
      })
    );
    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      imports: [MatIconModule, MatToolbarModule, MatTooltipModule],
      providers: [
        AssignmentService,
        { provide: MatDialog, useValue: mat_dialog_spy },
        { provide: SettingsService, useValue: settings_spy },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    service = TestBed.inject(AssignmentService);
  });

  it('should create', () => {
    void expect(component).toBeTruthy();
  });

  it('should have as title "DocuScope Classroom @ CMU"', () => {
    void expect(component.title).toEqual('DocuScope Classroom');
    void expect(component.institution).toEqual('@ CMU');
  });

  it('check assignment', () => {
    service.setAssignment('assignment');
    fixture.detectChanges();
    return fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      void expect(
        compiled.querySelector('#assignment_name').textContent
      ).toContain('assignment');
    });
  });
  it('check course', () => {
    service.setCourse('course');
    fixture.detectChanges();
    return fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      void expect(compiled.querySelector('#course_name').textContent).toContain(
        'course'
      );
    });
  });
  it('check instructor', () => {
    service.setInstructor('instructor');
    fixture.detectChanges();
    return fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      void expect(
        compiled.querySelector('#instructor_name').textContent
      ).toContain('instructor');
    });
  });

  it('about', () => {
    component.openAbout();
    void expect(mat_dialog_spy.open).toHaveBeenCalled();
    expect(mat_dialog_spy.open).toHaveBeenCalledWith(AboutComponent);
  });

  it('getSettings', async () => {
    void expect(component.institution).toBe('@ CMU');
    component.getSettings();
    fixture.detectChanges();
    await fixture.whenStable().then(() => {
      void expect(component.institution).toBe('@ Home');
    });

    settings_spy.getSettings.and.returnValue(
      asyncData({
        title: 'DocuScope Classroom',
        institution: '',
        unit: 100,
        homepage:
          'https://www.cmu.edu/dietrich/english/research/docuscope.html',
        scatter: { width: 400, height: 400 },
        boxplot: { cloud: true },
        stv: { max_clusters: 4 },
      })
    );
    component.getSettings();
    fixture.detectChanges();
    await fixture.whenStable().then(() => {
      void expect(component.institution).toBe('');
    });
  });
});
