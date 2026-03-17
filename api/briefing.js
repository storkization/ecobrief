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
        max_tokens: 2500,
        messages: [{
          role: 'user',
          content: `아래는 오늘의 [${label}] 분야 주요 뉴스 헤드라인이야.

헤드라인:
${headlineText}

세 가지를 작성해줘.

[SUMMARY]
아래 형식을 반드시 그대로 지켜. 반드시 "줄1:", "줄2:", "줄3:" 레이블을 붙일 것. 각각 딱 두 문장씩. 절대 줄바꿈 하지 말 것.
줄1: (핵심 이슈 — 무슨 일이 일어났는지 + 왜 지금 중요한지. 핵심 숫자 포함. ~이다 또는 ~했다로 끝낼 것)
줄2: (시장 흐름 — 현재 시장 반응 + 주목해야 할 흐름. ~이다 또는 ~했다로 끝낼 것)
줄3: (투자 포인트 — 지금 투자자가 봐야 할 것 + 리스크 또는 기회. ~이다 또는 ~전망이다로 끝낼 것)
[/SUMMARY]

[ONELINER]
아래 세 가지를 순서대로 한 문장씩 작성. 절대 줄바꿈 하지 말 것. 각 문장 앞에 "문장1:", "문장2:", "문장3:" 레이블만 붙일 것.
문장1: 지금 ${label} 시장의 핵심 상황을 한 문장으로. (숫자 포함)
문장2: 가장 큰 리스크 또는 변수를 한 문장으로.
문장3: 지금 당장 눈여겨봐야 할 것을 한 문장으로. ~해야 한다 또는 ~주목할 필요가 있다로 끝낼 것.
[/ONELINER]

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

    if (!response.ok || data.error) {
      console.error('Anthropic API error:', JSON.stringify(data));
      return res.status(500).json({ error: data.error?.message || JSON.stringify(data) });
    }

    const fullText = data.content?.[0]?.text || '';
    const summaryMatch = fullText.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
    const briefingMatch = fullText.match(/\[BRIEFING\]([\s\S]*?)\[\/BRIEFING\]/);
    const onelinerMatch = fullText.match(/\[ONELINER\]([\s\S]*?)\[\/ONELINER\]/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';
    const briefing = briefingMatch ? briefingMatch[1].trim() : fullText;
    const oneliner = onelinerMatch ? onelinerMatch[1].trim() : '';
    res.status(200).json({ briefing, summary, oneliner });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
