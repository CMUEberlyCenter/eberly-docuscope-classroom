import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { asyncData } from '../../testing';

import { HeaderComponent } from './header.component';
import { AssignmentService } from '../assignment.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let service: AssignmentService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HeaderComponent ],
      imports: [
        MatIconModule,
        MatToolbarModule,
        MatTooltipModule,
      ],
      providers: [ AssignmentService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    service = TestBed.get(AssignmentService);
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
});
