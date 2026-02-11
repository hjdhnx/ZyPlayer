import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import { isStrEmpty, isString } from '@shared/modules/validate';

const execAsync = promisify(exec);

/**
 * Compressing a directory into a tgz file
 * @param src - The string to be compressed
 * @param dest - The destination path for the .tgz file
 * @returns The compressed Buffer
 */
export async function compress(src: string, dest: string): Promise<boolean> {
  if (!isString(src) || isStrEmpty(src) || !isString(dest) || isStrEmpty(dest)) return false;

  try {
    await execAsync(`tar -czf "${dest}" -C "${src}" .`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Decompress tgz files
 * @param src - The path of the .tgz file
 * @param dest - The destination directory to extract the contents
 * @returns Whether the decompression was successful
 */
export async function decompress(src: string, dest: string): Promise<boolean> {
  if (!isString(src) || isStrEmpty(src) || !isString(dest) || isStrEmpty(dest)) return false;
  if (!(src.endsWith('.tar.gz') || src.endsWith('.tgz'))) return false;

  try {
    await execAsync(`tar -xzf "${src}" -C "${dest}"`);
    return true;
  } catch {
    return false;
  }
}
