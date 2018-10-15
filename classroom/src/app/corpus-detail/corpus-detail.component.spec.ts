import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CorpusDetailComponent } from './corpus-detail.component';

describe('CorpusDetailComponent', () => {
  let component: CorpusDetailComponent;
  let fixture: ComponentFixture<CorpusDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CorpusDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CorpusDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
