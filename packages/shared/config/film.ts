export const SITE_TYPE = {
  T0_XML: 0,
  T1_JSON: 1,
  T4_DRPYJS0: 2,
  T4_DRPYS: 6,
  T3_DRPY: 7,
  T4_CATVOD: 8,
  T3_XBPQ: 9,
  T3_XYQ: 10,
  T3_APPYSV2: 11,
  T3_PY: 12,
  T3_ALIST: 13,
  T3_CATOPEN: 14,
  T3_APPGET: 15,
  T3_APPQI: 16,
  T3_APPFOX: 17,
} as const;
import { LOG_MODULE } from './logger';

export type ISiteType = (typeof SITE_TYPE)[keyof typeof SITE_TYPE];
export const siteTypes = Object.values(SITE_TYPE);

export const SITE_LOGGER_MAP = {
  [SITE_TYPE.T0_XML]: `${LOG_MODULE.FILM_CMS}<t0_xml>`,
  [SITE_TYPE.T1_JSON]: `${LOG_MODULE.FILM_CMS}<t1_json>`,
  [SITE_TYPE.T4_DRPYJS0]: `${LOG_MODULE.FILM_CMS}<t4_drpyjs0>`,
  [SITE_TYPE.T4_DRPYS]: `${LOG_MODULE.PLUGIN}<drpy-node>`,
  [SITE_TYPE.T3_DRPY]: `${LOG_MODULE.FILM_CMS}<t3_drpy>`,
  [SITE_TYPE.T4_CATVOD]: `${LOG_MODULE.PLUGIN}<cat_vod_nodejs_fastify>`,
  [SITE_TYPE.T3_XBPQ]: `${LOG_MODULE.FILM_CMS}<t3_xbpq>`,
  [SITE_TYPE.T3_XYQ]: `${LOG_MODULE.FILM_CMS}<t3_xyq>`,
  [SITE_TYPE.T3_APPYSV2]: `${LOG_MODULE.FILM_CMS}<t3_appysv2>`,
  [SITE_TYPE.T3_PY]: `${LOG_MODULE.FILM_CMS}<t3_py>`,
  [SITE_TYPE.T3_CATOPEN]: `${LOG_MODULE.FILM_CMS}<t3_catopen>`,
  [SITE_TYPE.T3_ALIST]: `${LOG_MODULE.FILM_CMS}<t3_alist>`,
  [SITE_TYPE.T3_APPGET]: `${LOG_MODULE.FILM_CMS}<t3_appget>`,
  [SITE_TYPE.T3_APPQI]: `${LOG_MODULE.FILM_CMS}<t3_appqi>`,
  [SITE_TYPE.T3_APPFOX]: `${LOG_MODULE.FILM_CMS}<t3_appfox>`,
};

export const SITE_API_MAP = {
  [SITE_TYPE.T0_XML]: '',
  [SITE_TYPE.T1_JSON]: '',
  [SITE_TYPE.T4_DRPYJS0]: '',
  [SITE_TYPE.T4_DRPYS]: '',
  [SITE_TYPE.T3_DRPY]: './drpy.min.js',
  [SITE_TYPE.T4_CATVOD]: '',
  [SITE_TYPE.T3_XBPQ]: 'csp_XBPQ',
  [SITE_TYPE.T3_XYQ]: 'csp_XYQHiker',
  [SITE_TYPE.T3_APPYSV2]: 'csp_AppYsV2',
  [SITE_TYPE.T3_PY]: '',
  [SITE_TYPE.T3_ALIST]: 'csp_Alist',
  [SITE_TYPE.T3_CATOPEN]: '',
  [SITE_TYPE.T3_APPGET]: 'csp_AppGet',
  [SITE_TYPE.T3_APPQI]: 'csp_AppQi',
  [SITE_TYPE.T3_APPFOX]: 'csp_AppFox',
};
