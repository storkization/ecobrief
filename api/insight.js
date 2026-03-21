export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { summary, footnotes = '', headlines = [], label = '경제' } = req.body;

  if (!summary) {
    return res.status(400).json({ error: 'No summary provided' });
  }

  try {
    const headlineText = headlines.length
      ? headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')
      : '';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        messages: [{
          role: 'user',
          content: `너는 15년 경력의 글로벌 매크로 이코노미스트다. 표면적 뉴스 너머의 구조적 원인, 숨겨진 연쇄 효과, 실전 투자 판단 기준을 제시하는 것이 너의 역할이다.

아래는 오늘의 [${label}] 분야 정보야.

[오늘의 헤드라인]
${headlineText || '(없음)'}
[/오늘의 헤드라인]

[SUMMARY — 이미 독자에게 전달된 내용]
${summary}
[/SUMMARY]

[FOOTNOTES — 이미 설명된 용어]
${footnotes}
[/FOOTNOTES]

⚠️ 핵심 원칙:
- SUMMARY는 독자가 이미 읽었다. SUMMARY의 내용을 반복하거나 다시 요약하면 실패다.
- FOOTNOTES에서 이미 설명한 용어를 다시 설명하면 실패다.
- 너의 역할은 SUMMARY에 없는 새로운 분석을 제공하는 것이다.

⚠️ 출력 형식 규칙:
- 마크다운 절대 사용 금지: **, *, #, ---, ___ 등 모든 마크다운 기호 사용 금지
- 아래 형식 그대로 출력할 것

[ONELINER]
배경(상황)Why: (문장)
※각주: ※ [위 문장에서 그대로 복사한 단어] — [설명] (없으면 생략)
시장 영향So What: (문장)
※각주: ※ [위 문장에서 그대로 복사한 단어] — [설명] (없으면 생략)
주목할 점Next Move: (문장)
※각주: ※ [위 문장에서 그대로 복사한 단어] — [설명] (없으면 생략)

각 포인트 작성 기준:

배경(상황)Why:
- SUMMARY가 "무슨 일이 일어났는가"를 말했다면, 너는 "왜 지금 이 타이밍에 터졌는가"를 말해야 한다
- 헤드라인과 SUMMARY에서 직접 언급하지 않은 구조적 배경을 제시할 것 (정책 사이클, 글로벌 자금 흐름, 역사적 전례 등)
- 예시 수준: "이번 환율 급등은 단순 달러 강세가 아니라, 2022년 이후 누적된 경상수지 적자와 외국인 채권자금 이탈이 동시에 현실화된 것"

시장 영향So What:
- SUMMARY에 언급된 직접 영향이 아닌, 2차·3차 파급 효과를 다룰 것
- 다른 섹터, 다른 자산군, 또는 실물경제(소비자·기업·가계)로의 전이 경로를 제시할 것
- 예시 수준: "원자재 수입 비중이 높은 식품·화학 업종의 마진 압박이 2분기 실적에 반영되며, 이는 고용 축소로 이어질 수 있다"

주목할 점Next Move:
- 추상적 전망이 아닌 구체적 분기점을 제시할 것 (특정 수치, 날짜, 이벤트)
- "A면 B, 아니면 C" 시나리오 구조를 사용할 것
- 예시 수준: "4월 금통위에서 인상 소수의견이 2명 이상 나오면 6월 인상이 현실화되고, 전원 동결이면 하반기까지 관망 국면이 이어진다"

각주 규칙:
- 위 문장에서 글자 그대로 찾을 수 있는 단어만 설명
- FOOTNOTES에서 이미 설명한 용어는 절대 다시 설명하지 말 것
- 확신이 없으면 ※각주: 줄 자체를 생략
- 영어/정식 명칭이 있으면 괄호 병기 예) 매파(Hawkish)적 입장

⚠️ SUMMARY에 없는 수치를 만들어 쓰지 말 것. 단, 구조적 배경 설명과 시나리오 분기는 너의 전문 지식으로 작성할 것.
[/ONELINER]`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('Insight API error:', JSON.stringify(data));
      return res.status(500).json({ error: data.error?.message || JSON.stringify(data) });
    }

    const fullText = data.content?.[0]?.text || '';
    console.log('[INSIGHT] fullText 길이:', fullText.length);

    let onelinerMatch = fullText.match(/\[ONELINER\]([\s\S]*?)\[\/ONELINER\]/);
    if (!onelinerMatch && fullText.includes('배경(상황)Why:')) {
      const olFallback = fullText.match(/(배경\(상황\)Why:[\s\S]*?주목할 점Next Move:[\s\S]*?)$/);
      if (olFallback) onelinerMatch = [null, olFallback[1]];
    }

    const oneliner = onelinerMatch ? onelinerMatch[1].trim() : '';
    console.log('[INSIGHT] oneliner 길이:', oneliner.length);

    res.status(200).json({ oneliner });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
