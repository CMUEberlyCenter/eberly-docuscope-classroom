export interface Entry {
  label: string;
  help: string;
}
export interface ICluster extends Entry {
  name: string;
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
export class CommonDictionary implements ICommonDictionary {
  default_dict: string;
  custom_dict: string;
  use_default_dict: boolean;
  timestamp: string;
  categories: ICategory[];

  #memoCluster = new Map<string, Category>();

  constructor(data: ICommonDictionary) {
    Object.assign(this, data);
  }

  genCluster(category: string): Category {
    for (const cat of this.categories) {
      if (cat.label === category) {
        const clusters = cat.subcategories.reduce(
          (acc: ICluster[], sub: ISubcategory) => acc.concat(sub.clusters), []);
        return { clusters, help: cat.help, label: cat.label};
      }
      for (const sub of cat.subcategories) {
        if (sub.label === category) {
          return { label: sub.label, help: sub.help, clusters: sub.clusters };
        }
        for (const cluster of sub.clusters) {
          if (cluster.name === category) {
            return { label: cluster.label, help: cluster.help, clusters: [cluster] };
          }
        }
      }
    }
  }
  getCluster(category: string): Category {
    if (!this.#memoCluster.has(category)) {
      this.#memoCluster.set(category, this.genCluster(category));
    }
    return this.#memoCluster.get(category);
  }

  get tree() {
    //let id = 0;
    return this.categories.map((category: ICategory) => ({
      label: category.label,
      //id: id++,
      help: category.help,
      children: category.subcategories.map((subcategory: ISubcategory) => ({
        label: subcategory.label,
        //id: id++,
        help: subcategory.help,
        children: subcategory.clusters.map((cluster: ICluster) => ({
          label: cluster.label,
          id: cluster.name,
          //id: id++,
          help: cluster.help,
          // hasChildren: true
        }))
      }))
    }));
  }
  /* getClusters(category: string): ICluster[] {
    const ret: ICluster[] = [];
    for (const cat of this.categories) {
      for (const sub of cat.subcategories) {
        for (const cluster of sub.clusters) {
          if (cat.label === category || sub.label === category || cluster.name === category) {
            ret.push(cluster);
          }
        }
      }
    }
    return ret;
  } */
}
