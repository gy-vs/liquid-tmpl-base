import { Liquid, Variable, analyzeSync } from '../../../src'

describe('parenthesized conditions', function () {
  const liquid = new Liquid()

  describe('grouping with parentheses', function () {
    it('should evaluate parenthesized group first', async function () {
      const src = '{% if (vip or coupon) and active %}if{% else %}else{% endif %}'
      const html = await liquid.parseAndRender(src, { vip: true, coupon: false, active: false })
      expect(html).toBe('else')
    })
    it('should keep right-to-left evaluation without parentheses', async function () {
      const src = '{% if vip or coupon and active %}if{% else %}else{% endif %}'
      const html = await liquid.parseAndRender(src, { vip: true, coupon: false, active: false })
      expect(html).toBe('if')
    })
    it('should support group on the right of an operator', async function () {
      const src = '{% if active and (vip or coupon) %}if{% else %}else{% endif %}'
      const html = await liquid.parseAndRender(src, { vip: true, coupon: false, active: false })
      expect(html).toBe('else')
    })
    it('should support a single value in parentheses', async function () {
      const src = '{% if (vip) %}if{% else %}else{% endif %}'
      const html = await liquid.parseAndRender(src, { vip: true })
      expect(html).toBe('if')
    })
    it('should support nested parentheses', async function () {
      const src = '{% if ((a or b) and (c or d)) %}if{% else %}else{% endif %}'
      expect(await liquid.parseAndRender(src, { a: false, b: true, c: true, d: false })).toBe('if')
      expect(await liquid.parseAndRender(src, { a: false, b: true, c: false, d: false })).toBe('else')
    })
    it('should support deeply nested parentheses', async function () {
      const src = '{% if (((a or b))) %}if{% else %}else{% endif %}'
      const html = await liquid.parseAndRender(src, { a: false, b: true })
      expect(html).toBe('if')
    })
    it('should support comparisons in parentheses', async function () {
      const src = '{% if (score > 80 and level == "gold") or admin %}if{% else %}else{% endif %}'
      expect(await liquid.parseAndRender(src, { score: 90, level: 'gold', admin: false })).toBe('if')
      expect(await liquid.parseAndRender(src, { score: 90, level: 'silver', admin: false })).toBe('else')
      expect(await liquid.parseAndRender(src, { score: 90, level: 'silver', admin: true })).toBe('if')
    })
    it('should support contains in parentheses', async function () {
      const src = '{% if (tags contains "sale") or admin %}if{% else %}else{% endif %}'
      expect(await liquid.parseAndRender(src, { tags: ['sale'], admin: false })).toBe('if')
      expect(await liquid.parseAndRender(src, { tags: ['new'], admin: false })).toBe('else')
    })
    it('should support not before parentheses', async function () {
      const src = '{% if not (a or b) %}if{% else %}else{% endif %}'
      expect(await liquid.parseAndRender(src, { a: false, b: false })).toBe('if')
      expect(await liquid.parseAndRender(src, { a: true, b: false })).toBe('else')
    })
    it('should support blanks in parentheses', async function () {
      const src = '{% if ( a or b ) and c %}if{% else %}else{% endif %}'
      const html = await liquid.parseAndRender(src, { a: true, b: false, c: true })
      expect(html).toBe('if')
    })
    it('should support parentheses in unless', async function () {
      const src = '{% unless (a and b) or c %}unless{% else %}else{% endunless %}'
      expect(await liquid.parseAndRender(src, { a: true, b: true, c: false })).toBe('else')
      expect(await liquid.parseAndRender(src, { a: true, b: false, c: false })).toBe('unless')
    })
    it('should support parentheses in elsif', async function () {
      const src = '{% if x %}a{% elsif (a and b) or c %}b{% else %}c{% endif %}'
      expect(await liquid.parseAndRender(src, { x: false, a: true, b: true, c: false })).toBe('b')
      expect(await liquid.parseAndRender(src, { x: false, a: true, b: false, c: false })).toBe('c')
    })
    it('should support parentheses in liquid tag', async function () {
      const src = '{% liquid\n  if (a or b) and c\n    echo "if"\n  else\n    echo "else"\n  endif\n%}'
      expect(await liquid.parseAndRender(src, { a: true, b: false, c: true })).toBe('if')
      expect(await liquid.parseAndRender(src, { a: true, b: false, c: false })).toBe('else')
    })
    it('should render synchronously', function () {
      const src = '{% if (vip or coupon) and active %}if{% else %}else{% endif %}'
      const html = liquid.parseAndRenderSync(src, { vip: true, coupon: false, active: false })
      expect(html).toBe('else')
    })
  })

  describe('range literals', function () {
    it('should still read range literals in conditions', async function () {
      const src = '{% if (1..3) contains 2 %}if{% else %}else{% endif %}'
      const html = await liquid.parseAndRender(src)
      expect(html).toBe('if')
    })
    it('should still read range literals with variables', async function () {
      const src = '{% if (low..high) contains 3 %}if{% else %}else{% endif %}'
      const html = await liquid.parseAndRender(src, { low: 1, high: 5 })
      expect(html).toBe('if')
    })
    it('should still read range literals in for tags', async function () {
      const src = '{% for i in (1..3) %}{{ i }}{% endfor %}'
      const html = await liquid.parseAndRender(src)
      expect(html).toBe('123')
    })
    it('should support range literals in parentheses', async function () {
      const src = '{% if ((1..3) contains 2) or admin %}if{% else %}else{% endif %}'
      expect(await liquid.parseAndRender(src, { admin: false })).toBe('if')
    })
  })

  describe('syntax errors', function () {
    it('should throw if not closed', function () {
      const src = '{% if (vip or coupon %}yes{% endif %}'
      return expect(liquid.parseAndRender(src, {}))
        .rejects.toThrow(/parenthesized expression not closed, line:1, col:7/)
    })
    it('should throw if empty', function () {
      const src = '{% if () %}yes{% endif %}'
      return expect(liquid.parseAndRender(src, {}))
        .rejects.toThrow(/empty parenthesized expression, line:1, col:7/)
    })
    it('should throw if closed immediately after another group', function () {
      const src = '{% if (a or b)) %}yes{% endif %}'
      return expect(liquid.parseAndRender(src, { a: true, b: false }))
        .rejects.toThrow()
    })
  })

  describe('parenthesizedConditions option', function () {
    it('should be enabled by default', async function () {
      const src = '{% if (vip or coupon) and active %}if{% else %}else{% endif %}'
      const html = await new Liquid().parseAndRender(src, { vip: true, coupon: false, active: false })
      expect(html).toBe('else')
    })
    it('should throw for parentheses when disabled', function () {
      const liquid = new Liquid({ parenthesizedConditions: false })
      const src = '{% if (vip or coupon) and active %}if{% endif %}'
      return expect(liquid.parseAndRender(src, {}))
        .rejects.toThrow(/invalid range syntax/)
    })
    it('should still support range literals when disabled', async function () {
      const liquid = new Liquid({ parenthesizedConditions: false })
      const src = '{% if (1..3) contains 2 %}if{% else %}else{% endif %}'
      const html = await liquid.parseAndRender(src)
      expect(html).toBe('if')
    })
  })

  describe('out of scope syntax', function () {
    it('should not support parentheses in output', function () {
      const src = '{{ (vip or coupon) }}'
      return expect(liquid.parseAndRender(src, {}))
        .rejects.toThrow(/invalid range syntax/)
    })
    it('should not support parentheses in when', function () {
      const src = '{% case x %}{% when (1 or 2) %}a{% endcase %}'
      return expect(liquid.parseAndRender(src, {}))
        .rejects.toThrow(/invalid range syntax/)
    })
  })

  describe('static analysis', function () {
    it('should report variables in parenthesized conditions', function () {
      const template = liquid.parse('{% if (vip or coupon) and active %}yes{% endif %}')
      const analysis = analyzeSync(template)

      const vip = new Variable(['vip'], { row: 1, col: 8, file: undefined })
      const coupon = new Variable(['coupon'], { row: 1, col: 15, file: undefined })
      const active = new Variable(['active'], { row: 1, col: 27, file: undefined })

      expect(analysis).toStrictEqual({
        variables: { vip: [vip], coupon: [coupon], active: [active] },
        globals: { vip: [vip], coupon: [coupon], active: [active] },
        locals: {}
      })
    })
    it('should report variables in nested parentheses', function () {
      const template = liquid.parse('{% if ((a or b) and (c or d)) %}yes{% endif %}')
      const analysis = analyzeSync(template)

      expect(Object.keys(analysis.globals).sort()).toEqual(['a', 'b', 'c', 'd'])
    })
  })
})
