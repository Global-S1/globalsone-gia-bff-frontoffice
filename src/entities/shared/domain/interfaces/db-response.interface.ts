export interface IAppResponse<T> {
  data?: IDBData<T>;
  success: boolean;
  kindMessage?: string;
}

export interface IDBData<T> {
  item?: T;
  items?: T[];
  itemsCounter?: number;
  pagination?: IPagination;
  sorting?: ISorting[];
  search?: string;
  criteria?: object;
}

export interface IPagination {
  page: number;
  size: number;
  totalItems?: number;
  totalPages?: number;
}

export interface ISorting {
  sort: TSort;
  by: string;
}

export type TSort = "asc" | "desc";

export interface IDBDataItemRequired<T> extends IDBData<T> {
  item: T;
}

export interface IDBDataItemsRequired<T> extends IDBData<T> {
  items: T[];
}
