import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { isStrEmpty, isString } from '@shared/modules/validate';
import AdmZip from 'adm-zip';
import StreamZip from 'node-stream-zip';

async function addDirectoryToZip(zip: AdmZip, dirPath: string, rootPath: string): Promise<void> {
  const entries = await readdir(dirPath);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stats = await stat(fullPath);
    const relativePath = path.relative(rootPath, fullPath);

    if (stats.isDirectory()) {
      await addDirectoryToZip(zip, fullPath, rootPath);
    } else {
      zip.addLocalFile(fullPath, path.dirname(relativePath));
    }
  }
}

/**
 * Compressing a directory into a zip file
 * @param src - The string to be compressed
 * @param dest - The destination path for the .zip file
 * @returns The compressed Buffer
 */
export async function compress(src: string, dest: string): Promise<boolean> {
  if (!isString(src) || isStrEmpty(src) || !isString(dest) || isStrEmpty(dest)) return false;

  try {
    const zip = new AdmZip();
    const stats = await stat(src);

    if (stats.isDirectory()) {
      await addDirectoryToZip(zip, src, src);
    } else {
      zip.addLocalFile(src);
    }

    await zip.writeZipPromise(dest);
    return true;
  } catch {
    return false;
  }
}

/**
 * Decompress zip files
 * @param src - The path of the .zip file
 * @param dest - The destination directory to extract the contents
 * @returns Whether the decompression was successful
 */
export async function decompress(src: string, dest: string): Promise<boolean> {
  if (!isString(src) || isStrEmpty(src) || !isString(dest) || isStrEmpty(dest)) return false;
  if (!src.endsWith('.zip')) return false;

  try {
    // eslint-disable-next-line new-cap
    const zip = new StreamZip.async({ file: src });
    await zip.extract(null, dest);
    await zip.close();
    return true;
  } catch {
    return false;
  }
}
