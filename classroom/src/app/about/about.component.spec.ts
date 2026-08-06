import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { SettingsService } from '../settings.service';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  let component: AboutComponent;
  let fixture: ComponentFixture<AboutComponent>;
  let loader: HarnessLoader;
  const mat_dialog_spy: Mocked<MatDialogRef<AboutComponent>> = {
    close: vi.fn().mockName('MatDialogRef.close'),
  } as unknown as Mocked<MatDialogRef<AboutComponent>>;
  const settings_spy: Mocked<SettingsService> = {
    getSettings: vi
      .fn()
      .mockName('SettingsService.getSettings')
      .mockReturnValue(
        of({
          title: 'DocuScope Classroom',
          institution: 'CMU',
          unit: 100,
          homepage:
            'https://www.cmu.edu/dietrich/english/research/docuscope.html',
          scatter: { width: 400, height: 400 },
          boxplot: { cloud: true },
          stv: { max_clusters: 4 },
        })
      ),
  } as unknown as Mocked<SettingsService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      // imports: [MatDialogModule, MatIconModule],
      providers: [
        { provide: MatDialogRef, useValue: mat_dialog_spy },
        { provide: SettingsService, useValue: settings_spy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AboutComponent);
    //fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    return expect(component).toBeTruthy();
  });

  it('close', async () => {
    const button = await loader.getHarness(MatButtonHarness);
    await button.click();
    return expect(mat_dialog_spy.close).toHaveBeenCalled();
  });
});
