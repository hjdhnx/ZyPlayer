import { isJsonStr } from '@shared/modules/validate';

class BaseSpider {
  public home: () => Promise<any>;
  public category: () => Promise<any>;
  public detail: () => Promise<any>;
  public search: () => Promise<any>;
  public play: () => Promise<any>;
  public homeVod: () => Promise<any>;
  public proxy: () => Promise<any>;

  constructor() {
    this.home = this.homeContent;
    this.category = this.categoryContent;
    this.detail = this.detailContent;
    this.search = this.searchContent;
    this.play = this.playerContent;
    this.homeVod = this.homeVideoContent;
    this.proxy = this.localProxy;
  }

  async fetch(url: string, options: Record<string, any>) {
    // @ts-expect-error req is a global function in hiker, but not defined in TypeScript
    const resp = await req(url, options);
    return {
      ...resp,
      get data() {
        return isJsonStr(resp.content) ? JSON.parse(resp.content) : resp.content;
      },
    };
  }

  async homeContent() {}

  async categoryContent() {}

  async detailContent() {}

  async searchContent() {}

  async playerContent() {}

  async homeVideoContent() {}

  async localProxy() {}

  async action() {}
}

export default BaseSpider;
