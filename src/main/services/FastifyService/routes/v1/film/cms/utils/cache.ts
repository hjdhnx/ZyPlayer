import { loggerService } from '@logger';
import { dbService } from '@main/services/DbService';
import { SITE_TYPE } from '@shared/config/film';
import { LOG_MODULE } from '@shared/config/logger';
import { hash } from '@shared/modules/crypto';
import LruCache from '@shared/modules/lrucache';
import singleton from '@shared/modules/singleton';
import { isNil, isPositiveFiniteNumber } from '@shared/modules/validate';
import type { ICmsAdapter, ICmsAdapterConstructor } from '@shared/types/cms';

import {
  T0Adapter,
  T1Adapter,
  T3AlistAdapter,
  T3AppYsV2Adapter,
  T3CatopenAdapter,
  T3DrpyAdapter,
  T3PyAdapter,
  T3XbpqAdapter,
  T3XyqAdapter,
  T4CatvodAdapter,
  T4DrpyJs0Adapter,
  T4DrpysAdapter,
} from '../adapter';

const logger = loggerService.withContext(LOG_MODULE.FILM_CMS);

const CMS_ADAPTER_MAP = {
  [SITE_TYPE.T0_XML]: T0Adapter,
  [SITE_TYPE.T1_JSON]: T1Adapter,
  [SITE_TYPE.T4_DRPYJS0]: T4DrpyJs0Adapter,
  [SITE_TYPE.T4_DRPYS]: T4DrpysAdapter,
  [SITE_TYPE.T3_DRPY]: T3DrpyAdapter,
  [SITE_TYPE.T4_CATVOD]: T4CatvodAdapter,
  [SITE_TYPE.T3_XBPQ]: T3XbpqAdapter,
  [SITE_TYPE.T3_XYQ]: T3XyqAdapter,
  [SITE_TYPE.T3_APPYSV2]: T3AppYsV2Adapter,
  [SITE_TYPE.T3_PY]: T3PyAdapter,
  [SITE_TYPE.T3_ALIST]: T3AlistAdapter,
  [SITE_TYPE.T3_CATOPEN]: T3CatopenAdapter,
};

class WorkLruCache<K = string, V = ICmsAdapter> extends LruCache<K, V> {
  put(key: K, value: V): V {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;

      const pool = this.cache.get(firstKey!) as ICmsAdapter;
      pool?.destroy?.();

      this.cache.delete(this.cache.keys().next().value!);
    }
    this.cache.set(key, value);
    return value;
  }

  delete(key: K): boolean {
    if (!this.cache.has(key)) return false;

    const pool = this.cache.get(key!) as ICmsAdapter;
    pool?.destroy?.();

    super.delete(key);
    return true;
  }

  clear(): void {
    const keys = [...this.cache.keys()];
    for (const key of keys) {
      this.delete(key);
    }
  }
}

const CACHE_LIMIT = 10;
const lruCache = new WorkLruCache<string, ICmsAdapter>(CACHE_LIMIT);

export const prepare = async (uuid: string, force: boolean = false): Promise<ICmsAdapter> => {
  if (!uuid) {
    throw new Error('Parameter "uuid" is required');
  }

  const dbResSource = await dbService.site.get(uuid);
  const source = {
    ...dbResSource,
    categories: dbResSource.categories
      ? [
          ...new Set(
            dbResSource.categories
              .split(/[,，]/)
              .map((c) => c.trim())
              .filter(Boolean),
          ),
        ]
      : [],
  };

  const type = source.type;

  if (isNil(type) || !isPositiveFiniteNumber(type) || !Object.hasOwn(CMS_ADAPTER_MAP, type)) {
    throw new Error('Db data type error');
  }

  // Limit: unable to detect network data changes
  const contentStr = JSON.stringify(source);
  const contentHash = hash['md5-32']({ src: contentStr });
  const idHash = `${uuid}:${contentHash}`;

  if (force) lruCache.delete(idHash);

  if (lruCache.has(idHash)) {
    return lruCache.get(idHash)!;
  } else {
    const SingleAdapter = singleton(CMS_ADAPTER_MAP[type]);
    if (SingleAdapter?.prepare) await SingleAdapter.prepare();

    const adapter: ICmsAdapter = new SingleAdapter(source);
    try {
      await adapter.init();
      lruCache.put(idHash, adapter);
      return adapter;
    } catch (error) {
      logger.error(error as Error);

      lruCache.delete(idHash);
      throw new Error(`Cms adapter init failed, cause: ${(error as Error).message}`);
    }
  }
};

export const terminate = async () => {
  const modules = Object.values(CMS_ADAPTER_MAP) as Array<ICmsAdapterConstructor>;
  for (const module of modules) {
    const SingleAdapter = singleton(module);
    if (SingleAdapter?.terminate) await SingleAdapter.terminate();
  }

  lruCache.clear();
};
