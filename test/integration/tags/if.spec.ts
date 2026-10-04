import { Liquid, Drop } from '../../../src'

describe('tags/if', function () {
  const liquid = new Liquid()
  const scope = {
    one: 1,
    two: 2,
    emptyString: '',
    emptyArray: []
  }

  class BooleanDrop extends Drop {
    public valueOf () {
      return false
    }
  }

  it('should throw if not closed', function () {
    const src = '{% if false%}yes'
    return expect(liquid.parseAndRender(src, scope))
      .rejects.toThrow(/tag {% if false%} not closed/)
  })
  it('should support nested', async function () {
    const src = '{%if false%}{%if true%}{%else%}a{%endif%}{%endif%}'
    const html = await liquid.parseAndRender(src, scope)
    return expect(html).toBe('')
  })

  it('should throw for additional args', function () {
    const src = "{% if foo %} foo {% else foo = 'blah' %} {% endif %}"
    return expect(liquid.parseAndRender(src, scope))
      .rejects.toThrow(`unexpected "foo = 'blah'", line:1, col:1`)
  })

  describe('single value as condition', function () {
    it('should support boolean', async function () {
      const src = '{% if false %}1{%elsif true%}2{%else%}3{%endif%}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('2')
    })
    it('should treat Array truthy', async function () {
      const src = '{%if emptyArray%}a{%endif%}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('a')
    })
    it('should return true if empty string', async function () {
      const src = '{%if emptyString%}a{%endif%}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('a')
    })
  })
  describe('expression as condition', function () {
    it('should support ==', async function () {
      const src = '{% if 2 == 3 %}yes{%else%}no{%endif%}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('no')
    })
    it('should support >=', async function () {
      const src = '{% if 1 >= 2 and one<two %}a{%endif%}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('')
    })
    it('should support !=', async function () {
      const src = '{% if one != two %}yes{%else%}no{%endif%}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('yes')
    })
    it('should support value and expression', async function () {
      const src = `X{%if version and version != '' %}x{{version}}y{%endif%}Y`
      const scope = { 'version': '' }
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('XY')
    })
    it('should evaluate right to left', async function () {
      const src = `{% if false and false or true %}true{%endif%}`
      const html = await liquid.parseAndRender(src)
      return expect(html).toBe('')
    })
    it('should allow no spaces around operator for literal', async function () {
      const src = `{% if true==true %}success{%else%}fail{% endif %}`
      const html = await liquid.parseAndRender(src)
      return expect(html).toBe('success')
    })
    it('should allow no spaces around operator for variables', async function () {
      const src = `{%assign var = 1%}{%if var ==1%}success{%else%}fail{%endif%}`
      const html = await liquid.parseAndRender(src)
      return expect(html).toBe('success')
    })
  })
  describe('filters as condition', function () {
    it('should support filter on expression', async function () {
      liquid.registerFilter('negate', (val) => !val)
      const src = '{% if 2 == 3 | negate %}yes{%else%}no{%endif%}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('yes')
    })
  })
  describe('compare to null', function () {
    it('should evaluate false for null < 10', async function () {
      const src = '{% if null < 10 %}yes{% else %}no{% endif %}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('no')
    })

    it('should evaluate false for null > 10', async function () {
      const src = '{% if null > 10 %}yes{% else %}no{% endif %}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('no')
    })

    it('should evaluate false for null <= 10', async function () {
      const src = '{% if null <= 10 %}yes{% else %}no{% endif %}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('no')
    })

    it('should evaluate false for null >= 10', async function () {
      const src = '{% if null >= 10 %}yes{% else %}no{% endif %}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('no')
    })

    it('should evaluate false for 10 < null', async function () {
      const src = '{% if 10 < null %}yes{% else %}no{% endif %}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('no')
    })

    it('should evaluate false for 10 > null', async function () {
      const src = '{% if 10 > null %}yes{% else %}no{% endif %}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('no')
    })

    it('should evaluate false for 10 <= null', async function () {
      const src = '{% if 10 <= null %}yes{% else %}no{% endif %}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('no')
    })

    it('should evaluate false for 10 >= null', async function () {
      const src = '{% if 10 >= null %}yes{% else %}no{% endif %}'
      const html = await liquid.parseAndRender(src, scope)
      return expect(html).toBe('no')
    })
  })
  it('should support sync', function () {
    const src = '{%if true%}true{%else%}false{%endif%}'
    const html = liquid.parseAndRenderSync(src, scope)
    return expect(html).toBe('true')
  })
  it('should support async variables', async () => {
    const src = `{%if var == 'var' %}success{%endif%}`
    const scope = { 'var': Promise.resolve('var') }
    const html = await liquid.parseAndRender(src, scope)
    return expect(html).toBe('success')
  })
  it('should support drop as condition variable', async () => {
    const src = `{% if drop %}yes{% else %}no{% endif %}`
    const scope = { drop: new BooleanDrop() }
    const html = await liquid.parseAndRender(src, scope)
    return expect(html).toBe('no')
  })
  it('should throw for duplicated else', () => {
    expect(() => liquid.parseAndRenderSync('{% if false %}{% else %}{% else %}{% endif %}'))
      .toThrow(`duplicated else`)
  })
  it('should throw for unexpected elsif', () => {
    expect(() => liquid.parseAndRenderSync('{% if false %}{% else %}{% elsif true %}{% endif %}'))
      .toThrow(`unexpected elsif after else`)
  })

  describe('parenthesized expressions', function () {
    it('should evaluate grouped operands first', async function () {
      const src = '{% if (vip or coupon) and active %}yes{% else %}no{% endif %}'
      const html = await liquid.parseAndRender(src, { vip: true, coupon: false, active: false })
      return expect(html).toBe('no')
    })
    it('should keep right associativity without parentheses', async function () {
      const src = '{% if vip or coupon and active %}yes{% else %}no{% endif %}'
      const html = await liquid.parseAndRender(src, { vip: true, coupon: false, active: false })
      return expect(html).toBe('yes')
    })
    it('should support comparisons in groups', async function () {
      const src = '{% if (score > 80 and level == "gold") or admin %}yes{% else %}no{% endif %}'
      expect(await liquid.parseAndRender(src, { score: 90, level: 'silver', admin: false })).toBe('no')
      expect(await liquid.parseAndRender(src, { score: 90, level: 'gold', admin: false })).toBe('yes')
      expect(await liquid.parseAndRender(src, { score: 0, level: 'silver', admin: true })).toBe('yes')
    })
    it('should support contains in groups', async function () {
      const src = '{% if (tags contains "vip") or admin %}yes{% else %}no{% endif %}'
      expect(await liquid.parseAndRender(src, { tags: ['normal'], admin: false })).toBe('no')
      expect(await liquid.parseAndRender(src, { tags: ['vip'], admin: false })).toBe('yes')
    })
    it('should support nested parentheses', async function () {
      const src = '{% if ((a or b) and (c or d)) %}yes{% else %}no{% endif %}'
      expect(await liquid.parseAndRender(src, { a: true, b: false, c: false, d: true })).toBe('yes')
      expect(await liquid.parseAndRender(src, { a: true, b: false, c: false, d: false })).toBe('no')
    })
    it('should support parentheses in elsif', async function () {
      const src = '{% if a %}1{% elsif (b or c) %}2{% else %}3{% endif %}'
      const html = await liquid.parseAndRender(src, { a: false, b: false, c: true })
      return expect(html).toBe('2')
    })
    it('should still parse ranges', async function () {
      expect(await liquid.parseAndRender('{% if (1..3) contains 2 %}yes{% else %}no{% endif %}')).toBe('yes')
      expect(await liquid.parseAndRender('{% if (a..b) contains 2 %}yes{% else %}no{% endif %}', { a: 1, b: 3 })).toBe('yes')
    })
    it('should support ranges inside groups', async function () {
      const src = '{% if ((1..3) contains 2) and x %}yes{% else %}no{% endif %}'
      return expect(await liquid.parseAndRender(src, { x: true })).toBe('yes')
    })
    it('should throw for missing closing parenthesis', function () {
      const src = '{% if (a or b %}yes{% endif %}'
      return expect(() => liquid.parse(src)).toThrow(/missing closing parenthesis/)
    })
    it('should throw for empty parentheses', function () {
      const src = '{% if () %}yes{% endif %}'
      return expect(() => liquid.parse(src)).toThrow(/value expected/)
    })
    it('should report the position for missing closing parenthesis', async function () {
      const src = '{% if (a or b %}yes{% endif %}'
      expect(() => liquid.parse(src)).toThrow(/line:1, col:7/)
    })
    it('can be disabled', async function () {
      const legacy = new Liquid({ parenthesizedExpressions: false })
      const src = '{% if (vip or coupon) and active %}yes{% else %}no{% endif %}'
      expect(() => legacy.parse(src)).toThrow(/invalid range syntax/)
      return expect(legacy.parseAndRender('{% for i in (1..3) %}{{ i }}{% endfor %}')).resolves.toBe('123')
    })
  })
})
