import { dbService } from '@main/services/DbService';
import {
  getActionSchema,
  getCategorySchema,
  getCheckSchema,
  getDetailSchema,
  getHomeSchema,
  getHomeVodSchema,
  getInitchema,
  getPlaySchema,
  getProxySchema,
  getSearchSchema,
} from '@server/schemas/v1/flim/cms';
import { runRetryAsyncFunction } from '@shared/modules/function';
import {
  isArray,
  isArrayEmpty,
  isJsonStr,
  isNil,
  isObject,
  isObjectEmpty,
  isPositiveFiniteNumber,
  isString,
} from '@shared/modules/validate';
import type {
  ICmsAction,
  ICmsCategory,
  ICmsDetail,
  ICmsHome,
  ICmsHomeVod,
  ICmsPlay,
  ICmsProxy,
  ICmsSearch,
} from '@shared/types/cms';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import JSON5 from 'json5';

import { prepare } from './utils/cache';
import { formatEpisode, formatInfoContent } from './utils/cms';

const API_PREFIX = 'film/cms';

const api: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    `/${API_PREFIX}/init`,
    { schema: getInitchema },
    async (req: FastifyRequest<{ Querystring: { uuid: string; force?: boolean } }>) => {
      const { uuid, force = false } = req.query || {};

      try {
        await prepare(uuid, force);
        return { code: 0, msg: 'ok', data: true };
      } catch {
        return { code: -1, msg: 'fail', data: false };
      }
    },
  );

  fastify.get(
    `/${API_PREFIX}/home`,
    { schema: getHomeSchema },
    async (req: FastifyRequest<{ Querystring: { uuid: string } }>) => {
      const { uuid } = req.query || {};

      const adapter = await prepare(uuid);
      const resp = await adapter.home();

      const source = await dbService.site.get(uuid);

      const categories = source.categories
        ? [
            ...new Set(
              source.categories
                .split(/[,，]/)
                .map((c) => c.trim())
                .filter(Boolean),
            ),
          ]
        : [];

      const rawClassList = Array.isArray(resp?.class) ? resp?.class : [];
      const classes = rawClassList
        .filter(
          (item, index, self) =>
            item.type_id &&
            item.type_name &&
            !categories?.includes(item.type_name) &&
            self.findIndex((other) => other.type_id === item.type_id) === index,
        )
        .map((item) => ({
          type_id: String(item.type_id ?? '').trim(),
          type_name: item.type_name?.toString().trim() ?? '',
        }));
      const classIds = classes.map((item) => item.type_id);

      const rawFiltersObj = resp?.filters && Object.keys(resp?.filters).length ? resp.filters : {};
      const filters = Object.keys(rawFiltersObj).reduce((acc, key) => {
        if (String(key) && classIds.includes(String(key))) {
          acc[String(key)] = rawFiltersObj[key];
        }
        return acc;
      }, {});

      const res = { class: classes, filters } as ICmsHome;

      return { code: 0, msg: 'ok', data: res };
    },
  );

  fastify.get(
    `/${API_PREFIX}/homeVod`,
    { schema: getHomeVodSchema },
    async (req: FastifyRequest<{ Querystring: { uuid: string } }>) => {
      const { uuid } = req.query || {};

      const adapter = await prepare(uuid);
      const resp = await adapter.homeVod();

      const videos = (Array.isArray(resp?.list) ? resp.list : [])
        .filter((v) => v.vod_id && v.vod_id !== 'no_data')
        .map((v) => ({
          vod_id: String(v.vod_id ?? ''),
          vod_name: v.vod_name ?? '',
          vod_pic: v.vod_pic ?? '',
          vod_remarks: formatInfoContent(v.vod_remarks ?? ''),
          vod_blurb: formatInfoContent(v.vod_blurb ?? ''),
          vod_tag: ['action', 'file', 'folder'].includes(v.vod_tag || 'file') ? v.vod_tag : 'file',
        }));
      const pagecurrent = Number(resp?.page) || 1;
      const pagecount = Number(resp?.pagecount) || 0;
      const total = Number(resp?.total) || 0;

      const res = { page: pagecurrent, pagecount, total, list: videos } as ICmsHomeVod;

      return { code: 0, msg: 'ok', data: res };
    },
  );

  fastify.get(
    `/${API_PREFIX}/category`,
    { schema: getCategorySchema },
    async (
      req: FastifyRequest<{
        Querystring: { uuid: string; tid: string; page?: number; extend?: string };
      }>,
    ) => {
      let { uuid, tid, page = 1, extend: rawExtend = '{}' } = req.query || {};
      if (isString(page)) page = Number.parseInt(page);
      if (!isPositiveFiniteNumber(page)) page = 1;
      const extend = isJsonStr(rawExtend) ? JSON5.parse(rawExtend) : {};

      const adapter = await prepare(uuid);
      const resp = tid === '' ? await adapter.homeVod() : await adapter.category({ tid, page, extend });

      const videos = (Array.isArray(resp?.list) ? resp.list : [])
        .filter((v) => v.vod_id && v.vod_id !== 'no_data')
        .map((v) => ({
          vod_id: String(v.vod_id ?? ''),
          vod_name: v.vod_name ?? '',
          vod_pic: v.vod_pic ?? '',
          vod_remarks: formatInfoContent(v.vod_remarks ?? ''),
          vod_blurb: formatInfoContent(v.vod_blurb ?? ''),
          vod_tag: ['action', 'file', 'folder'].includes(v.vod_tag || 'file') ? v.vod_tag : 'file',
        }));
      const pagecurrent = Number(resp?.page) || page;
      const pagecount = Number(resp?.pagecount) || 0;
      const total = Number(resp?.total) || 0;

      const res = { page: pagecurrent, pagecount, total, list: videos } as ICmsCategory;

      return { code: 0, msg: 'ok', data: res };
    },
  );

  fastify.get(
    `/${API_PREFIX}/detail`,
    { schema: getDetailSchema },
    async (req: FastifyRequest<{ Querystring: { uuid: string; ids: string } }>) => {
      const { uuid, ids } = req.query || {};

      const adapter = await prepare(uuid);
      const resp = await adapter.detail({ ids });

      const videos = (Array.isArray(resp?.list) ? resp.list : [])
        .filter((v) => v.vod_id)
        .map((v) => ({
          vod_id: String(v.vod_id),
          vod_name: v.vod_name ?? '',
          vod_pic: v.vod_pic ?? '',
          vod_remarks: formatInfoContent(v.vod_remarks ?? ''),
          vod_year: formatInfoContent(String(v.vod_year ?? '')),
          vod_lang: formatInfoContent(v.vod_lang ?? ''),
          vod_area: formatInfoContent(v.vod_area ?? ''),
          vod_score: formatInfoContent(String((v.vod_score || v.vod_douban_score) ?? '0.0')),
          vod_state: formatInfoContent(v.vod_state ?? ''), // '正片' | '预告' | '花絮'
          vod_class: formatInfoContent(v.vod_class ?? ''), // '电影' | '电视剧' | '综艺' | '动漫' | '纪录片' | '其他'
          vod_actor: formatInfoContent(v.vod_actor ?? ''),
          vod_director: formatInfoContent(v.vod_director ?? ''),
          vod_content: formatInfoContent(v.vod_content ?? ''),
          vod_blurb: formatInfoContent(v.vod_blurb ?? ''),
          vod_play_from: v.vod_play_from ?? '',
          vod_play_url: v.vod_play_url ?? '',
          vod_episode: formatEpisode(v.vod_play_from, v.vod_play_url) || {},
          type_name: v.type_name ?? '',
        }));
      const pagecurrent = Number(resp?.page) || 1;
      const pagecount = Number(resp?.pagecount) || 0;
      const total = Number(resp?.total) || 0;

      const res = { page: pagecurrent, pagecount, total, list: videos } as ICmsDetail;

      return { code: 0, msg: 'ok', data: res };
    },
  );

  fastify.get(
    `/${API_PREFIX}/search`,
    { schema: getSearchSchema },
    async (req: FastifyRequest<{ Querystring: { uuid: string; wd: string; page?: number } }>) => {
      let { uuid, wd, page = 1 } = req.query || {};
      if (isString(page)) page = Number.parseInt(page);
      if (!isPositiveFiniteNumber(page)) page = 1;

      const adapter = await prepare(uuid);
      const resp = await adapter.search({ wd, page });

      const videos = (Array.isArray(resp?.list) ? resp.list : [])
        .filter((v) => v.vod_id)
        .map((v) => ({
          vod_id: String(v.vod_id ?? ''),
          vod_name: v.vod_name ?? '',
          vod_pic: v.vod_pic ?? '',
          vod_remarks: formatInfoContent(v.vod_remarks ?? ''),
          vod_blurb: formatInfoContent(v.vod_blurb ?? ''),
          vod_tag: ['action', 'file', 'folder'].includes(v.vod_tag || 'file') ? v.vod_tag : 'file',
        }));
      const pagecurrent = Number(resp?.page) || page;
      const pagecount = Number(resp?.pagecount) || 0;
      const total = Number(resp?.total) || 0;

      const res = { page: pagecurrent, pagecount, total, list: videos } as ICmsSearch;

      return { code: 0, msg: 'ok', data: res };
    },
  );

  fastify.get(
    `/${API_PREFIX}/play`,
    { schema: getPlaySchema },
    async (req: FastifyRequest<{ Querystring: { uuid: string; play: string; flag: string } }>) => {
      const { uuid, flag, play } = req.query || {};

      const adapter = await prepare(uuid);
      const resp = await adapter.play({ flag, play });

      const res = {
        url: resp?.url || '',
        quality: isArray(resp?.quality) && !isArrayEmpty(resp.quality) ? resp.quality : [],
        parse: isPositiveFiniteNumber(resp?.parse) ? resp.parse : 0,
        jx: isPositiveFiniteNumber(resp?.jx) ? resp.jx : 0,
        headers: isObject(resp?.headers) && !isObjectEmpty(resp.headers) ? resp.headers : {},
        script: isObject(resp?.script) && !isObjectEmpty(resp.script) ? resp.script : {},
      } as ICmsPlay;

      return { code: 0, msg: 'ok', data: res };
    },
  );

  fastify.get(
    `/${API_PREFIX}/action`,
    { schema: getActionSchema },
    async (
      req: FastifyRequest<{
        Querystring: { uuid: string; action: string; value: string | Record<string, any>; timeout?: number };
      }>,
    ) => {
      const { uuid, action, value, timeout } = req.query || {};

      const adapter = await prepare(uuid);
      const resp = await adapter.action({ action, value, timeout });

      const res = resp as ICmsAction;

      return { code: 0, msg: 'ok', data: res };
    },
  );

  fastify.get(
    `/${API_PREFIX}/proxy`,
    { schema: getProxySchema },
    async (req: FastifyRequest<{ Querystring: { uuid: string; do: string; url: string } & Record<string, any> }>) => {
      const { uuid, ...args } = req.query || {};

      const adapter = await prepare(uuid);
      const resp = await adapter.proxy(args);

      const res = resp as ICmsProxy;

      return { code: 0, msg: 'ok', data: res };
    },
  );

  fastify.get(
    `/${API_PREFIX}/check`,
    { schema: getCheckSchema },
    async (req: FastifyRequest<{ Querystring: { uuid: string } & { type: 'search' | 'simple' | 'complete' } }>) => {
      const { uuid, type } = req.query || {};
      const retry = 3;
      const adapter = await prepare(uuid);

      const checkSearch = async () => {
        await runRetryAsyncFunction(
          async () => {
            const keywords = ['我', '你', '他'];
            const wd = keywords[Math.floor(Math.random() * keywords.length)];
            return await adapter.search({ wd });
          },
          retry,
          (result) => !isNil(result?.list) && !isArrayEmpty(result.list) && result.list[0]?.vod_id !== 'no_data',
        );

        return true;
      };

      const checkMain = async () => {
        const home = await adapter.home();
        if (isNil(home.class) || isArrayEmpty(home.class)) return false;

        let category = await runRetryAsyncFunction(
          async () => {
            const tid = home.class[Math.floor(Math.random() * home.class.length)]?.type_id;
            return await adapter.category({ tid });
          },
          retry,
          (result) => !isNil(result?.list) && !isArrayEmpty(result.list) && result.list[0]?.vod_id !== 'no_data',
        );

        // ignore folder and action type check
        const filteredList = category.list?.filter((item) => !['folder', 'action'].includes(item?.vod_tag)) || [];
        const hasSpecialTags = category.list?.some((item) => ['folder', 'action'].includes(item?.vod_tag));
        if (filteredList.length === 0 && hasSpecialTags) {
          return true;
        } else if (filteredList.length > 0) {
          category = { ...category, list: filteredList };
        }

        const detail = await runRetryAsyncFunction(
          async () => {
            const ids = category.list[Math.floor(Math.random() * category.list.length)]?.vod_id;
            return await adapter.detail({ ids });
          },
          retry,
          (result) =>
            !isNil(result?.list) &&
            !isArrayEmpty(result.list) &&
            !!result.list[0]?.vod_play_url &&
            !!result.list[0]?.vod_play_from,
        );

        const vod_episode = formatEpisode(detail.list[0].vod_play_from, detail.list[0].vod_play_url)!;
        const resPlay = await adapter.play({
          flag: Object.keys(vod_episode)[0] || '',
          play: vod_episode[Object.keys(vod_episode)[0]]?.[0].link || '',
        });
        return !!resPlay?.url;
      };

      const typeCheckMap: Record<string, (() => Promise<boolean>)[]> = {
        search: [checkSearch],
        simple: [checkMain],
        complete: [checkSearch, checkMain],
      };

      const checks = typeCheckMap[type] || [];

      try {
        for (const fn of checks) {
          if (!(await fn())) return { code: 0, msg: 'ok', data: false };
        }
      } catch {
        return { code: 0, msg: 'ok', data: false };
      }

      return { code: 0, msg: 'ok', data: true };
    },
  );
};

export default api;
