import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { asyncData } from '../../testing';

import { AboutComponent } from '../about/about.component';
import { HeaderComponent } from './header.component';
import { AssignmentService } from '../assignment.service';

@Component({selector: 'app-about', template: ''})
class AboutStubComponent {}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let service: AssignmentService;
  const mat_dialog_spy = jasmine.createSpyObj('MatDialog', ['open']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HeaderComponent ],
      imports: [
        MatIconModule,
        MatToolbarModule,
        MatTooltipModule,
      ],
      providers: [
        AssignmentService,
        { provide: MatDialog, useValue: mat_dialog_spy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    service = TestBed.inject(AssignmentService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'DocuScope Classroom @ CMU'`, () => {
    expect(component.title).toEqual('DocuScope Classroom @ CMU');
  });

  it(`check assignment`, () => {
    service.setAssignment('assignment');
    fixture.detectChanges();
    return fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      expect(compiled.querySelector('#assignment_name').textContent)
        .toContain('assignment');
    });
  });
  it(`check course`, () => {
    service.setCourse('course');
    fixture.detectChanges();
    return fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      expect(compiled.querySelector('#course_name').textContent)
        .toContain('course');
    });
  });
  it(`check instructor`, () => {
    service.setInstructor('instructor');
    fixture.detectChanges();
    return fixture.whenStable().then(() => {
      const compiled = fixture.debugElement.nativeElement;
      expect(compiled.querySelector('#instructor_name').textContent)
        .toContain('instructor');
    });
  });

  it('about', () => {
    component.openAbout();
    expect(mat_dialog_spy.open).toHaveBeenCalled();
    expect(mat_dialog_spy.open).toHaveBeenCalledWith(AboutComponent);
  });
});
