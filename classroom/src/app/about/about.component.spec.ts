import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { asyncData, Spied } from '../../testing';
import { SettingsService } from '../settings.service';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  let component: AboutComponent;
  let fixture: ComponentFixture<AboutComponent>;
  const mat_dialog_spy: Spied<
    MatDialogRef<AboutComponent>
  > = jasmine.createSpyObj('MatDialogRef', ['close']) as Spied<
    MatDialogRef<AboutComponent>
  >;
  const settings_spy: Spied<SettingsService> = jasmine.createSpyObj(
    'SettingsService',
    ['getSettings']
  ) as Spied<SettingsService>;
  settings_spy.getSettings.and.returnValue(
    asyncData({
      title: 'DocuScope Classroom',
      institution: 'CMU',
      unit: 100,
      homepage: 'https://www.cmu.edu/dietrich/english/research/docuscope.html',
      scatter: { width: 400, height: 400 },
      boxplot: { cloud: true },
      stv: { max_clusters: 4 },
    })
  );

  beforeEach(
    waitForAsync(() => {
      return TestBed.configureTestingModule({
        declarations: [AboutComponent],
        imports: [MatDialogModule, MatIconModule],
        providers: [
          { provide: MatDialogRef, useValue: mat_dialog_spy },
          { provide: SettingsService, useValue: settings_spy },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('close', () => {
    component.onNoClick();
    expect(mat_dialog_spy.close).toHaveBeenCalled();
  });
});
