import { IDBDataItemRequired } from "../../interfaces/db-response.interface";
import { ISaveCacheBase, IUpdateCacheBase } from "./cache.interface";

export interface ICacheService {
  get<T>(key: string): Promise<IDBDataItemRequired<T>>;
  save(data: ISaveCacheBase): Promise<IDBDataItemRequired<{ status: boolean }>>;
  update(
    data: IUpdateCacheBase
  ): Promise<IDBDataItemRequired<{ status: boolean }>>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}
