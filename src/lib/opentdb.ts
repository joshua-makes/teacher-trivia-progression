export type OpenTDBQuestion = {
  question: string
  correct_answer: string
  incorrect_answers: string[]
  difficulty: string
  category: string
}

type OpenTDBResponse = {
  response_code: number
  results: OpenTDBQuestion[]
}

export async function fetchQuestions(
  categoryId: number,
  difficulty: string,
  amount = 10
): Promise<OpenTDBQuestion[] | null> {
  try {
    const url = `https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&difficulty=${difficulty}&type=multiple`
    const res = await fetch(url, { next: { revalidate: 0 } } as RequestInit & { next?: { revalidate?: number } })
    if (!res.ok) return null
    const data: OpenTDBResponse = await res.json()
    if (data.response_code !== 0) return null
    return data.results.map(q => ({
      ...q,
      question: decodeHtmlEntities(q.question),
      correct_answer: decodeHtmlEntities(q.correct_answer),
      incorrect_answers: q.incorrect_answers.map(decodeHtmlEntities),
    }))
  } catch {
    return null
  }
}

export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&amp;/g, '&')
}
