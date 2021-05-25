import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { asyncData, FAKE_COMMON_DICTIONARY, Spied } from 'src/testing';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CategorySelectComponent } from './category-select.component';

describe('CategorySelectComponent', () => {
  let component: CategorySelectComponent;
  let fixture: ComponentFixture<CategorySelectComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    const commonDictionaryService_spy = jasmine.createSpyObj(
      'CommonDictionaryService',
      ['getJSON']
    ) as Spied<CommonDictionaryService>;
    commonDictionaryService_spy.getJSON.and.returnValue(
      asyncData(FAKE_COMMON_DICTIONARY)
    );

    await TestBed.configureTestingModule({
      declarations: [CategorySelectComponent],
      imports: [HttpClientTestingModule, MatMenuModule],
      providers: [
        {
          provide: CommonDictionaryService,
          useValue: commonDictionaryService_spy,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CategorySelectComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  it('should create', () => {
    return expect(component).toBeTruthy();
  });

  it('selectCategory', () =>
    fixture.whenStable().then(async () => {
      component.selectCategory({ label: 'Insurection', help: '' });
      void expect(component.selectedCategory.label).toBe('Insurection');
      await loader.getHarness(MatMenuHarness);
      component.selectCategory({ name: 'foo', label: 'foobar', help: '' });
      void expect(component.selectedCategory.label).toBe('foobar');
    }));
  it('selectCluster', () =>
    fixture.whenStable().then(() => {
      component.selectCluster({ name: 'foo', label: 'foobar', help: '' });
      void expect(component.selectedCategory.label).toBe('foobar');
    }));
});
