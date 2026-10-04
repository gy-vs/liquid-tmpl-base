import { RangeToken } from './range-token'
import { LiteralToken } from './literal-token'
import { NumberToken } from './number-token'
import { QuotedToken } from './quoted-token'
import { PropertyAccessToken } from './property-access-token'
import { ParenthesizedToken } from './parenthesized-token'

export type ValueToken = RangeToken | LiteralToken | QuotedToken | PropertyAccessToken | NumberToken | ParenthesizedToken
