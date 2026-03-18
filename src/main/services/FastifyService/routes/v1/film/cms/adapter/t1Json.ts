import { request } from '@main/utils/request';
import type { ICmsParams, ICmsResultPromise, IConstructorOptions } from '@shared/types/cms';
import { JSONPath } from 'jsonpath-plus';

class T1JsonAdapter {
  private api: string = '';
  private playUrl: string = '';
  private categories: string[] = [];

  constructor(source: IConstructorOptions) {
    this.api = source.api!;
    this.playUrl = source.playUrl || '';
    this.categories = source.categories;
  }

  async init(): ICmsResultPromise['init'] {}

  async home(): ICmsResultPromise['home'] {
    let resp;
    try {
      const { data } = await request.request({
        url: this.api,
        method: 'GET',
        params: { ac: 'class' },
      });
      resp = data;
    } catch {
      const { data } = await request.request({
        url: this.api,
        method: 'GET',
      });
      resp = data;
    }

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

    const filters = {};

    return { class: classes, filters };
  }

  async homeVod(): ICmsResultPromise['homeVod'] {
    let resp;
    try {
      const { data } = await request.request({
        url: this.api,
        method: 'GET',
        params: { ac: 'class' },
      });
      resp = data;
    } catch {
      const { data } = await request.request({
        url: this.api,
        method: 'GET',
      });
      resp = data;
    }

    const rawList = Array.isArray(resp?.list) ? resp.list : [];
    if (rawList.length && !rawList[0]?.vod_pic) {
      const ids = rawList
        .map((v) => String(v.vod_id))
        .filter(Boolean)
        .join(',');
      if (ids.length) resp.list = (await this.detail({ ids })).list;
    }

    const videos = (Array.isArray(resp?.list) ? resp.list : [])
      .map((v) => ({
        vod_id: String(v.vod_id ?? ''),
        vod_name: v.vod_name ?? '',
        vod_pic: v.vod_pic ?? '',
        vod_remarks: v.vod_remarks ?? '',
        vod_blurb: (v.vod_blurb ?? '')?.trim(),
        vod_tag: 'file',
      }))
      .filter((v) => v.vod_id);

    const pagecurrent = Number(resp?.page) || 1;
    const pagecount = Number(resp?.pagecount) || 0;
    const total = Number(resp?.total) || 0;

    return { page: pagecurrent, pagecount, total, list: videos };
  }

  async category(doc: ICmsParams['category']): ICmsResultPromise['category'] {
    const { page = 1, tid } = doc || {};

    const { data: resp } = await request.request({
      url: this.api,
      method: 'GET',
      params: { ac: 'videolist', t: tid, pg: page },
    });

    const rawList = Array.isArray(resp?.list) ? resp.list : [];
    const videos = rawList
      .map((v) => ({
        vod_id: String(v.vod_id ?? ''),
        vod_name: v.vod_name ?? '',
        vod_pic: v.vod_pic ?? '',
        vod_remarks: v.vod_remarks ?? '',
        vod_blurb: (v.vod_blurb ?? '')?.trim(),
        vod_tag: 'file',
      }))
      .filter((v) => v.vod_id);

    const pagecurrent = Number(resp?.page) || page;
    const pagecount = Number(resp?.pagecount) || 0;
    const total = Number(resp?.total) || 0;

    return { page: pagecurrent, pagecount, total, list: videos };
  }

  async detail(doc: ICmsParams['detail']): ICmsResultPromise['detail'] {
    const { ids } = doc || {};
    const idsArray = ids.split(',');

    const { data: resp } = await request.request({
      url: this.api,
      method: 'GET',
      params: { ac: 'detail', ids },
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
    const pagecount = Number(resp?.pagecount) || 0;
    const total = Number(resp?.total) || 0;

    return { page: pagecurrent, pagecount, total, list: videos };
  }

  async search(doc: ICmsParams['search']): ICmsResultPromise['search'] {
    const { wd, page = 1 } = doc || {};

    const { data: resp } = await request.request({
      url: this.api,
      method: 'GET',
      params: { ac: 'videolist', wd, pg: page },
    });

    const rawList = Array.isArray(resp?.list) ? resp.list : [];
    if (rawList.length && !rawList[0]?.vod_pic) {
      const ids = rawList
        .map((v) => String(v.vod_id))
        .filter(Boolean)
        .join(',');
      if (ids.length) resp.list.video = (await this.detail({ ids })).list;
    }

    const videos = (Array.isArray(resp?.list) ? resp.list : [])
      .map((v) => ({
        vod_id: String(v.vod_id ?? ''),
        vod_name: v.vod_name ?? '',
        vod_pic: v.vod_pic ?? '',
        vod_remarks: v.vod_remarks ?? '',
        vod_blurb: (v.vod_blurb ?? '')?.trim(),
        vod_tag: 'file',
      }))
      .filter((v) => v.vod_id);

    const pagecurrent = Number(resp?.page) || page;
    const pagecount = Number(resp?.pagecount) || 0;
    const total = Number(resp?.total) || 0;

    return { page: pagecurrent, pagecount, total, list: videos };
  }

  async play(doc: ICmsParams['play']): ICmsResultPromise['play'] {
    const { play } = doc || {};
    const parseUrl = this.playUrl || '';

    if (/\.(?:m3u8|mp4|mpd|flv|mkv)/.test(play)) {
      return { parse: 0, url: play };
    } else {
      if (parseUrl.startsWith('json:')) {
        const purl = parseUrl.replace('json:', '') + play;
        const { data: resp } = await request.request({
          url: purl,
          method: 'GET',
        });

        try {
          const queryResult = JSONPath({ path: '$.url', json: resp });
          return { parse: 0, url: queryResult };
        } catch {
          return { parse: 1, url: play };
        }
      } else {
        return { parse: 1, url: parseUrl + play };
      }
    }
  }

  async action(_doc: ICmsParams['action']): ICmsResultPromise['action'] {
    return '';
  }

  async proxy(_doc: ICmsParams['proxy']): ICmsResultPromise['proxy'] {
    return [];
  }

  async runMain(_doc: ICmsParams['runMain']): ICmsResultPromise['runMain'] {
    return '';
  }
}

export default T1JsonAdapter;
