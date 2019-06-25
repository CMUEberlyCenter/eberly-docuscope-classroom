import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatIconModule } from '@angular/material';
import { MatDialogRef } from '@angular/material/dialog';

import { AboutDialog } from './about.component';

describe('AboutDialog', () => {
  let component: AboutDialog;
  let fixture: ComponentFixture<AboutDialog>;

  beforeEach(async(() => {
    const mat_dialog_spy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      declarations: [ AboutDialog ],
      imports: [ MatDialogModule, MatIconModule ],
      providers: [
        { provide: MatDialogRef, useValue: mat_dialog_spy }
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
