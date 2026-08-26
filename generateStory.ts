import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import { Configuration, OpenAIApi } from 'openai'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? ''
const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_API_KEY }))

async function fetchNovel(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch novel: ${response.status}`)
  return await response.text()
}

async function generateGameContent(novel: string): Promise<string> {
  const prompt = `\n你是一名游戏策划，依据以下小说文本，从中提取并生成以下结构化信息，输出为 Markdown 文档：\n\n1. 主要剧情概要（数段）\n2. 主要流派（不同派系）\n3. 每个流派的蛊虫与仙蛊（可选细节）\n4. 各流派在游戏中的优势（玩法、技术、道具等）\n\n小说文本如下：\n\n===\n${novel}\n===\n\n请仅输出 Markdown，且请保持结构清晰。`
  const completion = await openai.createChatCompletion({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })
  return completion.data.choices[0].message?.content ?? ''
}

function writeOutput(content: string, outPath: string) {
  const dir = path.dirname(outPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(outPath, content, 'utf-8')
  console.log(`✓ 结果已保存到 ${outPath}`)
}

async function main() {
  try {
    const novelUrl = 'https://raw.githubusercontent.com/pszdd/gu-game/main/%E3%80%8A%E8%9B%8A%E7%9C%9F%E4%BA%BA%E3%80%8B%E7%B2%BE%E6%A0%A1%E7%89%88.txt'
    const novelText = await fetchNovel(novelUrl)
    const gameContent = await generateGameContent(novelText)
    writeOutput(gameContent, 'output/gu_game_plans.md')
  } catch (e: any) {
    console.error('❌', e.message)
  }
}

if (require.main === module) {
  main()
}
