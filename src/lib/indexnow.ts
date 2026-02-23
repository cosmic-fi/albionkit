const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const INDEXNOW_KEY = '2e457296cedb4fc0a21153ca79e28266';
const INDEXNOW_HOST = 'albionkit.com';
const INDEXNOW_KEY_LOCATION = `https://albionkit.com/${INDEXNOW_KEY}.txt`;

export async function submitToIndexNow(urls: string[]) {
  if (!urls || urls.length === 0) return;

  const uniqueUrls = Array.from(new Set(urls));

  const payload = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: uniqueUrls,
  };

  try {
    await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error('IndexNow submission failed', e);
  }
}

