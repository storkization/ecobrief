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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `⚠️ 출력 형식 규칙 (반드시 준수):
- 마크다운 절대 사용 금지: **, *, #, ---, ___ 등 모든 마크다운 기호 사용 금지
- 지정된 레이블 형식만 사용할 것
- 섹션 태그([SUMMARY], [ONELINER] 등) 그대로 출력할 것

아래는 오늘의 [${label}] 분야 주요 뉴스 헤드라인이야.

헤드라인:
${headlineText}

세 가지를 작성해줘.

[SUMMARY]
반드시 "줄1:", "줄2:", "줄3:" 레이블을 붙일 것. (마크다운 볼드 금지 — 줄1: 형식만 사용)
각 줄은 두 문장으로 구성하되, 아래 규칙을 반드시 따를 것:

규칙:
- 두 문장이 같은 이슈/맥락을 다루면 → 자연스럽게 이어서 한 줄로 작성
- 두 문장이 서로 다른 이슈를 다뤄야 한다면 → "• 문장1\n• 문장2" 형식으로 불릿 분리
- 억지로 무관한 이슈를 한 줄에 끼워 넣지 말 것.
- 모든 내용은 위 헤드라인에 근거할 것. 헤드라인에 없는 정보, 수치, 사실은 절대 만들어 쓰지 말 것.

줄1: (핵심 이슈 — 오늘 가장 중요한 이슈. 헤드라인에 있는 숫자만 포함)
줄2: (시장 흐름 — 줄1 이슈에 대한 시장 반응 또는 파급 흐름)
줄3: (투자 포인트 — 줄1/2 맥락에서 투자자가 지금 봐야 할 것)
[/SUMMARY]

[ONELINER]
전문 경제 분석가로서, 위 SUMMARY의 팩트를 반복하지 말고 그 이면의 인과관계와 파급력에 집중해서 3문장을 작성해줘.

반드시 아래 형식 그대로 출력할 것. 마크다운 볼드 금지. 각 포인트는 줄바꿈으로 구분.

형식:
배경(상황)Why: (문장)
※각주: ※ [이 문장에 실제 등장한 어려운 용어] │ [설명] — 어려운 용어 없으면 이 줄 생략
시장 영향So What: (문장)
※각주: ※ [이 문장에 실제 등장한 어려운 용어] │ [설명] — 어려운 용어 없으면 이 줄 생략
주목할 점Next Move: (문장)
※각주: ※ [이 문장에 실제 등장한 어려운 용어] │ [설명] — 어려운 용어 없으면 이 줄 생략

각주 규칙:
- 반드시 바로 위 포인트 문장에 실제로 등장한 단어만 설명할 것
- 문장에 없는 단어, 연상되는 단어, 관련 개념은 절대 설명하지 말 것
- 예) 문장에 "스태그플레이션"이 없으면 → ※각주 생략
- 예) 문장에 "비용 인플레이션"이 없으면 → ※각주 생략
- 다른 포인트나 다른 섹션의 단어를 가져오지 말 것
- 영어/정식 명칭이 있는 용어는 괄호로 병기 예) 매파(Hawkish)적 입장
- 어려운 용어가 없거나 확신이 없으면 ※각주: 줄 자체를 생략

포인트 작성 규칙:
배경(상황)Why: "[현상]은 [배경]에서 기인한 것으로, 이는 [메커니즘] 때문입니다" 형식
시장 영향So What: "이로 인해 [피해/변화]가 예상되며, 특히 [섹터/지표]의 위축이 불가피합니다" 형식
주목할 점Next Move: "향후 [지표/수치]의 돌파 여부를 통해 [방향성/전환점]을 확인해야 합니다" 형식

예시:
배경(상황)Why: 환율 1,500원 돌파는 중동 지정학적 리스크가 글로벌 공급망 불안을 야기하며 달러 강세를 심화시킨 데 기인합니다.
※각주: ※ 지정학적 리스크 │ 전쟁·분쟁 등 특정 지역의 정치적 불안이 국제 경제에 미치는 위협
시장 영향So What: 고유가와 고환율의 이중 충격으로 기업 생산비용이 급증하며 영업이익 훼손이 불가피합니다.
※각주: ※ 비용 인플레이션 │ 원자재·에너지 가격 상승으로 기업 생산비용이 올라가 물가가 뛰는 현상
주목할 점Next Move: 향후 CPI 발표 수치와 한국은행 금통위 발언에서 금리 인상 시그널을 포착해야 합니다.

⚠️ 헤드라인에 없는 정보와 수치는 절대 만들어 쓰지 말 것.
[/ONELINER]

[FOOTNOTES]
SUMMARY의 줄1/줄2/줄3에 등장한 용어 중, 경제 입문자가 모를 만한 것을 줄별로 1~2개 골라 설명을 달아줘.

규칙:
- 반드시 "줄1:", "줄2:", "줄3:" 레이블 사용 (마크다운 볼드 금지)
- 설명이 필요 없는 줄은 생략
- 형식: ※ [용어] │ [설명]
- 영어/정식 명칭이 있는 용어는 괄호로 병기 예) 매파(Hawkish)적 입장
- 단순 개념은 한 문장으로 설명
- 법/정책/지수는 "1. ... 2. ... 3. ..." 번호 리스트로 나열
- 경제 초보자도 이해할 수 있게 쉽고 간결하게
- ⚠️ 절대 규칙1: 해당 줄 본문에 실제로 등장한 단어만 설명할 것. 본문에 없는 단어를 임의로 추가하거나 유추해서 설명하지 말 것.
- ⚠️ 절대 규칙2: ONELINER나 다른 섹션에 등장한 단어를 여기에 가져오지 말 것. 오직 SUMMARY의 해당 줄 텍스트만 참조할 것.

예시:
줄2: ※ 매파(Hawkish)적 입장 │ 물가를 잡기 위해 금리를 높게 유지하거나 인상하려는 강경한 통화정책 태도
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
    const summaryMatch       = fullText.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
    const onelinerMatch      = fullText.match(/\[ONELINER\]([\s\S]*?)\[\/ONELINER\]/);
    const footnotesMatch     = fullText.match(/\[FOOTNOTES\]([\s\S]*?)\[\/FOOTNOTES\]/);
    const insightFootnotesMatch = null;
    const summary        = summaryMatch        ? summaryMatch[1].trim()        : '';
    const oneliner       = onelinerMatch       ? onelinerMatch[1].trim()       : '';
    const footnotes      = footnotesMatch      ? footnotesMatch[1].trim()      : '';
    res.status(200).json({ summary, oneliner, footnotes });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
