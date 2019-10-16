import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import * as drag_drop from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { asyncData } from '../../testing';

import { GroupingComponent } from './grouping.component';
import { CorpusService } from '../corpus.service';
import { BoxplotDataService } from '../boxplot-data.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

class DragDropEventFactory<T> {
   createInContainerEvent(containerId: string, data: T[], fromIndex: number, toIndex: number): CdkDragDrop<T[], T[]> {
      const event = this.createEvent(fromIndex, toIndex);
      const container: any = { id: containerId, data: data };
      event.container = <CdkDropList<T[]>>container;
      event.previousContainer = event.container;
      event.item = <CdkDrag<T>>{ data: data[fromIndex] };
      return event;
   }

   createCrossContainerEvent(from: ContainerModel<T>, to: ContainerModel<T>): CdkDragDrop<T[], T[]> {
      const event = this.createEvent(from.index, to.index);
      event.container = this.createContainer(to);
      event.previousContainer = this.createContainer(from);
      event.item = <CdkDrag<T>>{ data: from.data[from.index] };
      return event;
   }

   private createEvent(previousIndex: number, currentIndex: number): CdkDragDrop<T[], T[]> {
      return {
         previousIndex: previousIndex,
         currentIndex: currentIndex,
         item: undefined,
         container: undefined,
         previousContainer: undefined,
         isPointerOverContainer: true,
         distance: { x: 0, y: 0 }
      };
   }

   private createContainer(model: ContainerModel<T>): CdkDropList<T[]> {
      const container: any = { id: model.id, data: model.data };
      return <CdkDropList<T[]>>container;
   }
}

interface ContainerModel<T> {
   id: string,
   data: T[],
   index: number
}

describe('GroupingComponent', () => {
  const dragDropEventFactory = new DragDropEventFactory<string>();
  let component: GroupingComponent;
  let fixture: ComponentFixture<GroupingComponent>;
  let corpus_service_spy;
  let boxplot_data_service_spy;
  let ngx_spinner_service_spy;

  beforeEach(async(() => {
    corpus_service_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
    corpus_service_spy.getCorpus.and.returnValue(asyncData([]));
    boxplot_data_service_spy = jasmine.createSpyObj('BoxplotDataService', ['getGroupsData']);
    boxplot_data_service_spy.getGroupsData.and.returnValue(asyncData([]));
    ngx_spinner_service_spy = jasmine.createSpyObj('NgxUiLoaderService', ['start', 'stop']);

    TestBed.configureTestingModule({
      declarations: [ GroupingComponent,
                      NavStubComponent ],
      imports: [
        DragDropModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatSidenavModule
      ],
      providers: [
        { provide: CorpusService, useValue: corpus_service_spy },
        { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy },
        { provide: BoxplotDataService, useValue: boxplot_data_service_spy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    return fixture.whenStable().then(() => {
      expect(corpus_service_spy.getCorpus).toHaveBeenCalled();
    });
  });

  it('getGroupsData', () => {
    component.getGroupsData();
    return fixture.whenStable().then(() => {
      expect(ngx_spinner_service_spy.start).toHaveBeenCalled();
      expect(ngx_spinner_service_spy.stop).toHaveBeenCalled();
      expect(boxplot_data_service_spy.getGroupsData).toHaveBeenCalled();
      expect(component.absent).toEqual([]);
    });
  });

  it('generate_groups', () => {
    expect(component.group_size).toBe(2);
    spyOn(window, 'alert');
    component.group_size = 0;
    component.generate_groups({});
    expect(window.alert).toHaveBeenCalled();
    component.group_size = 2;
    component.generate_groups({});
    return fixture.whenStable().then(() => {
      expect(ngx_spinner_service_spy.start).toHaveBeenCalled();
      expect(ngx_spinner_service_spy.stop).toHaveBeenCalled();
      expect(boxplot_data_service_spy.getGroupsData).toHaveBeenCalled();
      expect(component.absent).toEqual([]);
    });
  });

  it('drop', () => {
    const move = spyOnProperty(drag_drop, 'moveItemInArray', 'get').and.callThrough();
    const drag_within = dragDropEventFactory.createInContainerEvent('group0', ['foo', 'bar', 'baz'], 1, 0);
    component.drop(drag_within);
    expect(move).toHaveBeenCalled();
    const transfer = spyOnProperty(drag_drop, 'transferArrayItem', 'get').and.callThrough();
    const drag_between = dragDropEventFactory.createCrossContainerEvent(
      {id: 'group0', data: ['foo'], index: 0},
      {id: 'group1', data: ['bar'], index: 0}
    );
    component.drop(drag_between);
    expect(transfer).toHaveBeenCalled();
  });
});
