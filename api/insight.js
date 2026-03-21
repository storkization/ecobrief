export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { summary, footnotes = '', label = '경제' } = req.body;

  if (!summary) {
    return res.status(400).json({ error: 'No summary provided' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `아래는 오늘의 [${label}] 분야 브리핑 요약이야.

[SUMMARY]
${summary}
[/SUMMARY]

[FOOTNOTES]
${footnotes}
[/FOOTNOTES]

전문 경제 분석가로서, 위 SUMMARY의 팩트를 반복하지 말고 그 이면의 인과관계와 파급력에 집중해서 3문장을 작성해줘.

⚠️ 출력 형식 규칙:
- 마크다운 절대 사용 금지: **, *, #, ---, ___ 등 모든 마크다운 기호 사용 금지
- 아래 형식 그대로 출력할 것

[ONELINER]
형식:
배경(상황)Why: (문장)
※각주: ※ [위 문장에서 그대로 복사한 단어] — [설명] (없으면 생략)
시장 영향So What: (문장)
※각주: ※ [위 문장에서 그대로 복사한 단어] — [설명] (없으면 생략)
주목할 점Next Move: (문장)
※각주: ※ [위 문장에서 그대로 복사한 단어] — [설명] (없으면 생략)

각주 규칙:
- [위 문장에서 그대로 복사한 단어] = 위 문장 텍스트에서 글자 그대로 찾을 수 있는 단어여야 함
- 문장에 없는 단어, 연상되는 단어, 관련 개념은 절대 설명하지 말 것
- 확신이 없으면 ※각주: 줄 자체를 생략할 것
- 영어/정식 명칭이 있는 용어는 괄호로 병기 예) 매파(Hawkish)적 입장
- ⚠️ FOOTNOTES에서 이미 설명된 용어는 절대 다시 설명하지 말 것. 중복 금지.

포인트 작성 규칙:
배경(상황)Why: "[현상]은 [배경]에서 기인한 것으로, 이는 [메커니즘] 때문입니다" 형식
시장 영향So What: "이로 인해 [피해/변화]가 예상되며, 특히 [섹터/지표]의 위축이 불가피합니다" 형식
주목할 점Next Move: "향후 [지표/수치]의 돌파 여부를 통해 [방향성/전환점]을 확인해야 합니다" 형식

예시:
배경(상황)Why: 환율 1,500원 돌파는 중동 지정학적 리스크가 글로벌 공급망 불안을 야기하며 달러 강세를 심화시킨 데 기인합니다.
※각주: ※ 지정학적 리스크 — 전쟁·분쟁 등 특정 지역의 정치적 불안이 국제 경제에 미치는 위협
시장 영향So What: 고유가와 고환율의 이중 충격으로 기업 생산비용이 급증하며 영업이익 훼손이 불가피합니다.
※각주: ※ 비용 인플레이션 — 원자재·에너지 가격 상승으로 기업 생산비용이 올라가 물가가 뛰는 현상
주목할 점Next Move: 향후 CPI 발표 수치와 한국은행 금통위 발언에서 금리 인상 시그널을 포착해야 합니다.

⚠️ SUMMARY에 없는 정보와 수치는 절대 만들어 쓰지 말 것.
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
