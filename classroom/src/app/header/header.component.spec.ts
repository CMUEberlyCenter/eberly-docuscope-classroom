import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
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

  beforeEach(
    waitForAsync(() => {
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
      void TestBed.configureTestingModule({
        declarations: [HeaderComponent],
        imports: [MatIconModule, MatToolbarModule, MatTooltipModule],
        providers: [
          AssignmentService,
          { provide: MatDialog, useValue: mat_dialog_spy },
          { provide: SettingsService, useValue: settings_spy },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    service = TestBed.inject(AssignmentService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have as title "DocuScope Classroom @ CMU"', () => {
    expect(component.title).toEqual('DocuScope Classroom');
    expect(component.institution).toEqual('@ CMU');
  });

  it('check assignment', () => {
    service.setAssignment('assignment');
    fixture.detectChanges();
    return fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      expect(compiled.querySelector('#assignment_name').textContent).toContain(
        'assignment'
      );
    });
  });
  it('check course', () => {
    service.setCourse('course');
    fixture.detectChanges();
    return fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      expect(compiled.querySelector('#course_name').textContent).toContain(
        'course'
      );
    });
  });
  it('check instructor', () => {
    service.setInstructor('instructor');
    fixture.detectChanges();
    return fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      expect(compiled.querySelector('#instructor_name').textContent).toContain(
        'instructor'
      );
    });
  });

  it('about', () => {
    component.openAbout();
    expect(mat_dialog_spy.open).toHaveBeenCalled();
    expect(mat_dialog_spy.open).toHaveBeenCalledWith(AboutComponent);
  });

  it(
    'getSettings',
    waitForAsync(async () => {
      expect(component.institution).toBe('@ CMU');
      component.getSettings();
      fixture.detectChanges();
      await fixture.whenStable().then(() => {
        expect(component.institution).toBe('@ Home');
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
        expect(component.institution).toBe('');
      });
    })
  );
});
