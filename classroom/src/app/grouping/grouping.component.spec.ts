import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { asyncData, Spied } from '../../testing';
import { AssignmentService } from '../assignment.service';
import { CorpusService } from '../corpus.service';
import { GroupingComponent } from './grouping.component';
import { GroupsService } from './groups.service';

class DragDropEventFactory<T> {
  createInContainerEvent(
    containerId: string,
    data: T[],
    fromIndex: number,
    toIndex: number
  ): CdkDragDrop<T[], T[]> {
    const event = this.createEvent(fromIndex, toIndex);
    const container = { id: containerId, data };
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
      dropPoint: { x: 0, y: 0 },
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
    const container = { id: model.id, data: model.data };
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
  let corpus_service_spy: Spied<CorpusService>;
  let groups_data_service_spy: Spied<GroupsService>;
  let ngx_spinner_service_spy: Spied<NgxUiLoaderService>;
  let snack_spy: Spied<MatSnackBar>;
  const test_corpus = ['a', 'b', 'c', 'd', 'e', 'f'];

  beforeEach(
    waitForAsync(() => {
      corpus_service_spy = jasmine.createSpyObj('CorpusService', [
        'getCorpus',
      ]) as Spied<CorpusService>;
      corpus_service_spy.getCorpus.and.returnValue(asyncData([]));
      groups_data_service_spy = jasmine.createSpyObj('GroupsService', [
        'getGroupsData',
      ]) as Spied<GroupsService>;
      groups_data_service_spy.getGroupsData.and.returnValue(
        asyncData({ groups: [] })
      );
      ngx_spinner_service_spy = jasmine.createSpyObj('NgxUiLoaderService', [
        'start',
        'stop',
      ]) as Spied<NgxUiLoaderService>;
      snack_spy = jasmine.createSpyObj('MatSnackBar', [
        'open',
      ]) as Spied<MatSnackBar>;
      const assignment_spy = jasmine.createSpyObj('AssignemntService', [
        'setAssignmentData',
      ]) as Spied<AssignmentService>;

      void TestBed.configureTestingModule({
        declarations: [GroupingComponent],
        imports: [
          DragDropModule,
          FormsModule,
          MatCardModule,
          MatInputModule,
          MatFormFieldModule,
          MatSidenavModule,
          MatSnackBarModule,
          NoopAnimationsModule,
        ],
        providers: [
          { provide: AssignmentService, useValue: assignment_spy },
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

  it('should create', async () => {
    void expect(component).toBeTruthy();
    await fixture.whenStable();
    void expect(corpus_service_spy.getCorpus).toHaveBeenCalled();
  });

  it('getGroupsData', async () => {
    component.getGroupsData();
    await fixture.whenStable();
    void expect(ngx_spinner_service_spy.start).toHaveBeenCalled();
    void expect(ngx_spinner_service_spy.stop).toHaveBeenCalled();
    void expect(groups_data_service_spy.getGroupsData).toHaveBeenCalled();
    void expect(component.absent).toEqual([]);
  });

  it('size_min', () => {
    void expect(component.size_min).toBe(2);
  });
  it('size_max', () => {
    void expect(component.size_max).toBe(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    component.corpus = JSON.parse(JSON.stringify(test_corpus));
    void expect(component.size_max).toBe(3);
    component.corpus = ['a', 'b'];
    void expect(component.size_max).toBe(2);
    component.corpus = [];
    void expect(component.size_max).toEqual(2);
  });
  it('num_documents', async () => {
    await expect(component.num_documents).toBe(0);
    component.corpus = test_corpus;
    await expect(component.num_documents).toBe(6);
  });
  it('generate_groups too low', () => {
    [null, 0, 1].forEach((v) => {
      component.group_size = v;
      component.generate_groups({});
      void expect(snack_spy.open).toHaveBeenCalled();
    });
    component.corpus = test_corpus;
    [null, 0, 1].forEach((v) => {
      component.group_size = v;
      component.generate_groups({});
      void expect(snack_spy.open).toHaveBeenCalled();
    });
  });

  it('generate_groups too high', () => {
    component.corpus = test_corpus;
    [7, 6, 5, 4].forEach((v) => {
      component.group_size = v;
      component.generate_groups({});
      void expect(snack_spy.open).toHaveBeenCalled();
    });
  });

  it('generate_groups', () => {
    component.corpus = test_corpus;
    void expect(component.group_size).toBe(2);
    component.group_size = 2;
    component.generate_groups({});
    return fixture.whenStable().then(() => {
      void expect(ngx_spinner_service_spy.start).toHaveBeenCalled();
      void expect(ngx_spinner_service_spy.stop).toHaveBeenCalled();
      void expect(groups_data_service_spy.getGroupsData).toHaveBeenCalled();
      void expect(component.absent).toEqual([]);
    });
  });

  it('drop', () => {
    const drag_within = dragDropEventFactory.createInContainerEvent(
      'group0',
      ['foo', 'bar', 'baz'],
      1,
      0
    );
    void expect(() => component.drop(drag_within)).not.toThrow();

    const drag_between = dragDropEventFactory.createCrossContainerEvent(
      { id: 'group0', data: ['foo'], index: 0 },
      { id: 'group1', data: ['bar'], index: 0 }
    );
    void expect(() => component.drop(drag_between)).not.toThrow();
  });
});
