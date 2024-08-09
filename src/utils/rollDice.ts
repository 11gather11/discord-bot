import { toHalfWidth } from './toHalfWidth'

export const rollDice = (expression: string): { success: boolean; message: string } => {
	// 正規表現で複数のダイス式を抽出
	const convertExpression = toHalfWidth(expression)
	const dicePatterns = convertExpression.split('+')
	const rolls: number[] = []
	const results: string[] = []

	for (const pattern of dicePatterns) {
		const match = pattern.trim().match(/^(\d+)d(\d+)$/)
		if (!match) {
			return {
				success: false,
				message: '無効なフォーマットです。NdM形式を使用してください（例:2d6）。',
			}
		}
		const numDice = Number.parseInt(match[1], 10)
		const sides = Number.parseInt(match[2], 10)
		const patternRolls: number[] = []
		for (let i = 0; i < numDice; i++) {
			patternRolls.push(Math.floor(Math.random() * sides) + 1)
		}
		rolls.push(...patternRolls)
		results.push(`(${patternRolls.join(' + ')})`)
	}

	const total = rolls.reduce((acc, cur) => acc + cur, 0)

	let message: string
	if (dicePatterns.length > 1) {
		message = `${convertExpression} → ${results.join(' + ')} = ${total}`
	} else {
		message = `${convertExpression} → ${results[0]} = ${total}`
	}

	return { success: true, message }
}
