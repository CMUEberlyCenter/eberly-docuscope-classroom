import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatIconModule } from '@angular/material';
import { MatDialogRef } from '@angular/material/dialog';

import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  let component: AboutComponent;
  let fixture: ComponentFixture<AboutComponent>;

  beforeEach(async(() => {
    const mat_dialog_spy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      declarations: [ AboutComponent ],
      imports: [ MatDialogModule, MatIconModule ],
      providers: [
        { provide: MatDialogRef, useValue: mat_dialog_spy }
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
