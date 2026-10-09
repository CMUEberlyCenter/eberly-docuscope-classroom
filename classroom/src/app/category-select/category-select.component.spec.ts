import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component, provideZoneChangeDetection, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { FAKE_COMMON_DICTIONARY } from '../../testing';
import { CategorySelectComponent } from './category-select.component';

@Component({
  selector: 'app-fake-category-select-component',
  template: `<app-category-select [dictionary]="dictionary">
  </app-category-select>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [CategorySelectComponent],
})
class TestCategorySelectComponent {
  @ViewChild(CategorySelectComponent)
  public select!: CategorySelectComponent;
  dictionary = FAKE_COMMON_DICTIONARY;
}

describe('CategorySelectComponent', () => {
  let component: TestCategorySelectComponent;
  let fixture: ComponentFixture<TestCategorySelectComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestCategorySelectComponent, MatMenuModule],
      providers: [
        provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true}),
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TestCategorySelectComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  it('should create', () => {
    return expect(component).toBeTruthy();
  });

  it('selectCategory', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    component.select.selectCategory({ label: 'Insurection', help: '' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    void expect(component.select.selectedCategory()?.label).toBe('Insurection');
    await loader.getHarness(MatMenuHarness);
    component.select.selectCategory({
      name: 'foo',
      label: 'foobar',
      help: '',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    void expect(component.select.selectedCategory()?.label).toBe('foobar');
  });
  it('selectCluster', () =>
    fixture.whenStable().then(() => {
      component.select.selectCluster({
        name: 'foo',
        label: 'foobar',
        help: '',
      });
      void expect(component.select.selectedCategory()?.label).toBe('foobar');
    }));
});
