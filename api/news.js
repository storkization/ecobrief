export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { query = '경제', display = 20, type = 'korea' } = req.query;

  const searchQuery = type === 'intl'
    ? query || '국제경제 미국 금리 무역'
    : query || '한국경제 코스피 주식 금리';

  try {
    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(searchQuery)}&display=${display}&sort=date`;

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Naver API error' });
    }

    const data = await response.json();

    // 제목/설명 HTML 태그 제거
    const items = data.items.map(item => ({
      title: item.title.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      link: item.originallink || item.link,
      source: extractSource(item.originallink || item.link),
      date: new Date(item.pubDate),
      description: item.description.replace(/<[^>]+>/g, ''),
    }));

    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function extractSource(url) {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    const map = {
      'hankyung.com': '한국경제',
      'mk.co.kr': '매일경제',
      'chosun.com': '조선일보',
      'joongang.co.kr': '중앙일보',
      'donga.com': '동아일보',
      'hani.co.kr': '한겨레',
      'yna.co.kr': '연합뉴스',
      'yonhapnews.co.kr': '연합뉴스',
      'newsis.com': '뉴시스',
      'news1.kr': '뉴스1',
      'sedaily.com': '서울경제',
      'etnews.com': '전자신문',
      'bloter.net': '블로터',
      'zdnet.co.kr': 'ZDNet',
      'reuters.com': 'Reuters',
      'bloomberg.com': 'Bloomberg',
      'wsj.com': 'WSJ',
      'ft.com': 'FT',
    };
    for (const [key, val] of Object.entries(map)) {
      if (host.includes(key)) return val;
    }
    return host.split('.')[0];
  } catch { return '뉴스' }
}
