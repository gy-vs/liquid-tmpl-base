import { Token } from './token'
import { TokenKind } from '../parser'
import type { Expression } from '../render'

/**
 * A parenthesized expression in a conditional tag, e.g. `(vip or coupon)`
 * in `{% if (vip or coupon) and active %}`.
 */
export class ParenthesizedToken extends Token {
  public constructor (
    public input: string,
    public begin: number,
    public end: number,
    public expression: Expression,
    public file?: string
  ) {
    super(TokenKind.Parenthesized, input, begin, end, file)
  }
}
