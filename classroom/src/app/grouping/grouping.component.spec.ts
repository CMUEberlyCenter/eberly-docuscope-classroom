import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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
    const container = { id: containerId, data } as CdkDropList<T[]>;
    return {
      ...this.createEvent(fromIndex, toIndex),
      container,
      previousContainer: container,
      item: { data: data[fromIndex] } as CdkDrag<T>,
    };
  }

  createCrossContainerEvent(
    from: ContainerModel<T>,
    to: ContainerModel<T>
  ): CdkDragDrop<T[], T[]> {
    return {
      ...this.createEvent(from.index, to.index),
      container: this.createContainer(to),
      previousContainer: this.createContainer(from),
      item: { data: from.data[from.index] } as CdkDrag<T>,
    };
  }

  private createEvent(previousIndex: number, currentIndex: number) {
    return {
      dropPoint: { x: 0, y: 0 },
      previousIndex,
      currentIndex,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
      event: new MouseEvent('dragdrop'),
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
  let snack_spy: Spied<MatSnackBar>;
  const test_corpus = ['a', 'b', 'c', 'd', 'e', 'f'];

  beforeEach(async () => {
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
    snack_spy = jasmine.createSpyObj('MatSnackBar', [
      'open',
    ]) as Spied<MatSnackBar>;
    const assignment_spy = jasmine.createSpyObj('AssignemntService', [
      'setAssignmentData',
    ]) as Spied<AssignmentService>;

    await TestBed.configureTestingModule({
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
        { provide: GroupsService, useValue: groups_data_service_spy },
        { provide: MatSnackBar, useValue: snack_spy },
      ],
    }).compileComponents();
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
    // TODO: check if spinner openned and closed.
    void expect(groups_data_service_spy.getGroupsData).toHaveBeenCalled();
    void expect(component.absent).toEqual([]);
  });

  it('size_min', async () => {
    await expect(component.size_min).toBe(2);
  });
  it('size_max', async () => {
    await expect(component.size_max).toBe(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    component.corpus = JSON.parse(JSON.stringify(test_corpus));
    await expect(component.size_max).toBe(3);
    component.corpus = ['a', 'b'];
    await expect(component.size_max).toBe(2);
    component.corpus = [];
    await expect(component.size_max).toEqual(2);
  });
  it('num_documents', async () => {
    await expect(component.num_documents).toBe(0);
    component.corpus = test_corpus;
    await expect(component.num_documents).toBe(6);
  });
  it('generate_groups too low', async () => {
    for (const v of [null, 0, 1]) {
      component.group_size = v;
      component.generate_groups({});
      await expect(snack_spy.open).toHaveBeenCalled();
    }
    component.corpus = test_corpus;
    for (const v of [null, 0, 1]) {
      component.group_size = v;
      component.generate_groups({});
      await expect(snack_spy.open).toHaveBeenCalled();
    }
  });

  it('generate_groups too high', async () => {
    component.corpus = test_corpus;
    for (const v of [7, 6, 5, 4]) {
      component.group_size = v;
      component.generate_groups({});
      await expect(snack_spy.open).toHaveBeenCalled();
    }
  });

  it('generate_groups', async () => {
    component.corpus = test_corpus;
    await expect(component.group_size).toBe(2);
    component.group_size = 2;
    component.generate_groups({});
    await fixture.whenStable();
    // TODO: check if spinner openned and closed.
    await expect(groups_data_service_spy.getGroupsData).toHaveBeenCalled();
    await expect(component.absent).toEqual([]);
  });

  it('drop', async () => {
    const drag_within = dragDropEventFactory.createInContainerEvent(
      'group0',
      ['foo', 'bar', 'baz'],
      1,
      0
    );
    await expect(() => component.drop(drag_within)).not.toThrow();

    const drag_between = dragDropEventFactory.createCrossContainerEvent(
      { id: 'group0', data: ['foo'], index: 0 },
      { id: 'group1', data: ['bar'], index: 0 }
    );
    await expect(() => component.drop(drag_between)).not.toThrow();
  });
});
