const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const zlib = require('node:zlib');
const sevenZip = require('node-7z');
const sevenZipBin = require('7zip-bin-full');
const { execSync } = require('node:child_process');
const { downloadWithRedirects } = require('./download');

// Base URL for downloading ffmpeg binaries
const FFMPEG_RELEASE_BASE_URL = 'https://github.com/eugeneware/ffmpeg-static/releases/download';
const DEFAULT_FFMPEG_VERSION = 'b6.1.1';

const FFMPEG_WIN_ARM_RELEASE_BASE_URL = 'https://github.com/tordona/ffmpeg-win-arm64/releases/download';
const DEFAULT_FFMPEG_WIN_ARM_VERSION = '7.1.2';

// Mapping of platform+arch to binary package name
const FFMPEG_PACKAGES = {
  'darwin-arm64': 'ffmpeg-darwin-arm64.gz',
  'darwin-x64': 'ffmpeg-darwin-x64.gz',
  'win32-arm64': 'ffmpeg-7.1.2-full-static-win-arm64.7z',
  'win32-x64': 'ffmpeg-win32-x64.gz',
  'linux-arm64': 'ffmpeg-linux-arm64.gz',
  'linux-ia32': 'ffmpeg-linux-ia32.gz',
  'linux-x64': 'ffmpeg-linux-x64.gz',
};

/**
 * Extract .gz file
 */
async function extractGz(inputPath, outputPath) {
  const compressed = fs.readFileSync(inputPath);
  const decompressed = zlib.gunzipSync(compressed);
  fs.writeFileSync(outputPath, decompressed);
}

/**
 * Extract .7z file
 */
async function extract7z(inputPath, outputPath) {
  const sevenZipPath = sevenZipBin.path7z;
  await new Promise((resolve, reject) => {
    const stream = sevenZip.extractFull(inputPath, outputPath, { $bin: sevenZipPath });
    stream.on('end', () => resolve());
    stream.on('error', reject);
  });
}

/**
 * Downloads and extracts the ffmpeg binary for the specified platform and architecture
 * @param {string} platform Platform to download for (e.g., 'darwin', 'win32', 'linux')
 * @param {string} arch Architecture to download for (e.g., 'x64', 'arm64')
 * @param {string} version Version of ffmpeg to download
 * @param {boolean} isMusl Whether to use MUSL variant for Linux
 */
async function downloadFFmpegBinary(platform, arch, version, isMusl = false) {
  const platformKey = isMusl ? `${platform}-musl-${arch}` : `${platform}-${arch}`;
  const packageName = FFMPEG_PACKAGES[platformKey];

  if (!packageName) {
    console.error(`No binary available for ${platformKey}`);
    return 101;
  }

  // Create output directory structure
  const binDir = path.join(os.homedir(), '.zy', 'bin');
  // Ensure directories exist
  fs.mkdirSync(binDir, { recursive: true });

  // Download URL for the specific binary
  let downloadUrl;
  if (platform === 'win32' && arch === 'arm64') {
    downloadUrl = `${FFMPEG_WIN_ARM_RELEASE_BASE_URL}/${version}/${packageName}`;
  } else {
    downloadUrl = `${FFMPEG_RELEASE_BASE_URL}/${version}/${packageName}`;
  }

  const tempDir = os.tmpdir();
  const tempFilename = path.join(tempDir, packageName);
  console.log(`Will be saved to: ${tempFilename}`);

  const isGz = packageName.endsWith('.gz');
  const is7z = packageName.endsWith('.7z');

  try {
    console.log(`Downloading ffmpeg ${version} for ${platformKey}...`);
    console.log(`URL: ${downloadUrl}`);

    await downloadWithRedirects(downloadUrl, tempFilename);
    console.log(`Extracting ${packageName} to ${binDir}...`);

    const tempExtractDir = path.join(tempDir, `ffmpeg-extract-${Date.now()}`);
    fs.mkdirSync(tempExtractDir, { recursive: true });
    const binaryName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    const outputFilePath = path.join(tempExtractDir, binaryName);

    if (isGz) {
      await extractGz(tempFilename, outputFilePath);
    } else if (is7z) {
      await extract7z(tempFilename, tempExtractDir);
    }

    // Find ffmpeg files and copy to binDir
    const findAndMoveFiles = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          findAndMoveFiles(fullPath);
        } else {
          if (entry.name !== binaryName) continue;

          const outputPath = path.join(binDir, entry.name);
          fs.copyFileSync(fullPath, outputPath);
          console.log(`Extracted ${entry.name} -> ${outputPath}`);

          if (platform !== 'win32') {
            fs.chmodSync(outputPath, 0o755);
          }
        }
      }
    };
    findAndMoveFiles(tempExtractDir);

    // Clean up temporary
    fs.unlinkSync(tempFilename);
    fs.rmSync(tempExtractDir, { recursive: true });

    console.log(`Successfully installed ffmpeg ${version} for ${platform}-${arch}`);
    return 0;
  } catch (error) {
    let retCode = 103;

    console.error(`Error installing ffmpeg for ${platformKey}: ${error.message}`);

    if (fs.existsSync(tempFilename)) {
      fs.unlinkSync(tempFilename);
    }

    // Check if binDir is empty and remove it if so
    try {
      const files = fs.readdirSync(binDir);
      if (files.length === 0) {
        fs.rmSync(binDir, { recursive: true });
        console.log(`Removed empty directory: ${binDir}`);
      }
    } catch (cleanupError) {
      console.warn(`Warning: Failed to clean up directory: ${cleanupError.message}`);
      retCode = 104;
    }

    return retCode;
  }
}

/**
 * Detects current platform and architecture
 */
function detectPlatformAndArch() {
  const platform = os.platform();
  const arch = os.arch();
  const isMusl = platform === 'linux' && detectIsMusl();

  return { platform, arch, isMusl };
}

/**
 * Attempts to detect if running on MUSL libc
 */
function detectIsMusl() {
  try {
    // Simple check for Alpine Linux which uses MUSL
    const output = execSync('cat /etc/os-release').toString();
    return output.toLowerCase().includes('alpine');
  } catch {
    return false;
  }
}

/**
 * Main function to install ffmpeg
 */
async function installFFmpeg() {
  const { platform, arch, isMusl } = detectPlatformAndArch();

  // Get the latest version if no specific version is provided
  const version = arch === 'arm64' && platform === 'win32' ? DEFAULT_FFMPEG_WIN_ARM_VERSION : DEFAULT_FFMPEG_VERSION;
  console.log(`Installing ffmpeg ${version} for ${platform}-${arch}${isMusl ? ' (MUSL)' : ''}...`);

  return await downloadFFmpegBinary(platform, arch, version, isMusl);
}

// Run the installation
installFFmpeg()
  .then((retCode) => {
    if (retCode === 0) {
      console.log('Installation successful');
      process.exit(0);
    } else {
      console.error('Installation failed');
      process.exit(retCode);
    }
  })
  .catch((error) => {
    console.error('Installation failed:', error);
    process.exit(100);
  });
