import { join } from 'node:path';

import { loggerService } from '@logger';
import { APP_PUBLIC_PATH } from '@main/utils/path';
import { request } from '@main/utils/request';
import { SITE_LOGGER_MAP, SITE_TYPE } from '@shared/config/film';
import { isJson, isJsonStr } from '@shared/modules/validate';
import type { ICmsMethodName, ICmsParams, ICmsResultPromise, IConstructorOptions } from '@shared/types/cms';
import JSON5 from 'json5';
import type { Pool } from 'workerpool';
import workerpool from 'workerpool';

const logger = loggerService.withContext(SITE_LOGGER_MAP[SITE_TYPE.T3_CATOPEN]);

type ICmsResultCustom = Omit<Awaited<ICmsResultPromise>, 'play'> & {
  play: Awaited<ICmsResultPromise['play']> & {
    parse_extra?: string;
    js?: string;
    header?: Record<string, any>;
  };
};

class T3CatopenAdapter {
  private id: string = '';
  private ext: string = '';
  private api: string = '';
  private categories: string[] = [];

  private pool: Pool | null = null;

  constructor(source: IConstructorOptions) {
    this.id = source.id;
    this.api = source.api!;
    this.ext = source.ext!;
    this.categories = source.categories;
  }

  public async destroy(): Promise<void> {
    if (this.pool) {
      await this.pool.terminate();
      this.pool = null;
    }
  }

  private async execCtx<T extends ICmsMethodName>(type: T, options?: ICmsParams[T]): Promise<ICmsResultCustom[T]> {
    if (!this.pool) {
      const uri = join(import.meta.dirname, 'film_cms_adapter_t3_catopen_worker.js');
      this.pool = workerpool.pool(uri, {
        workerType: 'process',
        maxWorkers: 1,
        forkOpts: { silent: true },
      });
    }

    const resp = await this.pool.exec('main', [type, options], {
      on(payload) {
        const { type, level, msg } = payload;

        if (type === 'log') {
          const msgType = msg?.type;
          const msgList = msg?.msg ?? [];

          const log =
            msgType === 'single' ? msgList[0] : msgList.map((t: any) => (isJson(t) ? JSON.stringify(t) : t)).join(' ');

          logger[level](log);
        }
      },
    });

    return resp;
  }

  public async init(): ICmsResultPromise['init'] {
    let ext: string = this.ext;

    const { data: code } = await request.request({
      url: this.api,
      method: 'GET',
    });

    if (isJsonStr(ext)) ext = JSON5.parse(ext);

    await this.execCtx('init', {
      id: this.id,
      ext,
      code,
      libPath: join(APP_PUBLIC_PATH, 't3Catopen'),
    });
  }

  public async home(): ICmsResultPromise['home'] {
    const resp = await this.execCtx('home');

    const rawClassList = Array.isArray(resp?.class) ? resp?.class : [];
    const classes = rawClassList
      .map((item) => ({
        type_id: String(item.type_id ?? '').trim(),
        type_name: item.type_name?.toString().trim() ?? '',
      }))
      .filter(
        (item, index, self) =>
          item.type_id &&
          item.type_name &&
          !this.categories?.includes(item.type_name) &&
          self.findIndex((other) => other.type_id === item.type_id) === index,
      );
    const classIds = classes.map((item) => item.type_id);

    const rawFiltersObj = resp?.filters && Object.keys(resp?.filters).length ? resp.filters : {};
    const filters = Object.keys(rawFiltersObj).reduce((acc, key) => {
      if (String(key) && classIds.includes(String(key))) {
        acc[String(key)] = rawFiltersObj[key];
      }
      return acc;
    }, {});

    return { class: classes, filters };
  }

  public async homeVod(): ICmsResultPromise['homeVod'] {
    const resp = await this.execCtx('homeVod');

    const rawList = Array.isArray(resp?.list) ? resp.list : [];
    const videos = rawList
      .map((v) => ({
        vod_id: String(v.vod_id ?? ''),
        vod_name: v.vod_name ?? '',
        vod_pic: v.vod_pic ?? '',
        vod_remarks: v.vod_remarks ?? '',
        vod_blurb: (v.vod_blurb ?? '')?.trim(),
        vod_tag: ['action', 'file', 'folder'].includes(v.vod_tag || 'file') ? v.vod_tag : 'file',
      }))
      .filter((v) => v.vod_id);

    const pagecurrent = Number(resp?.page) || 1;
    const pagecount = Number(resp?.pagecount) || (videos.length ? 1 : 0);
    const total = Number(resp?.total) || videos.length;

    return { page: pagecurrent, pagecount, total, list: videos };
  }

  public async category(doc: ICmsParams['category']): ICmsResultPromise['category'] {
    const { tid, page = 1, extend = {} } = doc || {};
    const resp = await this.execCtx('category', { tid, page, extend });

    const rawList = Array.isArray(resp?.list) ? resp.list : [];
    const videos = rawList
      .map((v) => ({
        vod_id: String(v.vod_id ?? ''),
        vod_name: v.vod_name ?? '',
        vod_pic: v.vod_pic ?? '',
        vod_remarks: v.vod_remarks ?? '',
        vod_blurb: (v.vod_blurb ?? '')?.trim(),
        vod_tag: ['action', 'file', 'folder'].includes(v.vod_tag || 'file') ? v.vod_tag : 'file',
      }))
      .filter((v) => v.vod_id);

    const pagecurrent = Number(resp?.page) || page;
    const pagecount = Number(resp?.pagecount) || (videos.length ? 1 : 0);
    const total = Number(resp?.total) || videos.length;

    return { page: pagecurrent, pagecount, total, list: videos };
  }

  public async detail(doc: ICmsParams['detail']): ICmsResultPromise['detail'] {
    const { ids } = doc || {};
    const resp = await this.execCtx('detail', { ids });

    const idsArray = [ids];
    const rawList = Array.isArray(resp?.list) ? resp.list : [];
    const videos = rawList
      .map((v, i) => ({
        vod_id: String((v.vod_id || idsArray[i]) ?? ''),
        vod_name: v.vod_name ?? '',
        vod_pic: v.vod_pic ?? '',
        vod_remarks: v.vod_remarks ?? '',
        vod_year: String(v.vod_year ?? ''),
        vod_lang: v.vod_lang ?? '',
        vod_area: v.vod_area ?? '',
        vod_score: String(v.vod_score ?? '0.0'),
        vod_state: v.vod_state ?? '', // '正片' | '预告' | '花絮'
        vod_class: v.vod_class ?? '', // '电影' | '电视剧' | '综艺' | '动漫' | '纪录片' | '其他'
        vod_actor: v.vod_actor ?? '',
        vod_director: v.vod_director ?? '',
        vod_content: (v.vod_content ?? '')?.trim(),
        vod_blurb: (v.vod_blurb ?? '')?.trim(),
        vod_play_from: v.vod_play_from ?? '',
        vod_play_url: v.vod_play_url ?? '',
        type_name: v.type_name ?? '',
      }))
      .filter((v) => v.vod_id);

    const pagecurrent = Number(resp?.page) || 1;
    const pagecount = Number(resp?.pagecount) || (videos.length ? 1 : 0);
    const total = Number(resp?.total) || videos.length;

    return { page: pagecurrent, pagecount, total, list: videos };
  }

  public async search(doc: ICmsParams['search']): ICmsResultPromise['search'] {
    const { wd, page = 1 } = doc || {};
    const resp = await this.execCtx('search', { wd, page });

    const rawList = Array.isArray(resp?.list) ? resp.list : [];
    const videos = rawList
      .map((v) => ({
        vod_id: String(v.vod_id ?? ''),
        vod_name: v.vod_name ?? '',
        vod_pic: v.vod_pic ?? '',
        vod_remarks: v.vod_remarks ?? '',
        vod_blurb: (v.vod_blurb ?? '')?.trim(),
        vod_tag: ['action', 'file', 'folder'].includes(v.vod_tag || 'file') ? v.vod_tag : 'file',
      }))
      .filter((v) => v.vod_id);

    const pagecurrent = Number(resp?.page) || page;
    const pagecount = Number(resp?.pagecount) || (videos.length ? 1 : 0);
    const total = Number(resp?.total) || videos.length;

    return { page: pagecurrent, pagecount, total, list: videos };
  }

  public async play(doc: ICmsParams['play']): ICmsResultPromise['play'] {
    const { flag, play } = doc || {};
    const resp = await this.execCtx('play', { flag, play });

    const qs = resp?.parse_extra;
    const scriptObj = qs ? Object.fromEntries(new URLSearchParams(qs)) : {};

    const res = {
      url: resp?.url || '',
      quality: resp.quality || [],
      parse: resp.parse || 0,
      jx: resp.jx || 0,
      headers: resp?.header || resp?.headers || {},
      script: Object.keys(scriptObj).length
        ? {
            ...(resp.js ? { runScript: resp.js } : {}),
            ...(scriptObj.init_script ? { initScript: scriptObj.init_script } : {}),
            ...(scriptObj.custom_regex ? { customRegex: scriptObj.custom_regex } : {}),
            ...(scriptObj.sniffer_exclude ? { snifferExclude: scriptObj.sniffer_exclude } : {}),
          }
        : {},
    };

    return res;
  }

  async action(doc: ICmsParams['action']): ICmsResultPromise['action'] {
    const { action, value, timeout } = doc || {};
    const resp = await this.execCtx('action', { action, value, timeout });
    return resp;
  }

  async proxy(doc: ICmsParams['proxy']): ICmsResultPromise['proxy'] {
    const resp = await this.execCtx('proxy', doc);
    return resp;
  }

  async runMain(doc: ICmsParams['runMain']): ICmsResultPromise['runMain'] {
    const resp = await this.execCtx('runMain', doc);
    return resp;
  }
}

export default T3CatopenAdapter;
