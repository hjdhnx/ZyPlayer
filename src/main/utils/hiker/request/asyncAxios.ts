import { Buffer } from 'node:buffer';
import path from 'node:path';

import { headersPascalCase } from '@shared/modules/headers';
import { toString } from '@shared/modules/toString';
import { isJsonStr } from '@shared/modules/validate';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import JSON5 from 'json5';
import mime from 'mime-types';
import protobuf from 'protobufjs';

import { MOBILE_UA, PC_UA } from '../ua';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';

interface RequestOptions {
  method?: HttpMethod;
  timeout?: number;
  body?: any;
  headers?: Record<string, string>;
  redirect?: 0 | 1 | boolean;
  toHex?: boolean;
  onlyHeaders?: boolean;
  withHeaders?: boolean;
  withStatusCode?: boolean;
}

const getTimeout = (timeout: number | undefined | null) => {
  const baseTimeout = 5000;

  if (timeout !== null && timeout !== undefined) {
    return Math.max(baseTimeout, timeout);
  }

  if (globalThis.variable?.timeout) {
    return Math.max(baseTimeout, globalThis.variable.timeout);
  }

  return baseTimeout;
};

const isLikelyPath = (p: string) => {
  if (typeof p !== 'string') return false;
  if (p.trim() === '') return false;
  if (path.isAbsolute(p)) return true;
  if (p.includes('/') || p.includes('\\')) return true;
  return false;
};

const fetch = async (url: string, options: RequestOptions = {}) => {
  try {
    const method = (options.method || 'GET').toUpperCase() as HttpMethod;
    const headers = headersPascalCase(options.headers || {});

    const config: AxiosRequestConfig = {
      url,
      method,
      headers,
      timeout: getTimeout(options?.timeout),
      maxRedirects: options?.redirect === false ? 0 : undefined,
      responseType: 'arraybuffer',
    };

    if (!config.headers?.['User-Agent']) {
      config.headers!['User-Agent'] = MOBILE_UA;
    }
    if (!config.headers?.Accept) {
      config.headers!.Accept = '*/*';
    }

    const contentType = config.headers?.['Content-Type'] || '';
    let charset: string = 'utf-8';
    if (contentType.includes('charset=')) {
      const match = contentType.match(/charset=([\w-]+)/i);
      if (match?.[1]) charset = match[1];
    }

    if (method !== 'GET') {
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const body = isJsonStr(options.body) ? JSON5.parse(options.body) : options.body;
        config.data = body;
      } else if (['text/plain', 'text/html', 'text/xml'].some((t) => contentType.includes(t))) {
        config.data = options.body;
      } else if (contentType.includes('multipart/form-data')) {
        const fd = new FormData();
        if (isLikelyPath(options.body)) {
          fd.append('file', fs.readFileSync(options.body), path.basename(options.body));
        } else {
          fd.append('file', options.body, 'file.txt');
        }
        Object.assign(headers, fd.getHeaders());
        return fd;
      } else if (contentType.includes('application/octet-stream')) {
        let raw: Buffer;
        if (isLikelyPath(options.body as string)) {
          raw = Buffer.from(fs.readFileSync(options.body as string));
        } else {
          raw = Buffer.from(options.body as string);
        }
        config.data = raw;
      } else if (contentType.includes('application/x-protobuf')) {
        let raw: Buffer | Uint8Array;
        if (
          typeof options.body === 'object' &&
          ['proto', 'bin', 'type'].every((key) => key in (options.body as Record<string, any>))
        ) {
          let { proto, bin, type } = options.body as Record<string, any>;
          if (isLikelyPath(proto)) {
            proto = fs.readFileSync(proto);
          }
          if (isLikelyPath(bin)) {
            bin = fs.readFileSync(bin);
          }
          const root = protobuf.parse(proto).root;
          const module = root.lookupType(type);
          const message = module.create(bin);
          raw = module.encode(message).finish();
        } else {
          if (isLikelyPath(options.body as string)) {
            raw = Buffer.from(fs.readFileSync(options.body as string));
          } else {
            raw = Buffer.from(options.body as string);
          }
        }
        config.data = raw;
      } else {
        if (!contentType) config.headers!['Content-Type'] = 'application/json';

        const body = isJsonStr(options.body) ? JSON5.parse(options.body) : options.body;
        config.data = body;
      }
    }

    // console.warn(`[request] url: ${url} | method: ${method} | options: ${JSON.stringify(config)}`);

    const resp: AxiosResponse<Buffer> = await axios(config);
    // @ts-expect-error custom method
    resp.getBody = function (encoding: BufferEncoding | undefined): string | Buffer {
      const buffer = Buffer.from(resp.data);
      return encoding ? buffer.toString(encoding) : buffer;
    };

    const { onlyHeaders, withHeaders, withStatusCode, toHex } = options || {};

    if (onlyHeaders) {
      return toString(resp.headers);
    }

    // @ts-expect-error custom method
    const content = toHex ? resp.getBody('hex') : resp.getBody(charset);

    if (!(withHeaders || withStatusCode)) {
      return toString(content);
    }

    return toString({
      headers: resp.headers,
      statusCode: resp.status,
      body: content,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
};

const request = fetch;

const fetchCookie = async (url: string, options: RequestOptions = {}) => {
  if (options?.withHeaders) delete options.withHeaders;
  if (options?.withStatusCode) delete options.withStatusCode;
  if (options?.toHex) delete options.toHex;

  options = Object.assign(options, { onlyHeaders: true });

  const headerStr = (await fetch(url, options)) || '{}';
  const headerObj = JSON5.parse(headerStr as string);
  const setCk = Object.keys(headerObj).find((it) => it.toLowerCase() === 'set-cookie');
  const cookie = setCk ? headerObj[setCk] : [];
  return JSON.stringify(cookie);
};

const post = async (url: string, options: RequestOptions = {}) => {
  options = Object.assign(options, { method: 'POST' });
  return await fetch(url, options);
};

const fetchPC = async (url: string, options: RequestOptions = {}) => {
  options.headers = options?.headers || {};
  const headers = headersPascalCase(options.headers);
  if (!headers['User-Agent']) {
    options.headers['User-Agent'] = PC_UA;
  }
  return await fetch(url, options);
};

const postPC = async (url: string, options: RequestOptions = {}) => {
  options.headers = options?.headers || {};
  const headers = headersPascalCase(options.headers);
  if (!headers['User-Agent']) {
    options.headers['User-Agent'] = PC_UA;
  }
  return await post(url, options);
};

const convertBase64Image = async (url: string, options: RequestOptions = {}) => {
  try {
    if (options?.withHeaders) delete options.withHeaders;
    if (options?.withStatusCode) delete options.withStatusCode;
    if (options?.toHex) delete options.toHex;
    if (options?.onlyHeaders) delete options.onlyHeaders;

    options = Object.assign(options, { toHex: true });

    const hexStr = (await fetch(url, options)) as string;
    if (!hexStr) return '';

    const base64String = Buffer.from(hexStr, 'hex').toString('base64');
    return `data:${mime.lookup(url) || 'image/png'};base64,${base64String}`;
  } catch (error) {
    console.error(error);
    return '';
  }
};

const batchFetch = async (requests: any[], threads: number = 16) => {
  const results: any[] = [];
  const processBatch = async (batchSize: number, index: number = 0) => {
    if (index < requests.length) {
      const batch = requests.slice(index, index + batchSize);
      for (const request of batch) {
        try {
          const response = await fetch(request.url, request.options);
          results.push(response);
        } catch (error) {
          results.push(`Request to ${request.url} failed: ${(error as Error).message}`);
        }
      }

      await processBatch(batchSize, index + batchSize);
    }
  };

  const batchSize = requests.length > threads ? threads : requests.length;
  await processBatch(batchSize);
  return results;
};

const bf = batchFetch;

export { batchFetch, bf, convertBase64Image, fetch, fetchCookie, fetchPC, post, postPC, request };
