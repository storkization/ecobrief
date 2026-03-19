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

세 가지를 작성해줘.

[SUMMARY]
반드시 "줄1:", "줄2:", "줄3:" 레이블을 붙일 것.
각 줄은 두 문장으로 구성하되, 아래 규칙을 반드시 따를 것:

규칙:
- 두 문장이 같은 이슈/맥락을 다루면 → 자연스럽게 이어서 한 줄로 작성
- 두 문장이 서로 다른 이슈를 다뤄야 한다면 → "• 문장1\n• 문장2" 형식으로 불릿 분리
- 억지로 무관한 이슈를 한 줄에 끼워 넣지 말 것. 차라리 불릿으로 분리할 것.
- ⚠️ 모든 내용은 위 헤드라인에 근거할 것. 헤드라인에 없는 정보, 수치, 사실은 절대 만들어 쓰지 말 것.

줄1: (핵심 이슈 — 오늘 가장 중요한 이슈. 헤드라인에 있는 숫자만 포함. ~이다 또는 ~했다로 끝낼 것)
줄2: (시장 흐름 — 줄1 이슈에 대한 시장 반응 또는 파급 흐름 중심으로. ~이다 또는 ~했다로 끝낼 것)
줄3: (투자 포인트 — 줄1/2 맥락에서 투자자가 지금 봐야 할 것. ~이다 또는 ~전망이다로 끝낼 것)
[/SUMMARY]

[ONELINER]
전문 경제 분석가로서, 위 SUMMARY의 팩트를 반복하지 말고 그 이면의 인과관계와 파급력에 집중해서 3문장을 작성해줘.

반드시 "포인트1:", "포인트2:", "포인트3:" 레이블. 절대 줄바꿈 하지 말 것.
포인트1(Why): 현상의 매크로적 배경. '~때문에', '~기인하여' 등 인과 표현. ~입니다로 끝낼 것.
포인트2(So What): 실물경제·기업실적·시장심리에 미칠 실질적 파장. ~입니다로 끝낼 것.
포인트3(Focus): 투자자가 앞으로 가장 먼저 모니터링해야 할 핵심 지표나 트리거. ~해야 합니다로 끝낼 것.

⚠️ 헤드라인에 없는 정보와 수치는 절대 만들어 쓰지 말 것.
[/ONELINER]

[FOOTNOTES]
SUMMARY의 줄1/줄2/줄3에 등장한 용어 중, 경제 입문자가 "이게 뭐지?" 할 만한 것을 줄별로 1~2개 골라 부연설명을 달아줘.

규칙:
- 반드시 "줄1:", "줄2:", "줄3:" 레이블로 어느 줄의 용어인지 명시할 것
- 설명이 필요 없는 줄은 생략
- 형식: ※ [용어] │ [설명]  ("이란?" 붙이지 말 것)
- 영어/정식 명칭이 있는 용어는 괄호로 병기할 것 예) 매파(Hawkish)적 입장, 익금불산입(DRD)
- 단순 개념은 한 문장으로 쉽게 설명
- 법/정책/지수처럼 구체적 내용이 있는 건 "1. ... 2. ... 3. ..." 번호 리스트로 내용 나열
- 설명은 경제 초보자도 이해할 수 있게 쉽고 간결하게

예시:
줄2: ※ 매파(Hawkish)적 입장 │ 물가를 잡기 위해 금리를 높게 유지하거나 인상하려는 강경한 통화정책 태도
줄3: ※ 시장안정 프로그램 │ 1. 외환시장 개입을 통한 환율 안정화 2. 유동성 공급으로 금융시장 충격 완화 3. 필요시 추가경정예산 편성을 통한 경기 부양
[/FOOTNOTES]

[INSIGHT_FOOTNOTES]
ONELINER의 포인트1/포인트2/포인트3에 등장한 용어 중, 경제 입문자가 "이게 뭐지?" 할 만한 것을 포인트별로 1~2개 골라 부연설명을 달아줘.

규칙:
- 반드시 "포인트1:", "포인트2:", "포인트3:" 레이블로 어느 포인트인지 명시할 것
- 설명이 필요 없는 포인트는 생략
- 형식: ※ [용어] │ [설명]  ("이란?" 붙이지 말 것)
- 영어/정식 명칭이 있는 용어는 괄호로 병기할 것 예) 매파(Hawkish)적 입장, 익금불산입(DRD)
- 단순 개념은 한 문장으로 쉽게 설명
- 법/정책/지수처럼 구체적 내용이 있는 건 "1. ... 2. ... 3. ..." 번호 리스트로 내용 나열
- 설명은 경제 초보자도 이해할 수 있게 쉽고 간결하게
[/INSIGHT_FOOTNOTES]`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('Anthropic API error:', JSON.stringify(data));
      return res.status(500).json({ error: data.error?.message || JSON.stringify(data) });
    }

    const fullText = data.content?.[0]?.text || '';
    const summaryMatch = fullText.match(/\[SUMMARY\]([\s\S]*?)(?=\[\/SUMMARY\]|\[ONELINER\]|\[FOOTNOTES\]|$)/);
    const onelinerMatch = fullText.match(/\[ONELINER\]([\s\S]*?)(?=\[\/ONELINER\]|\[FOOTNOTES\]|$)/);
    const footnotesMatch = fullText.match(/\[FOOTNOTES\]([\s\S]*?)(?=\[\/FOOTNOTES\]|$)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';
    const oneliner = onelinerMatch ? onelinerMatch[1].trim() : '';
    const footnotes = footnotesMatch ? footnotesMatch[1].trim() : '';
    const insightFootnotesMatch = fullText.match(/\[INSIGHT_FOOTNOTES\]([\s\S]*?)(?=\[\/INSIGHT_FOOTNOTES\]|$)/);
    const insightFootnotes = insightFootnotesMatch ? insightFootnotesMatch[1].trim() : '';
    res.status(200).json({ summary, oneliner, footnotes, insightFootnotes });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
