export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { summary, oneliner, label = '경제' } = req.body;

  if (!summary && !oneliner) {
    return res.status(400).json({ error: 'No content provided' });
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
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `아래는 오늘의 [${label}] 분야 브리핑 내용이야.

[SUMMARY]
${summary}
[/SUMMARY]

[ONELINER]
${oneliner}
[/ONELINER]

위 내용을 바탕으로 아래 스타일 가이드에 따라 뉴스레터 칼럼을 작성해줘.

# Role: 쉽고 재밌는 지식 플랫폼 스타일의 지식 전달 에디터

# Style Guidelines:
1. 톤앤매너:
   - "~해요", "~했대요", "~라고요" 등 친근한 구어체를 사용한다.
   - 독자와 대화하는 듯한 느낌을 주되, 신뢰감을 잃지 않는 선을 지킨다.
   - 적절한 이모지(📈, 🚨, 💡 등)를 활용해 시각적 포인트를 준다.

2. 소제목 작성 규칙 (가장 중요):
   - 소제목은 반드시 **그날의 핵심 내용을 담은 구체적인 질문**으로 만들 것.
   - "무슨 일이 일어난 거야?", "왜 그런 거야?" 같은 **범용 질문은 절대 금지**.
   - 반드시 오늘의 핵심 키워드(수치, 인물, 사건)를 소제목에 녹여낼 것.
   - 예시:
     ❌ "왜 이런 일이 생겼을까?"
     ✅ "환율이 왜 갑자기 1,500원을 넘었을까?"
     ❌ "우리는 어떻게 돼?"
     ✅ "고환율이 지속되면 내 월급은 어떻게 될까?"

3. 내용 구성 기술:
   - "이런 말이 나와요", "얘기가 들려요" 처럼 분위기를 전달하는 표현을 섞는다.
   - 인물이나 단체의 발언은 "내용"이라며 큰따옴표를 활용해 생동감을 준다.
   - 전문 용어는 맥락 속에서 자연스럽게 풀어서 설명한다.

# Output Format (반드시 이 형식 그대로):
헤드라인 (이모지로 마무리)
도입부 2~3문장
---
### 소제목1 (오늘 내용 기반 구체적 질문)
(내용)
### 소제목2 (오늘 내용 기반 구체적 질문)
(내용)
### 소제목3 (오늘 내용 기반 구체적 질문)
(내용)
---
by. Shawn Kim

⚠️ SUMMARY/ONELINER에 없는 수치나 사실은 절대 만들어 쓰지 말 것.
⚠️ 소제목에 범용 질문("무슨 일?", "왜?", "어떻게 돼?") 사용 금지.`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(500).json({ error: data.error?.message || JSON.stringify(data) });
    }

    const column = data.content?.[0]?.text || '';
    res.status(200).json({ column });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
