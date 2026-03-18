import { loggerService } from '@main/services/LoggerService';
import type { Catvod, Tvbox, TvboxLiveNewItem, TvboxLiveOldItem } from '@main/types/tvbox';
import { pathExist, readFile } from '@main/utils/file';
import { request } from '@main/utils/request';
import type { IDataImportType, IDataRemoteType } from '@shared/config/data';
import { DATA_COMPLETE_TYPE, DATA_IMPORT_TYPE, DATA_SIMPLE_TYPE } from '@shared/config/data';
import { PROXY_API } from '@shared/config/env';
import { LOG_MODULE } from '@shared/config/logger';
import type { ISettingKey } from '@shared/config/tblSetting';
import { settingKeys, settingList as tblSetting } from '@shared/config/tblSetting';
import { aes, base64, randomUUID } from '@shared/modules/crypto';
import { jsonStrToObj } from '@shared/modules/obj';
import {
  isArray,
  isArrayEmpty,
  isBase64,
  isHttp,
  isJson,
  isJsonStr,
  isNil,
  isObject,
  isObjectEmpty,
  isStrEmpty,
  isString,
  isTimestamp,
  isUUID,
} from '@shared/modules/validate';
import type { IDbStore } from '@shared/types/db';

const logger = loggerService.withContext(LOG_MODULE.DATA_HELPER);

const catvodToStandard = (config: Catvod, baseUrl: string): Partial<IDbStore> => {
  if (isObjectEmpty(config) || !config?.video?.sites?.length) return {};
  const data: Partial<IDbStore> = {};

  const rawList = config.video.sites;
  data.site = rawList.map((item) => {
    const uuid = randomUUID();
    return {
      id: uuid,
      key: item.key ?? uuid,
      name: item.name,
      type: 8,
      api: new URL(item.api, baseUrl).toString(),
      playUrl: '',
      group: 'catvod',
      search: true,
      categories: '',
      ext: '',
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  return data;
};

const tvboxToStandard = (config: Tvbox, baseUrl: string, type: string): Partial<IDbStore> => {
  const data: Partial<IDbStore> = {};

  if (Object.hasOwn(config, 'sites') && isArray(config.sites) && !isArrayEmpty(config.sites)) {
    const formatSiteType = (selectType: string, sourceType: number, api: string): number => {
      if (selectType === 'drpy') return 2;

      const apiMap: Record<string, number> = {
        csp_XBPQ: 9,
        csp_XYQHiker: 10,
        csp_AppYsV2: 11,
        csp_AppGet: 15,
        csp_AppQi: 16,
        csp_AppFox: 17,
      };

      if (api in apiMap) return apiMap[api];

      switch (sourceType) {
        case 0:
          return 0; // cms[xml]
        case 1:
          return 1; // cms[json]
        case 3:
          if (api?.endsWith('.js')) return 7;
          if (api?.endsWith('.py')) return 12;
          break;
        case 4:
          return 6; // hipy[t4]
      }

      return -1;
    };

    const formatSiteGroup = (type: string): string => {
      switch (type) {
        case 'drpy':
          return 'drpy';
        case 'tvbox':
          return 'tvbox';
        default:
          return '';
      }
    };

    const formatSiteSearch = (searchable: 0 | 1, quickSearch: 0 | 1): boolean => {
      if (searchable === 1 || quickSearch === 1) return true;
      return false;
    };

    const formatUrl = (relativeUrl: string, baseUrl: string): string => {
      if (!relativeUrl) return '';
      if (typeof relativeUrl === 'object') return JSON.stringify(relativeUrl);
      if (relativeUrl.startsWith('csp_')) return relativeUrl;
      if (relativeUrl.startsWith('./') || relativeUrl.startsWith('/') || relativeUrl.startsWith('../')) {
        return new URL(relativeUrl, baseUrl).toString();
      }
      return relativeUrl;
    };

    data.site = config.sites
      .filter(
        (item) =>
          [0, 1, 4].includes(item.type) ||
          (item.type === 3 &&
            (['csp_XBPQ', 'csp_XYQHiker'].includes(type) ||
              // ['csp_XBPQ', 'csp_XYQHiker', 'csp_AppGet', 'csp_AppQi', 'csp_AppFox'].includes(type) ||
              item.api.endsWith('.js') ||
              item.api.endsWith('.py'))),
      )
      .map((item) => {
        const uuid = randomUUID();
        return {
          id: uuid,
          key: item.key ?? uuid,
          name: item.name,
          type: formatSiteType(type, item.type, item.api),
          api: formatUrl(item.api, baseUrl),
          playUrl: '',
          group: formatSiteGroup(type),
          search: formatSiteSearch(item.searchable ?? 0, item.quickSearch ?? 0),
          categories: Array.isArray(item.categories) ? item.categories.join(',') : (item.categories ?? ''),
          ext: item.ext ? formatUrl(item.ext, baseUrl) : '',
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      })
      .filter((item) => item.api || item.ext);
  }

  if (Object.hasOwn(config, 'lives') && isArray(config.lives) && !isArrayEmpty(config.lives)) {
    // [
    //   {
    //     name: 'yingshi',
    //     url: 'http://xxx.xx',
    //     type: 0,
    //     epg: 'https://epg.112114.xyz/?ch={name}&date={date}',
    //     logo: 'https://epg.112114.xyz/logo/{name}.png',
    //   },
    //   {
    //     group: 'redirect',
    //     channels: [{ name: 'live', urls: ['proxy://do=live&type=txt&ext=base64'] }],
    //   },
    //   {
    //     group: 'default',
    //     channels: [{ name: 'CCTV-1', urls: ['http://xxx.xxx/0001_1.m3u8', 'http://xxx.xxx/index.m3u8'] }],
    //   },
    // ];

    const iptv: IDbStore['iptv'] = [];
    const channel: Array<{ name: string; api: string; group: string }> = [];

    const isNewLive = (value: TvboxLiveNewItem): value is TvboxLiveNewItem => value.type === 0 && isHttp(value.url);
    const isOldLive = (value: TvboxLiveOldItem): value is TvboxLiveOldItem =>
      isArray(value.channels) && !isArrayEmpty(value.channels);

    const unwrapProxyUrl = (raw: string) => {
      if (!raw.startsWith(PROXY_API)) return raw;
      try {
        const parsed = new URL(raw);
        return parsed.searchParams.get('url') || '';
      } catch {
        return '';
      }
    };

    for (const live of config.lives) {
      if (isNewLive(live as TvboxLiveNewItem)) {
        const { name, url: urlRaw, epg, logo, ua } = live as TvboxLiveNewItem;
        const url = unwrapProxyUrl(urlRaw);
        if (!isHttp(url)) continue;

        const uuid = randomUUID();
        iptv.push({
          id: uuid,
          key: uuid,
          name,
          type: 1,
          api: url,
          epg: epg ?? '',
          logo: logo ?? '',
          headers: ua ? { 'User-Agent': ua } : {},
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } else if (isOldLive(live as TvboxLiveOldItem)) {
        const { group, channels } = live as TvboxLiveOldItem;

        for (const chal of channels) {
          const { name, urls } = chal;

          if (group === 'redirect') {
            const links = urls
              .map((url) => {
                const link = url.split('&ext=')?.[1];
                if (isNil(link)) return null;
                return isBase64(link) ? base64.decode({ src: link }) : null;
              })
              .filter(Boolean) as string[];

            links.forEach((url) => {
              const uuidSub = randomUUID();

              iptv.push({
                id: uuidSub,
                key: uuidSub,
                name,
                type: 1,
                api: url,
                epg: '',
                logo: '',
                headers: {},
                isActive: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            });
          } else {
            urls
              .filter((url) => isHttp(url))
              .forEach((item) => {
                channel.push({
                  name,
                  api: item,
                  group: group ?? '',
                });
              });
          }
        }
      }
    }

    if (channel.length) {
      const m3uArgs = [
        '#EXTM3U',
        ...channel.map(
          (item) => `#EXTINF:-1 tvg-name="${item.name}" group-title="${item.group}",${item.name}\n${item.api}`,
        ),
      ];
      const m3uContent = m3uArgs.join('\n');
      const uuid = randomUUID();

      iptv.push({
        id: uuid,
        key: uuid,
        name: 'Auto Generated M3U',
        type: 3,
        api: m3uContent,
        epg: '',
        logo: '',
        headers: {},
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    data.iptv = iptv;
  }

  if (Object.hasOwn(config, 'parses') && isArray(config.parses) && !isArrayEmpty(config.parses)) {
    const formatSiteType = (type: number = 0): number => {
      switch (type) {
        case 1:
          return 2;
        case 0:
        default:
          return 1;
      }
    };

    data.analyze = config.parses
      .filter((item) => [0, 1].includes(item.type) && item.url)
      .map((item) => {
        const uuid = randomUUID();
        return {
          id: uuid,
          key: uuid,
          name: item.name,
          api: item.url,
          type: formatSiteType(item.type ?? 0),
          flag: item.ext?.flag ?? ['youku', 'qq', 'iqiyi', 'qiyi', 'mgtv', 'imgo', 'letv', 'leshi', 'sohu', 'pptv'],
          script: '',
          headers: {},
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      });
  }

  return data;
};

const tvboxDecryption = (json: string, configKey?: string): string => {
  let content = json;

  try {
    const pattern = /[A-Z0-9]{8}\*\*/i;
    const match = content.match(pattern);

    if (match) {
      content = content.substring(content.indexOf(match[0]) + 10);
      content = base64.decode({ src: content as string });
    }

    if (content.startsWith('2423')) {
      // data
      const dataStartIndex = content.indexOf('2324') + 4;
      const dataEndIndex = content.length - 26;
      const data = content.substring(dataStartIndex, dataEndIndex);

      // content = Buffer.from(AES.toBytes(content)).toString().toLowerCase();
      content = content.toLowerCase();

      // key
      const keyIndexStart = content.indexOf('$#') + 2;
      const keyIndexEnd = content.indexOf('#$');
      const keySub = content.substring(keyIndexStart, keyIndexEnd);
      const key = keySub.padEnd(16, '0');

      // iv
      const ivSub = content.substring(content.length - 13);
      const iv = ivSub.padEnd(16, '0');

      json = aes.decode({ src: data, mode: 'cbc', key, iv });
    } else if (isString(configKey) && !isStrEmpty(configKey) && !isJson(content)) {
      json = aes.decode({ src: content as string, mode: 'ecb', key: configKey! });
    } else {
      json = content;
    }
  } catch {
    // do nothing
  }

  return json;
};

const contentToStandard = (config: IDbStore): Partial<IDbStore> => {
  const data: Partial<IDbStore> = {};

  for (const key in config) {
    switch (key) {
      case 'setting': {
        const newdata = config[key] || {};
        const notStandardKeys = Object.keys(newdata).filter((k) => !settingKeys.includes(k as ISettingKey));
        notStandardKeys.forEach((k) => delete newdata[k]);

        for (const item of tblSetting) {
          if (newdata[item.key] === undefined) {
            newdata[item.key] = item.value as any;
          }
        }

        if (isObject(newdata) && !isObjectEmpty(newdata)) {
          data.setting = newdata;
        }
        break;
      }
      case 'site': {
        const site = (config[key] || [])
          .filter((item) => item?.api || item?.ext)
          .map((item) => {
            const uuid = randomUUID();
            return {
              id: item?.id || uuid,
              key: item?.key || uuid,
              name: item?.name || '',
              type: item?.type || 0,
              api: item?.api || '',
              playUrl: item?.playUrl || '',
              group: item?.group || '',
              search: !!item?.search,
              categories: Array.isArray(item.categories) ? item.categories.join(',') : item.categories,
              ext: item?.ext || '',
              isActive: true,
              createdAt: isTimestamp(item.createdAt) ? item.createdAt : Date.now(),
              updatedAt: isTimestamp(item.updatedAt) ? item.createdAt : Date.now(),
            };
          });
        if (isArray(site) && !isArrayEmpty(site)) data.site = site;
        break;
      }
      case 'iptv': {
        const iptv = (config[key] || [])
          .filter((item) => item.api && [1, 2, 3].includes(item.type))
          .map((item) => {
            const uuid = randomUUID();
            return {
              id: item.id || uuid,
              key: item.key || uuid,
              name: item.name ?? '',
              type: item.type,
              api: item.api,
              epg: item.epg ?? '',
              logo: item.logo ?? '',
              headers: item.headers ?? {},
              isActive: item.isActive ?? true,
              createdAt: isTimestamp(item.createdAt) ? item.createdAt : Date.now(),
              updatedAt: isTimestamp(item.updatedAt) ? item.updatedAt : Date.now(),
            };
          });
        if (isArray(iptv) && !isArrayEmpty(iptv)) data.iptv = iptv;
        break;
      }
      case 'channel': {
        const channel = (config[key] || [])
          .filter((item) => isHttp(item.api))
          .map((item) => {
            const uuid = randomUUID();
            return {
              id: item.id || uuid,
              name: item.name ?? '',
              api: item.api,
              logo: item.logo ?? '',
              group: item.group ?? '',
              playback: item.playback ?? '',
              createdAt: isTimestamp(item.createdAt) ? item.createdAt : Date.now(),
              updatedAt: isTimestamp(item.updatedAt) ? item.updatedAt : Date.now(),
            };
          });
        if (isArray(channel) && !isArrayEmpty(channel)) data.channel = channel;
        break;
      }
      case 'analyze': {
        const analyze = (config[key] || [])
          .filter((item) => isHttp(item.api) && [1, 2].includes(item.type))
          .map((item) => {
            const uuid = randomUUID();
            return {
              id: item.id || uuid,
              key: item.key || uuid,
              name: item.name ?? '',
              api: item.api,
              type: item.type,
              flag: item.flag ?? ['youku', 'qq', 'iqiyi', 'qiyi', 'mgtv', 'imgo', 'letv', 'leshi', 'sohu', 'pptv'],
              headers: item.headers ?? {},
              script: item.script ?? '',
              isActive: true,
              createdAt: isTimestamp(item.createdAt) ? item.createdAt : Date.now(),
              updatedAt: isTimestamp(item.updatedAt) ? item.updatedAt : Date.now(),
            };
          });
        if (isArray(analyze) && !isArrayEmpty(analyze)) data.analyze = analyze;
        break;
      }
      case 'history': {
        const history = (config[key] || [])
          .filter((item) => [1, 2, 3, 4, 5, 6].includes(item.type))
          .map((item) => {
            const uuid = randomUUID();
            return {
              id: item.id || uuid,
              type: item.type,
              relateId: item.relateId,
              siteSource: item.siteSource ?? '',
              playEnd: item.playEnd ?? false,
              videoId: item.videoId ?? '',
              videoImage: item.videoImage ?? '',
              videoName: item.videoName ?? '',
              videoIndex: item.videoIndex ?? '',
              watchTime: item.watchTime ?? 0,
              duration: item.duration ?? 0,
              skipTimeInEnd: item.skipTimeInEnd ?? 0,
              skipTimeInStart: item.skipTimeInStart ?? 0,
              createdAt: isTimestamp(item.createdAt) ? item.createdAt : Date.now(),
              updatedAt: isTimestamp(item.updatedAt) ? item.updatedAt : Date.now(),
            };
          });
        if (isArray(history) && !isArrayEmpty(history)) data.history = history;
        break;
      }
      case 'star': {
        const star = (config[key] || [])
          .filter((item) => item.videoId && item.relateId && [1, 2, 3, 4].includes(item.type))
          .map((item) => {
            const uuid = randomUUID();
            return {
              id: item.id || uuid,
              type: item.type,
              relateId: item.relateId,
              videoId: item.videoId,
              videoImage: item.videoImage ?? '',
              videoName: item.videoName ?? '',
              videoType: item.videoType ?? '',
              videoRemarks: item.videoRemarks ?? '',
              createdAt: isTimestamp(item.createdAt) ? item.createdAt : Date.now(),
              updatedAt: isTimestamp(item.updatedAt) ? item.updatedAt : Date.now(),
            };
          });
        if (isArray(star) && !isArrayEmpty(star)) data.star = star;
        break;
      }
    }
  }

  for (const tableName in data) {
    const list = data[tableName];
    if (isArrayEmpty(list)) continue;

    const uniqueFieldsMap: Record<string, string[]> = {
      site: ['id', 'key'],
      iptv: ['id', 'key'],
      analyze: ['id', 'key'],
      channel: ['id'],
      history: ['id'],
      star: ['id'],
      plugin: ['id'],
      // system: ['key'],
    };

    const uniqueFields = uniqueFieldsMap[tableName] || [];
    // id must be first
    if (uniqueFields.includes('id')) {
      uniqueFields.splice(uniqueFields.indexOf('id'), 1);
      uniqueFields.unshift('id');
    }
    if (uniqueFields.length === 0) continue;

    const fieldSets: Record<string, Set<string>> = {};
    for (const field of uniqueFields) fieldSets[field] = new Set();

    data[tableName] = list.map((item) => {
      const updatedItem: Record<string, any> = { ...item };

      for (const field of uniqueFields) {
        let value = updatedItem[field];

        if (field === 'id') {
          if (!value || !isUUID(value, 4) || fieldSets.id.has(value)) {
            value = randomUUID();
          }
        }

        if (field === 'key') {
          if (!value || fieldSets.key?.has(value)) {
            value = value ? `${value}-${updatedItem.id}` : updatedItem.id;
          }
        }

        fieldSets[field].add(value);
        updatedItem[field] = value;
      }

      return updatedItem;
    });
  }

  return data;
};

/**
 * Convert standard
 * @param importType simple | complete
 * @param remoteType simple: catvod | tvbox | drpy ; complete: local | remote
 * @param path url | file path
 * @returns standard content
 */
export const convertToStandard = async (importType: IDataImportType, remoteType: IDataRemoteType, path: string) => {
  let content: string | Record<string, any> | null = null;
  if (
    importType === DATA_IMPORT_TYPE.SIMPLE ||
    (importType === DATA_IMPORT_TYPE.COMPLETE && remoteType === DATA_COMPLETE_TYPE.REMOTE)
  ) {
    try {
      const { data: resp } = await request.request({ url: path, method: 'GET', responseType: 'text' });
      content = resp;
    } catch (error) {
      logger.error(`Failed fetch ${path} cause of ${(error as Error).message}`);
      content = null;
    }
  } else if (importType === DATA_IMPORT_TYPE.COMPLETE && remoteType === DATA_COMPLETE_TYPE.LOCAL) {
    if (await pathExist(path)) content = await readFile(path);
  }
  if (isNil(content) || isStrEmpty(content)) return {};

  if (importType === DATA_IMPORT_TYPE.SIMPLE && remoteType !== DATA_SIMPLE_TYPE.CATVOD) {
    content = tvboxDecryption(content as string);
  }

  if (isJsonStr(content)) content = jsonStrToObj(content as string);

  let standard: Partial<IDbStore> = {};
  if (importType === DATA_IMPORT_TYPE.SIMPLE) {
    if (remoteType === 'catvod') {
      standard = catvodToStandard(content as Catvod, path);
    } else {
      standard = tvboxToStandard(content as Tvbox, path, remoteType);
    }
  } else if (importType === DATA_IMPORT_TYPE.COMPLETE) {
    standard = content as Partial<IDbStore>;
  }

  const res = contentToStandard(standard);

  return res;
};
