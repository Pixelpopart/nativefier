import * as _ from 'lodash';
import axios from 'axios';
import * as log from 'loglevel';

const ELECTRON_VERSIONS_URL = 'https://atom.io/download/atom-shell/index.json';
const DEFAULT_CHROME_VERSION = '78.0.3904.130'; // TODO make constant and share with tests

// TODO add caching, or even package at build time
async function getChromeVersionForElectronVersion(
  electronVersion: string,
  url = ELECTRON_VERSIONS_URL,
): Promise<string> {
  const response = await axios.get(url, { timeout: 5000 });
  if (response.status !== 200) {
    throw new Error(`Bad request: Status code ${response.status}`);
  }
  const { data } = response;
  const electronVersionToChromeVersion: _.Dictionary<string> = _.zipObject(
    data.map((d) => d.version),
    data.map((d) => d.chrome),
  );
  if (!(electronVersion in electronVersionToChromeVersion)) {
    throw new Error(
      `Electron version '${electronVersion}' not found in retrieved version list!`,
    );
  }
  return electronVersionToChromeVersion[electronVersion];
}

export function getUserAgentString(
  chromeVersion: string,
  platform: string,
): string {
  let userAgent: string;
  switch (platform) {
    case 'darwin':
    case 'mas':
      userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      break;
    case 'win32':
      userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      break;
    case 'linux':
      userAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      break;
    default:
      throw new Error(
        'Error invalid platform specified to getUserAgentString()',
      );
  }
  return userAgent;
}

export async function inferUserAgent(
  electronVersion: string,
  platform: string,
  url = ELECTRON_VERSIONS_URL,
): Promise<string> {
  try {
    const chromeVersion = await getChromeVersionForElectronVersion(
      electronVersion,
      url,
    );
    return getUserAgentString(chromeVersion, platform);
  } catch (e) {
    log.warn(
      `Unable to infer chrome version for user agent, using ${DEFAULT_CHROME_VERSION}`,
    );
    return getUserAgentString(DEFAULT_CHROME_VERSION, platform);
  }
}
