import fs from 'node:fs';
import zlib from 'node:zlib';

import { isStrEmpty, isString } from '@shared/modules/validate';

/**
 * Compressing a directory into a gz file
 * @param src - The string to be compressed
 * @param dest - The destination path for the .tgz file
 * @returns The compressed Buffer
 */
export async function compress(src: string, dest: string): Promise<boolean> {
  if (!isString(src) || isStrEmpty(src) || !isString(dest) || isStrEmpty(dest)) return false;

  try {
    const input = fs.readFileSync(src);
    const compressed = zlib.gzipSync(input);
    fs.writeFileSync(dest, compressed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Decompress gz files
 * @param src - The path of the .gz file
 * @param dest - The destination directory to extract the contents
 * @returns Whether the decompression was successful
 */
export async function decompress(src: string, dest: string): Promise<boolean> {
  if (!isString(src) || isStrEmpty(src) || !isString(dest) || isStrEmpty(dest)) return false;

  if (!src.endsWith('.gz')) return false;

  try {
    const compressed = fs.readFileSync(src);
    const decompressed = zlib.gunzipSync(compressed);
    fs.writeFileSync(dest, decompressed);

    return true;
  } catch {
    return false;
  }
}
