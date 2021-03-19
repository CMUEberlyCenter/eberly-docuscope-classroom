import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { asyncData, FAKE_COMMON_DICTIONARY } from 'src/testing';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CategorySelectComponent } from './category-select.component';

describe('CategorySelectComponent', () => {
  let component: CategorySelectComponent;
  let fixture: ComponentFixture<CategorySelectComponent>;

  beforeEach(async () => {
    const commonDictionaryService_spy = jasmine.createSpyObj(
      'CommonDictionaryService',
      ['getJSON']
    );
    commonDictionaryService_spy.getJSON.and.returnValue(
      asyncData(FAKE_COMMON_DICTIONARY)
    );

    await TestBed.configureTestingModule({
      declarations: [CategorySelectComponent],
      imports: [HttpClientTestingModule],
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('selectCategory', () => fixture.whenStable().then(() =>{
    component.selectCategory({label: 'Insurection', help: ''});
    expect(component.selectedCategory.label).toBe('Insurection');
    component.selectCategory({name: 'foo', label:'foobar', help:''});
    expect(component.selectedCategory.label).toBe('foobar');
  }));
  it('selectCluster', () => fixture.whenStable().then(() =>{
    component.selectCluster({name: 'foo', label:'foobar', help:''});
    expect(component.selectedCategory.label).toBe('foobar');
  }));
});
