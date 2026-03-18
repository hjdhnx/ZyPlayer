export const CMS_ACTION_TYPE = {
  INPUT: 'input',
  EDIT: 'edit',
  MULTI_INPUT: 'multiInput',
  MULTI_INPUT_X: 'multiInputX',
  MENU: 'menu',
  SELECT: 'select',
  MULTI_SELECT: 'multiSelect',
  MSGBOX: 'msgbox',
  WEBVIEW: 'webview',
  BROWSER: 'browser',
  ORDER: 'order',
  HELP: 'help',
} as const;
export type ICmsActionType = (typeof CMS_ACTION_TYPE)[keyof typeof CMS_ACTION_TYPE];

export const CMS_ACTION_FORM_TYPE = [
  CMS_ACTION_TYPE.INPUT,
  CMS_ACTION_TYPE.EDIT,
  CMS_ACTION_TYPE.MULTI_INPUT,
  CMS_ACTION_TYPE.MULTI_INPUT_X,
  CMS_ACTION_TYPE.SELECT,
  CMS_ACTION_TYPE.MULTI_SELECT,
  CMS_ACTION_TYPE.MENU,
] as const;
export type ICmsActionFormType = (typeof CMS_ACTION_FORM_TYPE)[number];

export const CMS_ACTION_INPUT_TYPE = {
  TEXT: 0,
  PASSWORD: 1,
  NUMBER: 2,
  EMAIL: 3,
  URL: 4,
  FOLDER_SELECT: 5,
  FILE_SELECT: 6,
  DATE_SELECT: 7,
  IMAGE_BASE64: 8,
} as const;
export type ICmsActionInputType = (typeof CMS_ACTION_INPUT_TYPE)[keyof typeof CMS_ACTION_INPUT_TYPE];

export type ICmsActionButtonTypeEnum = 0 | 1 | 2 | 3 | 4;
export type ICmsActionButtonType = boolean | ICmsActionButtonTypeEnum;

export type ICmsActionButtonTypeDisplay = 'cancel' | 'confirm' | 'reset' | 'preview';

export const CMS_ACTION_SPECIAL_ID_TYPE = {
  SELF_SEARCH: '__self_search__',
  DETAIL: '__detail__',
  KTVPLAYER: '__ktvplayer__',
  REFRESH_LIST: '__refresh_list__',
  COPY: '__copy__',
  KEEP: '__keep__',
  COMMENT_CLOSE: '__comment_close__',
} as const;
export type ICmsActionSpecialIdType = (typeof CMS_ACTION_SPECIAL_ID_TYPE)[keyof typeof CMS_ACTION_SPECIAL_ID_TYPE];
export const CMS_ACTION_SPECIAL_ID_TYPES = Object.values(CMS_ACTION_SPECIAL_ID_TYPE);
export type ICmsActionSpecialIdTypes = keyof typeof CMS_ACTION_SPECIAL_ID_TYPES;
