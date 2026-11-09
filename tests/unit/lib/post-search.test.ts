import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
const { database, hydrate } = vi.hoisted(() => ({ database:{ select:vi.fn(), selectDistinct:vi.fn() }, hydrate:vi.fn() }))
vi.mock('@/db', () => ({db:database}))
vi.mock('@/lib/site-content', () => ({getPublishedContent:hydrate}))
import { normalizePostSearch, searchPattern, searchPublishedPosts } from '@/lib/post-search'

describe('public post search', () => {
  beforeEach(() => vi.clearAllMocks())
  it('bounds untrusted input and rejects ambiguous array parameters', () => {
    expect(normalizePostSearch({q:['one','two'],page:['2']})).toEqual({query:'',page:1})
    expect(normalizePostSearch({q:'  news\u0000  ',page:'-3'})).toEqual({query:'news',page:1})
    expect(normalizePostSearch({q:'x'.repeat(500),page:'9999999999999999999999'})).toEqual({query:'x'.repeat(160),page:1})
    expect(searchPattern('100%_\\')).toBe('%100\\%\\_\\\\%')
  })
  it('does not scan or list all posts for an empty search', async () => {
    expect((await searchPublishedPosts({q:'   '},'ar')).posts).toEqual([])
    expect(database.select).not.toHaveBeenCalled()
  })
  it('parameterizes input, filters language and publication/password status, and clamps pagination', async () => {
    const where = vi.fn().mockResolvedValue([{total:13}])
    database.select.mockReturnValue({from:()=>({innerJoin:()=>({where})})})
    const offset = vi.fn().mockResolvedValue([{id:BigInt(123),date:new Date()}])
    database.selectDistinct.mockReturnValue({from:()=>({innerJoin:()=>({where:()=>({orderBy:()=>({limit:()=>({offset})})})})})})
    hydrate.mockResolvedValue([{id:'123',locale:'ar'}])
    const malicious = "' OR 1=1; -- %"
    const result = await searchPublishedPosts({q:malicious,page:'999'},'ar')
    expect(result.page).toBe(2)
    expect(offset).toHaveBeenCalledWith(12)
    const statement = new PgDialect().sqlToQuery(where.mock.calls[0][0])
    expect(statement.sql).not.toContain(malicious)
    expect(statement.sql).toContain('"post_password"')
    expect(statement.params).toEqual(expect.arrayContaining(['post','publish','','ar',searchPattern(malicious)]))
    expect(hydrate).toHaveBeenCalledWith('post',undefined,12,'ar',[BigInt(123)])
  })
})
