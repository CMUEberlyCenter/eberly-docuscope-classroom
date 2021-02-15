import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonDictionary, Entry, ICluster } from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';

@Component({
  selector: 'app-category-select',
  templateUrl: './category-select.component.html',
  styleUrls: ['./category-select.component.css'],
})
export class CategorySelectComponent implements OnInit {
  @Input() selectedCategory: string;
  @Output() selectedCategoryChange = new EventEmitter<string>();
  data: CommonDictionary;
  constructor(
    private _dictionary: CommonDictionaryService,
  ) { }

  ngOnInit(): void {
    this.getData();
  }

  getData(): void {
    this._dictionary.getJSON().subscribe(data => {
      this.data = data;
    });
  }

  selectCategory(cat: Entry) {
    this.selectedCategory = cat.label; // this.data.getCluster(cat.label);
    // const clusters = this.data.getCluster(cat.label);
    this.selectedCategoryChange.emit(this.selectedCategory);
  }
  selectCluster(menuItem: ICluster) {
    this.selectedCategory = menuItem.name; // this.data.getCluster(menuItem.name);
    this.selectedCategoryChange.emit(this.selectedCategory);
  }
}
