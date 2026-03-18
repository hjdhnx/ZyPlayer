import { request } from '@main/utils/request';
import { base64 } from '@shared/modules/crypto';
import { isJson } from '@shared/modules/validate';
import type { ICmsParams, ICmsResultPromise, IConstructorOptions } from '@shared/types/cms';

class T4ServerAdapter {
  private api: string = '';
  private ext: any = '';
  private categories: string[] = [];

  constructor(source: IConstructorOptions) {
    this.api = source.api!;
    this.ext = source.ext || '';
    this.categories = source.categories;
  }

  async init(): ICmsResultPromise['init'] {}

  async home(): ICmsResultPromise['home'] {
    const { data: resp } = await request.request({
      url: this.api,
      method: 'GET',
      params: { extend: this.ext, filter: true },
    });

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

  async homeVod(): ICmsResultPromise['homeVod'] {
    const { data: resp } = await request.request({
      url: this.api,
      method: 'GET',
      params: { extend: this.ext, filter: true },
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

    const pagecurrent = Number(resp?.page) || 1;
    const pagecount = Number(resp?.pagecount) || (videos.length ? 1 : 0);
    const total = Number(resp?.total) || videos.length;

    return { page: pagecurrent, pagecount, total, list: videos };
  }

  async category(doc: ICmsParams['category']): ICmsResultPromise['category'] {
    const { page = 1, tid, extend = {} } = doc || {};
    const extendStr = JSON.stringify(extend);

    const { data: resp } = await request.request({
      url: this.api,
      method: 'GET',
      params: {
        ac: 'videolist',
        t: tid,
        pg: page,
        ext: base64.encode({ src: extendStr }),
        extend: this.ext,
      },
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
      url: this.api,
      method: 'GET',
      params: { ac: 'detail', ids, extend: this.ext },
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
      url: this.api,
      method: 'GET',
      params: { extend: this.ext, wd, pg: page },
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
    const { flag, play } = doc || {};

    const { data: resp } = await request.request({
      url: this.api,
      method: 'GET',
      params: { extend: this.ext, flag, play },
    });

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
    const { action, value: rawValue, timeout } = doc || {};
    const value = isJson(rawValue) ? JSON.stringify(rawValue) : rawValue;
    const { data: resp } = await request.request({
      url: this.api,
      method: 'GET',
      params: { ac: 'action', action, value },
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

export default T4ServerAdapter;
