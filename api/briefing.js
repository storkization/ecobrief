export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { headlines, tab = 'economy', label = '경제' } = req.body;

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
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `아래는 오늘의 [${label}] 분야 주요 뉴스 헤드라인이야.

헤드라인:
${headlineText}

두 가지를 작성해줘.

[SUMMARY]
오늘 ${label} 분야를 딱 3줄로 요약해줘. 경제 초보자도 바로 이해할 수 있게, 핵심 숫자/키워드 포함. 각 줄은 완결된 문장으로.
줄1: (가장 중요한 이슈)
줄2: (두 번째 이슈 또는 연관 흐름)
줄3: (투자자 관점 핵심 포인트)
[/SUMMARY]

[BRIEFING]
투자자/경제 입문자 관점에서 가장 중요한 5개를 골라 브리핑해줘.

선별 기준:
- ${label} 분야 핵심 이슈 중심
- 구직/채용/지역행사/단순 홍보 제외
- 숫자/데이터 있으면 반드시 포함

형식:
1️⃣ [제목]
📌 배경: [왜 지금 중요한지]
📊 영향: [구체적 수치와 함께 시장 영향]
💼 액션: [개인투자자가 지금 취해야 할 행동]

(2~5번 동일)

💡 오늘의 한마디: [경제 초보자도 이해할 수 있는 오늘 ${label} 핵심 메시지]
[/BRIEFING]`
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Anthropic API error:', JSON.stringify(data));
      return res.status(500).json({ error: data.error.message });
    }

    const fullText = data.content?.[0]?.text || '';
    const summaryMatch = fullText.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
    const briefingMatch = fullText.match(/\[BRIEFING\]([\s\S]*?)\[\/BRIEFING\]/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';
    const briefing = briefingMatch ? briefingMatch[1].trim() : fullText;
    res.status(200).json({ briefing, summary });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
