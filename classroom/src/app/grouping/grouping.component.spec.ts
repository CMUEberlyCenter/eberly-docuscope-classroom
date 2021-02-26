import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { asyncData } from '../../testing';
import { CorpusService } from '../corpus.service';
import { GroupingComponent } from './grouping.component';
import { GroupsService } from './groups.service';

@Component({ selector: 'app-nav', template: '' })
class NavStubComponent {}

class DragDropEventFactory<T> {
  createInContainerEvent(
    containerId: string,
    data: T[],
    fromIndex: number,
    toIndex: number
  ): CdkDragDrop<T[], T[]> {
    const event = this.createEvent(fromIndex, toIndex);
    const container: any = { id: containerId, data };
    event.container = container as CdkDropList<T[]>;
    event.previousContainer = event.container;
    event.item = { data: data[fromIndex] } as CdkDrag<T>;
    return event;
  }

  createCrossContainerEvent(
    from: ContainerModel<T>,
    to: ContainerModel<T>
  ): CdkDragDrop<T[], T[]> {
    const event = this.createEvent(from.index, to.index);
    event.container = this.createContainer(to);
    event.previousContainer = this.createContainer(from);
    event.item = { data: from.data[from.index] } as CdkDrag<T>;
    return event;
  }

  private createEvent(
    previousIndex: number,
    currentIndex: number
  ): CdkDragDrop<T[], T[]> {
    return {
      previousIndex,
      currentIndex,
      item: undefined,
      container: undefined,
      previousContainer: undefined,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
    };
  }

  private createContainer(model: ContainerModel<T>): CdkDropList<T[]> {
    const container: any = { id: model.id, data: model.data };
    return container as CdkDropList<T[]>;
  }
}

interface ContainerModel<T> {
  id: string;
  data: T[];
  index: number;
}

describe('GroupingComponent', () => {
  const dragDropEventFactory = new DragDropEventFactory<string>();
  let component: GroupingComponent;
  let fixture: ComponentFixture<GroupingComponent>;
  let corpus_service_spy;
  let groups_data_service_spy;
  let ngx_spinner_service_spy;
  let snack_spy;
  const test_corpus = ['a', 'b', 'c', 'd', 'e', 'f'];

  beforeEach(
    waitForAsync(() => {
      corpus_service_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
      corpus_service_spy.getCorpus.and.returnValue(asyncData([]));
      groups_data_service_spy = jasmine.createSpyObj('GroupsService', [
        'getGroupsData',
      ]);
      groups_data_service_spy.getGroupsData.and.returnValue(
        asyncData({ groups: [] })
      );
      ngx_spinner_service_spy = jasmine.createSpyObj('NgxUiLoaderService', [
        'start',
        'stop',
      ]);
      snack_spy = jasmine.createSpyObj('MatSnackBar', ['open']);

      TestBed.configureTestingModule({
        declarations: [GroupingComponent, NavStubComponent],
        imports: [
          DragDropModule,
          FormsModule,
          MatCardModule,
          MatFormFieldModule,
          MatSidenavModule,
          MatSnackBarModule,
          NoopAnimationsModule,
        ],
        providers: [
          { provide: CorpusService, useValue: corpus_service_spy },
          { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy },
          { provide: GroupsService, useValue: groups_data_service_spy },
          { provide: MatSnackBar, useValue: snack_spy },
        ],
      }).compileComponents();
    })
  );

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
      expect(groups_data_service_spy.getGroupsData).toHaveBeenCalled();
      expect(component.absent).toEqual([]);
    });
  });

  it('size_min', () => {
    expect(component.size_min).toBe(2);
  });
  it('size_max', () => {
    expect(component.size_max).toBe(2);
    component.corpus = JSON.parse(JSON.stringify(test_corpus));
    expect(component.size_max).toBe(3);
    component.corpus = ['a', 'b'];
    expect(component.size_max).toBe(2);
  });
  it('num_documents', () => {
    expect(component.num_documents).toBe(0);
    component.corpus = test_corpus;
    expect(component.num_documents).toBe(6);
  });
  it('generate_groups too low', () => {
    [null, 0, 1].forEach((v) => {
      component.group_size = v;
      component.generate_groups({});
      expect(snack_spy.open).toHaveBeenCalled();
    });
    component.corpus = test_corpus;
    [null, 0, 1].forEach((v) => {
      component.group_size = v;
      component.generate_groups({});
      expect(snack_spy.open).toHaveBeenCalled();
    });
  });

  it('generate_groups too high', () => {
    component.corpus = test_corpus;
    [7, 6, 5, 4].forEach((v) => {
      component.group_size = v;
      component.generate_groups({});
      expect(snack_spy.open).toHaveBeenCalled();
    });
  });

  it('generate_groups', () => {
    component.corpus = test_corpus;
    expect(component.group_size).toBe(2);
    component.group_size = 2;
    component.generate_groups({});
    return fixture.whenStable().then(() => {
      expect(ngx_spinner_service_spy.start).toHaveBeenCalled();
      expect(ngx_spinner_service_spy.stop).toHaveBeenCalled();
      expect(groups_data_service_spy.getGroupsData).toHaveBeenCalled();
      expect(component.absent).toEqual([]);
    });
  });

  it('drop', () => {
    const drag_within = dragDropEventFactory.createInContainerEvent(
      'group0',
      ['foo', 'bar', 'baz'],
      1,
      0
    );
    expect(() => component.drop(drag_within)).not.toThrow();

    const drag_between = dragDropEventFactory.createCrossContainerEvent(
      { id: 'group0', data: ['foo'], index: 0 },
      { id: 'group1', data: ['bar'], index: 0 }
    );
    expect(() => component.drop(drag_between)).not.toThrow();
  });
});
