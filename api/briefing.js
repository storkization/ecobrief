export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [{
          type: 'web_search_20250305',
          name: 'web_search'
        }],
        messages: [{
          role: 'user',
          content: `오늘은 ${today}입니다.

당신은 기관투자자 수준의 경제 분석가입니다.
웹서치를 활용해서 오늘 한국 및 글로벌 주요 경제 뉴스를 직접 검색하고,
진짜 중요한 핵심 이슈 10가지를 선별해서 투자자 관점의 브리핑을 작성해주세요.

검색 시 포함할 것:
- 오늘자 한국 경제 뉴스 (환율, 증시, 금리, 수출 등)
- 오늘자 글로벌 경제 뉴스 (미국 연준, 유가, 달러 등)
- 지정학적 리스크나 주요 정책 변화

선별 기준:
- 구직/채용/지역행사/사소한 기업소식 제외
- 거시경제, 글로벌 시장, 주요 산업 중심
- 숫자/데이터가 있으면 반드시 포함

형식:
1️⃣ [이슈 제목]
📌 배경: [왜 지금 중요한지]
📊 영향: [시장/산업 영향, 수치 포함]
🔮 전망: [앞으로 어떻게 될지]

(2~10번 동일)

💡 오늘의 투자 포인트: [전체 흐름 핵심 2줄]`
        }]
      })
    });

    const data = await response.json();

    // 텍스트 블록만 추출
    const text = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    res.status(200).json({ briefing: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
