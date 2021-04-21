import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { CommonDictionary, Entry, ICluster } from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';

@Component({
  selector: 'app-category-select',
  templateUrl: './category-select.component.html',
  styleUrls: ['./category-select.component.css'],
})
export class CategorySelectComponent implements OnInit {
  @Input() selectedCategory: Entry;
  @Output() selectedCategoryChange = new EventEmitter<Entry>();
  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;
  data: CommonDictionary;
  constructor(private _dictionary: CommonDictionaryService) {}

  ngOnInit(): void {
    this.getData();
  }

  getData(): void {
    this._dictionary.getJSON().subscribe((data) => {
      this.data = data;
    });
  }

  selectCategory(cat: Entry): void {
    this.selectedCategory = cat;
    this.selectedCategoryChange.emit(this.selectedCategory);
    this.menuTrigger?.closeMenu();
  }
  selectCluster(menuItem: ICluster): void {
    this.selectedCategory = menuItem;
    this.selectedCategoryChange.emit(this.selectedCategory);
  }
}
