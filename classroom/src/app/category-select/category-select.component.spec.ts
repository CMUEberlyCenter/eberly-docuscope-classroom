import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { FAKE_COMMON_DICTIONARY } from 'src/testing';
import { CategorySelectComponent } from './category-select.component';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

@Component({
  selector: 'app-fake-category-select-component',
  template: `<app-category-select [dictionary]="dictionary">
  </app-category-select>`,
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
      declarations: [CategorySelectComponent, TestCategorySelectComponent],
      imports: [MatMenuModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
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

  it('selectCategory', () =>
    fixture.whenStable().then(async () => {
      component.select.selectCategory({ label: 'Insurection', help: '' });
      void expect(component.select.selectedCategory?.label).toBe('Insurection');
      await loader.getHarness(MatMenuHarness);
      component.select.selectCategory({
        name: 'foo',
        label: 'foobar',
        help: '',
      });
      void expect(component.select.selectedCategory?.label).toBe('foobar');
    }));
  it('selectCluster', () =>
    fixture.whenStable().then(() => {
      component.select.selectCluster({
        name: 'foo',
        label: 'foobar',
        help: '',
      });
      void expect(component.select.selectedCategory?.label).toBe('foobar');
    }));
});
