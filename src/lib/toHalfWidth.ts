export const toHalfWidth = (str: string): string => {
  return str
    .replace(/[\uFF01-\uFF5E]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    })
    .replace(/\u3000/g, ' ') // 全角スペースを半角スペースに
}
