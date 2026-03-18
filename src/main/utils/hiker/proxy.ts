import { PORT, PROXY_API } from '@shared/config/env';

export const getPort = (): string => PORT;
export const getUrl = (_local: boolean): string => PROXY_API;
export const getProxy = (local: boolean): string => `${getUrl(local)}?do=js`;

export const js2Proxy = (
  dynamic: boolean,
  siteType: number,
  siteKey: string,
  url: string,
  headers: Record<string, any> = {},
): string => {
  const proxyUrl = getProxy(!dynamic);
  const headerStr = encodeURIComponent(JSON.stringify(headers));
  const encodedUrl = encodeURIComponent(url);

  return `${proxyUrl}&from=catvod&siteType=${siteType}&siteKey=${siteKey}&header=${headerStr}&url=${encodedUrl}`;
};
