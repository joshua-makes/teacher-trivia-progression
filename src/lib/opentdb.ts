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
    return data.results
  } catch {
    return null
  }
}

export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&hellip;/g, '…')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
}
