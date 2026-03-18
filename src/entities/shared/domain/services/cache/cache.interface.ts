export interface ISaveCacheBase {
  key: string;
  value: unknown;
  ttl?: number;
}

export interface IUpdateCacheBase extends Omit<ISaveCacheBase, "ttl"> {}
