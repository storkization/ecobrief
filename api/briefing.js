export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { headlines } = req.body;

  if (!headlines || !headlines.length) {
    return res.status(400).json({ error: 'No headlines provided' });
  }

  try {
    const headlineText = headlines.map((h, i) => `${i + 1}. ${h}`).join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{
          role: 'user',
          content: `당신은 기관 투자자 수준의 경제 분석가입니다. 오늘의 국내외 경제 뉴스를 분석해서 진짜 중요한 핵심 이슈 10가지를 선별해 브리핑을 작성해주세요.

오늘 뉴스 헤드라인:
${headlineText}

선별 기준:
- 구직/채용/지역행사/사소한 기업소식은 절대 선택 금지
- 거시경제(금리/환율/물가/GDP), 글로벌 시장, 주요 산업 중심
- 국내외 뉴스를 균형있게 포함
- 각 이슈: "왜 중요한지" + "앞으로 어떻게 될지" 반드시 포함

형식 (10개, 간결하게):

1️⃣ [이슈 제목]
📌 [배경 한 줄] | 📊 [영향] | 🔮 [전망]

2️⃣ [이슈 제목]
📌 [배경 한 줄] | 📊 [영향] | 🔮 [전망]

(3~10번 동일 형식)

💡 오늘의 투자 포인트: [전체 흐름 핵심 메시지 2줄]`
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '브리핑 생성 실패';

    res.status(200).json({ briefing: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
