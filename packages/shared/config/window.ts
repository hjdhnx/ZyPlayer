export enum WINDOW_NAME {
  MAIN = 'main',
  PLAYER = 'player',
  SNIFFER = 'sniffer',
  BROWSER = 'browser',
  OTHER = 'other',
}

export interface ISize {
  width: number;
  height: number;
}

export interface IWindowSize {
  default: ISize;
  min: ISize;
}

export const WINDOW_SIZE: Record<WINDOW_NAME, IWindowSize> = {
  [WINDOW_NAME.MAIN]: {
    default: { width: 1000, height: 640 },
    min: { width: 1000, height: 640 },
  },
  [WINDOW_NAME.PLAYER]: {
    default: { width: 960, height: 600 },
    min: { width: 528, height: 297 },
  },
  [WINDOW_NAME.SNIFFER]: {
    default: { width: 1000, height: 640 },
    min: { width: 1000, height: 640 },
  },
  [WINDOW_NAME.BROWSER]: {
    default: { width: 1000, height: 640 },
    min: { width: 1000, height: 640 },
  },
  [WINDOW_NAME.OTHER]: {
    default: { width: 1000, height: 640 },
    min: { width: 1000, height: 640 },
  },
};
