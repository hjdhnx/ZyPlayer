import { Buffer } from 'node:buffer';

import { batchFetch, fetch } from '@main/utils/hiker/request/syncFetch';
import { headersPascalCase } from '@shared/modules/headers';

const hasPropertyIgnoreCase = (obj: Record<string, string>, propertyName: string) => {
  return Object.keys(obj).some((key) => key.toLowerCase() === propertyName.toLowerCase());
};

const valueStartsWith = (obj: Record<string, string>, propertyName: string, prefix: string) => {
  const key = Object.keys(obj).find((key) => key.toLowerCase() === propertyName.toLowerCase());
  return key !== undefined && obj[key].startsWith(prefix);
};

const req = (url: string, cobj: Record<string, any>): { content: string; headers?: Record<string, string> } => {
  const obj = { ...cobj };

  if (obj.data) {
    obj.body = obj.data;
    const isForm =
      obj.postType === 'form' ||
      (hasPropertyIgnoreCase(obj.headers, 'Content-Type') &&
        valueStartsWith(obj.headers, 'Content-Type', 'application/x-www-form-urlencoded'));

    if (isForm) {
      obj.body = new URLSearchParams(obj.data).toString();
    }
    delete obj.data;
  }

  if (Object.hasOwn(obj, 'redirect')) obj.redirect = !!obj.redirect;
  if (obj.buffer === 2) obj.toHex = true;

  if (url === 'https://api.nn.ci/ocr/b64/text' && obj.headers) {
    obj.headers['Content-Type'] = 'text/plain';
  }
  obj.headers = headersPascalCase(obj.headers);

  const res: { content: string; headers?: Record<string, string> } = { content: '' };
  let resp: any = fetch(url, obj);
  if (obj.withHeaders) {
    resp = JSON.parse(resp!);
    res.content = resp.body;
    res.headers = Object.fromEntries(Object.entries(resp.headers || {}).map(([k, v]) => [k, v?.[0]]));
  } else {
    res.content = resp!;
  }

  if (obj.buffer === 2) {
    res.content = Buffer.from(resp!.body, 'hex').toString('base64');
  }

  return res;
};

export { batchFetch, req };
export { joinUrl, local, pd, pdfa, pdfh } from '@main/utils/hiker';
