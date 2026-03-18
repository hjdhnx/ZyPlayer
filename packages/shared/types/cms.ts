import type {
  CMS_ACTION_SPECIAL_ID_TYPE,
  CMS_ACTION_TYPE,
  ICmsActionButtonType,
  ICmsActionFormType,
  ICmsActionInputType,
  ICmsActionSpecialIdType,
  ICmsActionType,
} from '../config/cmsAction';
import type { IModels } from '../types/db';

export type IConstructorOptions = Omit<IModels['site'], 'categories'> & {
  categories: string[];
};

// input options

export type ICmsInitOptions = unknown;

export type ICmsHomeOptions = void;

export type ICmsHomeVodOptions = void;

export interface ICmsCategoryOptions {
  tid: string;
  page?: number;
  extend?: Record<string, string>;
}

export interface ICmsDetailOptions {
  ids: string;
}

export interface ICmsSearchOptions {
  wd: string;
  page?: number;
  quick?: boolean;
}

export interface ICmsPlayOptions {
  flag: string;
  play: string;
}

export interface ICmsActionOptions {
  action: string;
  value: string | Record<string, any>;
  timeout?: number;
}

export type ICmsProxyOptions = Record<string, string>;

export type ICmsRunMianOptions = Record<string, string>;

export type ICmsDestroyOptions = void;

// output results

export interface ICmsInfoBase {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_blurb: string;
}

export type ICmsInfoBaseWithTag = ICmsInfoBase & {
  vod_tag: 'file' | 'folder' | 'action' | string;
};

export interface ICmsInfoEpisode {
  text: string;
  link: string;
}

export type ICmsInfo = ICmsInfoBase & {
  vod_lang?: string;
  vod_year?: string | number;
  vod_area?: string;
  vod_score?: string;
  vod_state?: string;
  vod_class?: string;
  vod_actor?: string;
  vod_director?: string;
  vod_content?: string;
  vod_douban_id?: string;
  vod_douban_type?: string;
  vod_douban_score?: string;
  type_name?: string;
  vod_play_from: string;
  vod_play_url: string;
  vod_episode?: Record<string, Array<ICmsInfoEpisode>>;
};

export type ICmsInit = void;

export interface ICmsHome {
  class: Array<{
    type_id: string;
    type_name: string;
  }>;
  filters: Record<
    string | number,
    Array<{
      key: string;
      name: string;
      value: Array<{
        n: string;
        v: string;
      }>;
    }>
  >;
}

export interface ICmsHomeVod {
  page?: number;
  pagecount?: number;
  total?: number;
  list: Array<ICmsInfoBaseWithTag>;
}

export interface ICmsCategory {
  page?: number;
  pagecount?: number;
  total?: number;
  list: Array<ICmsInfoBaseWithTag>;
}

export interface ICmsDetail {
  page?: number;
  pagecount?: number;
  total?: number;
  list: Array<ICmsInfo>;
}

export interface ICmsSearch {
  page?: number;
  pagecount?: number;
  total?: number;
  list: Array<ICmsInfoBaseWithTag>;
}

export interface ICmsPlay {
  url: string;
  quality?: Array<string | number>;
  jx?: number;
  parse?: number;
  headers?: Record<string, any>;
  script?: {
    runScript?: string;
    initScript?: string;
    customRegex?: string;
    snifferExclude?: string;
  };
}

export interface ICmsActionCommon {
  actionId: ICmsActionSpecialIdType | string;
  type?: ICmsActionType;
  button?: ICmsActionButtonType | boolean;
  reset?: boolean;
  canceledOnTouchOutside?: boolean;
  title?: string;
  keep?: boolean;

  /** receive only */
  width?: number;
  height?: number;
  dimAmount?: number;
  bottom?: number;

  imageUrl?: string;
  imageHeight?: number;
  imageClickCoord?: boolean;
  qrcode?: string;
  qrcodeSize?: string;

  timeout?: number;
  httpTimeout?: number;

  initAction?: string;
  initValue?: string;
  cancelAction?: string;
  cancelValue?: string;
}

export interface ICmsActionOptionItem {
  name: string;
  action: string;
  selected?: boolean;
}
export type ICmsActionOption = ICmsActionOptionItem[] | string[];

export interface ICmsActionFormField {
  id: string;
  name: string;
  value?: string;
  tip?: string;
  msg?: string;
  column?: number;
  selectData?: string;

  /** receive only */
  selectWidth?: number;
  selectColumn?: number;

  quickSelect?: boolean;
  onlyQuickSelect?: boolean;
  multiSelect?: boolean;
  inputType?: ICmsActionInputType;
  multiLine?: number;
  help?: string;
  validation?: string;

  option?: ICmsActionOption;
  selectedIndex?: number;
}

export interface ICmsActionForm extends ICmsActionCommon, ICmsActionFormField {
  type: ICmsActionFormType;
  input?: ICmsActionFormField[];
}

export type ICmsActionMsgbox =
  | (ICmsActionCommon & {
      type: typeof CMS_ACTION_TYPE.MSGBOX;
      msg: string;
      htmlMsg?: never;
    })
  | (ICmsActionCommon & {
      type: typeof CMS_ACTION_TYPE.MSGBOX;
      msg?: never;
      htmlMsg: string;
    });

export interface ICmsActionHelp extends ICmsActionCommon {
  type: typeof CMS_ACTION_TYPE.HELP;
  data: Record<string, string>;
}

export interface ICmsActionBrowser extends ICmsActionCommon {
  type: typeof CMS_ACTION_TYPE.BROWSER | typeof CMS_ACTION_TYPE.WEBVIEW;
  url: string;
  browserHeight?: number;
  browserWidth?: number;
}

export type ICmsActionBase = ICmsActionForm | ICmsActionMsgbox | ICmsActionHelp | ICmsActionBrowser;

export interface ICmsActionSpecialBase {
  actionId: ICmsActionSpecialIdType;
}

export interface ICmsActionSpecialSelfSearch {
  actionId: typeof CMS_ACTION_SPECIAL_ID_TYPE.SELF_SEARCH;
  skey: string;
  name: string;
  tid: string;
  flag: string;
  folder: string | Array<{ name: string; id: string; flag: string }>;
  msg: string;
}
export interface ICmsActionSpecialDetail extends ICmsActionSpecialBase {
  actionId: typeof CMS_ACTION_SPECIAL_ID_TYPE.DETAIL;
  skey: string;
  ids: string;
}

export interface ICmsActionSpecialKtvPlayer extends ICmsActionSpecialBase {
  actionId: typeof CMS_ACTION_SPECIAL_ID_TYPE.KTVPLAYER;
  name: string;
  id: string;
}

export interface ICmsActionSpecialRefreshList extends ICmsActionSpecialBase {
  actionId: typeof CMS_ACTION_SPECIAL_ID_TYPE.REFRESH_LIST;
  listTab: string;
}

export interface ICmsActionSpecialCopy extends ICmsActionSpecialBase {
  actionId: typeof CMS_ACTION_SPECIAL_ID_TYPE.COPY;
  content: string;
}

export interface ICmsActionSpecialKeep extends ICmsActionSpecialBase {
  actionId: typeof CMS_ACTION_SPECIAL_ID_TYPE.KEEP;
  msg: string;
  msgType: 'long_text';
  reset: boolean;
}

export type ICmsActionSpecial =
  | ICmsActionSpecialSelfSearch
  | ICmsActionSpecialDetail
  | ICmsActionSpecialKtvPlayer
  | ICmsActionSpecialRefreshList
  | ICmsActionSpecialCopy
  | ICmsActionSpecialKeep;

export type ICmsActionPayload = ICmsActionBase | ICmsActionSpecial;

export interface ICmsActionEnvelope {
  action: ICmsActionPayload;
  toast?: string;
}

export type ICmsAction = ICmsActionPayload | ICmsActionEnvelope | string;

export type ICmsProxy = [number, string, string] | [];

export type ICmsRunMian = any;

export type ICmsDestroy = void;

export interface IRecMatch {
  vod_douban_id: string;
  vod_douban_type: string;
  vod_pic: string;
  vod_name: string;
}

export interface ICmsParams {
  init: ICmsInitOptions;
  home: ICmsHomeOptions;
  homeVod: ICmsHomeVodOptions;
  category: ICmsCategoryOptions;
  detail: ICmsDetailOptions;
  search: ICmsSearchOptions;
  play: ICmsPlayOptions;
  action: ICmsActionOptions;
  proxy: ICmsProxyOptions;
  runMain: ICmsRunMianOptions;
  destroy: ICmsDestroyOptions;
}

export interface ICmsResult {
  init: ICmsInit;
  home: ICmsHome;
  homeVod: ICmsHomeVod;
  category: ICmsCategory;
  detail: ICmsDetail;
  play: ICmsPlay;
  search: ICmsSearch;
  action: ICmsAction;
  proxy: ICmsProxy;
  runMain: ICmsRunMian;
  destroy: ICmsDestroy;
}

export type ICmsResultPromise = {
  [K in keyof ICmsResult]: ICmsResult[K] extends (...args: infer A) => infer R
    ? 0 extends 1 & ICmsResult[K]
      ? Promise<ICmsResult[K]>
      : (...args: A) => Promise<R>
    : Promise<ICmsResult[K]>;
};

export type ICmsMethodName = keyof ICmsResult;

export type ICms = {
  [K in ICmsMethodName]: [ICmsParams[K]] extends [void]
    ? () => Promise<ICmsResult[K]>
    : [undefined] extends [ICmsParams[K]]
      ? (doc?: Exclude<ICmsParams[K], undefined>) => Promise<ICmsResult[K]>
      : (doc: ICmsParams[K]) => Promise<ICmsResult[K]>;
};

export type ICmsAdapter = ICms & {
  prepare?: () => Promise<void> | void;
  terminate?: () => Promise<void> | void;
};

export interface ICmsAdapterConstructor {
  new (...args: any[]): ICmsAdapter;
  prepare?: () => Promise<void> | void;
  terminate?: () => Promise<void> | void;
}
