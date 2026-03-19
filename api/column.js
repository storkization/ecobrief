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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
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

2. 구조화:
   - [헤드라인]: 핵심 수치나 사건을 포함하고 이모지로 마무리한다.
   - [도입부]: 전체 내용을 2~3문장으로 압축하여 흥미를 유발한다.
   - [소제목]: "무슨 일이 일어난 거야?", "왜 그런 거야?", "우리는 어떻게 돼?" 처럼 독자가 물어볼 법한 질문 형식으로 작성한다.
   - [본문]: 각 소제목 아래에 핵심 내용을 3~5문장 내외로 서술한다.

3. 내용 구성 기술:
   - "이런 말이 나와요", "얘기가 들려요" 처럼 분위기를 전달하는 표현을 섞는다.
   - 인물이나 단체의 발언은 "내용" 이라며 큰따옴표를 활용해 생동감을 준다.
   - 전문 용어는 맥락 속에서 자연스럽게 풀어서 설명한다.

# Output Format (반드시 이 형식 그대로):
[헤드라인]
(도입부 문단)
---
### 소제목1
(내용)
### 소제목2
(내용)
### 소제목3
(내용)
---
by. Shawn Kim

⚠️ SUMMARY/ONELINER에 없는 수치나 사실은 절대 만들어 쓰지 말 것.`
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
