export interface Entry {
  name?: string;
  label: string;
  help: string;
  path?: string;
  depth?: number;
}
export interface ICluster {
  name: string;
  label: string;
  help: string;
  path?: string;
  depth?: number;
}
export interface Category extends Entry {
  clusters: ICluster[];
}
interface ISubcategory extends Entry {
  clusters: ICluster[];
}
interface ICategory extends Entry {
  subcategories: ISubcategory[];
}
export interface ICommonDictionary {
  default_dict: string;
  custom_dict: string;
  use_default_dict: boolean;
  timestamp: string;
  categories: ICategory[];
}

export interface CommonDictionaryTreeNode {
  id: string;
  label: string;
  help: string;
  children?: CommonDictionaryTreeNode[];
}

export class CommonDictionary implements ICommonDictionary {
  default_dict!: string;
  custom_dict!: string;
  use_default_dict!: boolean;
  timestamp!: string;
  categories!: ICategory[];

  constructor(data: ICommonDictionary) {
    Object.assign(this, data);
    for (const category of this.categories) {
      category.path = category.label;
      category.depth = 0;
      for (const subcategory of category.subcategories) {
        subcategory.depth = 1;
        subcategory.path = `${category.path} > ${subcategory.label}`;
        for (const cluster of subcategory.clusters) {
          cluster.depth = 2;
          cluster.path = `${subcategory.path} > ${cluster.label}`;
        }
      }
    }
  }

  get tree(): CommonDictionaryTreeNode[] {
    //let id = 0;
    return this.categories.map((category: ICategory) => ({
      id: category.name ?? category.label,
      label: category.label,
      //id: id++,
      help: category.help,
      children: category.subcategories.map((subcategory: ISubcategory) => ({
        label: subcategory.label,
        id: subcategory.name ?? subcategory.label,
        //id: id++,
        help: subcategory.help,
        children: subcategory.clusters.map((cluster: ICluster) => ({
          label: cluster.label,
          id: cluster.name,
          //id: id++,
          help: cluster.help,
          // hasChildren: true
        })),
      })),
    }));
  }

  get nodes(): Entry[] {
    const nodes: Entry[] = this.categories.reduce(
      (acc, cat) => [
        ...acc,
        cat,
        ...cat.subcategories.reduce(
          (sa, sub) => [...sa, sub, ...sub.clusters],
          [] as Entry[]
        ),
      ],
      [] as Entry[]
    );
    return nodes;
  }
}
