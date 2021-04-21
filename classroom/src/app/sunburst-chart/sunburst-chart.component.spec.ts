import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SunburstChartComponent } from './sunburst-chart.component';

describe('SunburstChartComponent', () => {
  let component: SunburstChartComponent;
  let fixture: ComponentFixture<SunburstChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SunburstChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SunburstChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    component.ngOnChanges();
  });

  it('setting data', () => {
    component.data = {
      name: 'root',
      children: [
        {
          name: 'category',
          children: [
            {
              name: 'subcategory',
              children: [
                { name: 'cluster', children: [{ name: 'pat', value: 1 }] },
              ],
            },
          ],
        },
        { name: 'sub2', value: 2 },
      ],
    };
    component.ngOnChanges();
    expect(component).toBeTruthy();

    component.clicked(null, null);
    component.clicked(null, component.root);
    const leaf = component.root.find((n) => n.data.name === 'cluster');
    component.clicked(null, leaf);
    const pat = component.root.find((n) => n.data.name === 'pat');
    component.clicked(null, pat);
    fixture.detectChanges();
  });
});
