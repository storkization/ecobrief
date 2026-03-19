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
반드시 "줄1:", "줄2:", "줄3:" 레이블을 붙일 것.
각 줄은 두 문장으로 구성하되, 아래 규칙을 반드시 따를 것:

규칙:
- 두 문장이 같은 이슈/맥락을 다루면 → 자연스럽게 이어서 한 줄로 작성
- 두 문장이 서로 다른 이슈를 다뤄야 한다면 → "• 문장1\n• 문장2" 형식으로 불릿 분리
- 억지로 무관한 이슈를 한 줄에 끼워 넣지 말 것. 차라리 불릿으로 분리할 것.

줄1: (핵심 이슈 — 오늘 가장 중요한 이슈. 핵심 숫자 포함. ~이다 또는 ~했다로 끝낼 것)
줄2: (시장 흐름 — 줄1 이슈에 대한 시장 반응 또는 파급 흐름 중심으로. ~이다 또는 ~했다로 끝낼 것)
줄3: (투자 포인트 — 줄1/2 맥락에서 투자자가 지금 봐야 할 것. ~이다 또는 ~전망이다로 끝낼 것)
[/SUMMARY]

[ONELINER]
오늘 ${label} 시장 전체를 큰 그림으로 바라보며 아래 세 가지를 순서대로 한 문장씩 작성.
반드시 "포인트1:", "포인트2:", "포인트3:" 레이블을 붙일 것. 절대 줄바꿈 하지 말 것.
포인트1: 오늘 ${label} 시장의 전반적인 흐름을 한 문장으로. ~있습니다 또는 ~입니다로 끝낼 것.
포인트2: 이 흐름을 바꿀 수 있는 핵심 변수나 리스크를 한 문장으로. ~있습니다 또는 ~입니다로 끝낼 것.
포인트3: 지금 투자자가 가장 집중해야 할 포인트를 한 문장으로. ~해야 합니다 또는 ~있습니다로 끝낼 것.
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
[/BRIEFING]

[FOOTNOTES]
SUMMARY의 줄1/줄2/줄3에 등장한 용어 중, 경제 입문자가 "이게 뭐지?" 할 만한 것을 줄별로 1~2개 골라 부연설명을 달아줘.

규칙:
- 반드시 "줄1:", "줄2:", "줄3:" 레이블로 어느 줄의 용어인지 명시할 것
- 설명이 필요 없는 줄은 생략
- 형식: ※ [용어]? │ [설명]
- 단순 개념(매파 발언, 긴축 등)은 한 문장으로 쉽게 설명
- 법/정책/지수처럼 구체적 내용이 있는 건 "1. ... 2. ... 3. ..." 번호 리스트로 내용 나열
- 설명은 경제 초보자도 이해할 수 있게 쉽고 간결하게

예시:
줄2: ※ 환율안정 3법이란? │ 1. 국내시장 복귀계좌(RIA) 도입 2. 기업 해외 배당금 익금불산입 확대 3. 환헤지 상품 세제 지원 신설
줄3: ※ 매파적 기조란? │ 물가를 잡기 위해 금리 인하를 미루고 긴축을 유지하겠다는 강경한 통화정책 태도
[/FOOTNOTES]`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('Anthropic API error:', JSON.stringify(data));
      return res.status(500).json({ error: data.error?.message || JSON.stringify(data) });
    }

    const fullText = data.content?.[0]?.text || '';
    const summaryMatch = fullText.match(/\[SUMMARY\]([\s\S]*?)(?=\[\/SUMMARY\]|\[ONELINER\]|\[BRIEFING\]|$)/);
    const onelinerMatch = fullText.match(/\[ONELINER\]([\s\S]*?)(?=\[\/ONELINER\]|\[BRIEFING\]|$)/);
    const briefingMatch = fullText.match(/\[BRIEFING\]([\s\S]*?)(?=\[\/BRIEFING\]|$)/);
    const footnotesMatch = fullText.match(/\[FOOTNOTES\]([\s\S]*?)(?=\[\/FOOTNOTES\]|$)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';
    const briefing = briefingMatch ? briefingMatch[1].trim() : fullText;
    const oneliner = onelinerMatch ? onelinerMatch[1].trim() : '';
    const footnotes = footnotesMatch ? footnotesMatch[1].trim() : '';
    res.status(200).json({ briefing, summary, oneliner, footnotes });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
