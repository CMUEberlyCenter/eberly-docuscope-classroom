import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { Cluster, CommonDictionary, DictionaryTreeService } from '../dictionary-tree.service';

@Component({
  selector: 'app-category-select',
  templateUrl: './category-select.component.html',
  styleUrls: ['./category-select.component.css'],
})
export class CategorySelectComponent implements OnInit {
  @Input() selectedCategory: string;
  @Output() selectedCategoryChange = new EventEmitter<string>();
  data: CommonDictionary;
  selectedName: string;
  constructor(
    private _dictionary: DictionaryTreeService,
  ) { }

  ngOnInit(): void {
    this.getData();
  }

  getData(): void {
    this._dictionary.getJSON().subscribe(data => {
      this.data = data;
    });
  }

  selectCluster(menuItem: Cluster) {
    console.log(this.selectedCategory);
    this.selectedCategory = menuItem.name;
    this.selectedName = menuItem.label;
    this.selectedCategoryChange.emit(this.selectedCategory);
    console.log(this.selectedCategory);
  }
}
