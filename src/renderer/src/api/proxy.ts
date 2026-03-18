import { PROXY_API } from '@shared/config/env';

import { apiRequest as request } from '@/utils/request';

export function setProxy(doc) {
  return request.request({
    url: PROXY_API,
    method: 'post',
    data: doc,
  });
}

export function getProxy(doc) {
  return request.request({
    url: PROXY_API,
    method: 'get',
    params: doc,
  });
}
