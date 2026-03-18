import { request } from '@main/utils/request';
import { buildUrl } from '@shared/modules/headers';
import type { ICmsParams, ICmsResultPromise, IConstructorOptions } from '@shared/types/cms';

class T4CatvodAdapter {
  private api: string = '';
  ext: object = {};
  private categories: string[] = [];

  constructor(source: IConstructorOptions) {
    this.api = source.api!;
    this.categories = source.categories;
  }

  async init(): ICmsResultPromise['init'] {
    await request.request({
      url: buildUrl(this.api, '/init'),
      method: 'POST',
      data: {}, // must have body, but allow empty
    });
  }

  async home(): ICmsResultPromise['home'] {
    const { data: resp } = await request.request({
      url: buildUrl(this.api, '/home'),
      method: 'POST',
      data: {}, // must have body, but allow empty
    });

    const rawClassList = Array.isArray(resp?.class) ? resp.class : [];
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

  async homeVod(): ICmsResultPromise['homeVod'] {
    return { page: 1, pagecount: 0, total: 0, list: [] };
  }

  async category(doc: ICmsParams['category']): ICmsResultPromise['category'] {
    const { page, tid, extend = {} } = doc;

    const { data: resp } = await request.request({
      url: buildUrl(this.api, `/category`),
      method: 'POST',
      data: { id: tid, page, filters: extend },
    });

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

  async detail(doc: ICmsParams['detail']): ICmsResultPromise['detail'] {
    const { ids } = doc || {};
    const idsArray = [ids];

    const { data: resp } = await request.request({
      url: buildUrl(this.api, `/detail`),
      method: 'POST',
      data: { id: ids },
    });

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
        vod_score: String((v.vod_score || v.vod_douban_score) ?? '0.0'),
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

  async search(doc: ICmsParams['search']): ICmsResultPromise['search'] {
    const { wd, page = 1 } = doc || {};

    const { data: resp } = await request.request({
      url: buildUrl(this.api, `/search`),
      method: 'POST',
      data: { wd, pg: page },
    });

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

  async play(doc: ICmsParams['play']): ICmsResultPromise['play'] {
    const { flag, play } = doc;

    const { data: resp } = await request.request({
      url: buildUrl(this.api, `/play`),
      method: 'POST',
      data: { flag, id: play },
    });

    const url = resp?.url?.startsWith('js2p')
      ? (resp.url.match(/\/proxy\/[^/]+\/([^/]+)/) || [])?.[1] || ''
      : resp?.url || '';

    const res = {
      url,
      headers: resp?.header || resp?.headers || {},
    };

    return res;
  }

  async action(doc: ICmsParams['action']): ICmsResultPromise['action'] {
    const { action, value, timeout } = doc || {};
    const { data: resp } = await request.request({
      url: buildUrl(this.api, `/action`),
      method: 'POST',
      data: { action, value },
      ...(timeout && timeout > 0 ? { timeout } : {}),
    });

    return resp;
  }

  async proxy(_doc: ICmsParams['proxy']): ICmsResultPromise['proxy'] {
    return [];
  }

  async runMain(_doc: ICmsParams['runMain']): ICmsResultPromise['runMain'] {
    return '';
  }
}

export default T4CatvodAdapter;
