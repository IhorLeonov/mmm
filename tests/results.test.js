import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import handler from '../api/results.js'
import { details, helpers, makeResult, moods, needs } from '../src/story.js'

const answers = { mood: 'sad', need: 'cat', helper: 'pigeon', detail: 'chaos' }
const payload = { sessionId: '9334e915-54a1-47bc-8ab2-661898efb83b', answers, challengeComplete: true, completedAt: '2026-10-26T19:00:00.000Z' }

async function request(body = payload, { method = 'POST', origin = 'http://localhost:5173', raw = false } = {}) {
  const req = Readable.from(raw ? [body] : [])
  req.method = method
  req.headers = { host: 'localhost:5173', origin, 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.1' }
  if (!raw) req.body = body
  const res = { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value }, end(value) { this.data = JSON.parse(value) } }
  await handler(req, res)
  return res
}

test('every real route produces a complete plan and the secret is reachable', () => {
  let count = 0
  for (const mood of moods) for (const need of needs) for (const helper of helpers) for (const detail of details[need.id].choices) {
    const result = makeResult({ mood: mood.id, need: need.id, helper: helper.id, detail: detail.id })
    assert.equal(result.recipe.length, 3)
    assert.ok(result.title && result.introduction && result.extra)
    count += 1
  }
  assert.equal(count, 48)
  assert.equal(makeResult(answers).secret, true)
  assert.equal(makeResult({ ...answers, helper: 'cat' }).secret, false)
  assert.notEqual(makeResult(answers).introduction, makeResult({ ...answers, mood: 'happy' }).introduction)
})

test('mail endpoint validates and delivers only the canonical result', async (t) => {
  const old = { RESEND_API_KEY: process.env.RESEND_API_KEY, RESULTS_EMAIL: process.env.RESULTS_EMAIL, EMAIL_FROM: process.env.EMAIL_FROM, APP_ORIGIN: process.env.APP_ORIGIN }
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
    for (const [key, value] of Object.entries(old)) value === undefined ? delete process.env[key] : process.env[key] = value
  })
  delete process.env.APP_ORIGIN
  delete process.env.RESEND_API_KEY
  delete process.env.RESULTS_EMAIL
  assert.equal((await request(payload, { method: 'GET' })).statusCode, 405)
  assert.equal((await request(payload, { origin: 'https://other.example' })).statusCode, 403)
  assert.equal((await request({ ...payload, answers: { ...answers, detail: 'cozy' } })).statusCode, 400)
  assert.equal((await request('broken json', { raw: true })).statusCode, 400)
  assert.equal((await request('x'.repeat(4097), { raw: true })).statusCode, 413)
  assert.equal((await request()).data.code, 'EMAIL_NOT_CONFIGURED')
  process.env.RESEND_API_KEY = 'test-secret'
  process.env.RESULTS_EMAIL = 'fixed@example.com'
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options, body: JSON.parse(options.body) })
    return { ok: true, status: 200 }
  }
  assert.equal((await request({ ...payload, to: 'attacker@example.com', text: 'injected text' })).statusCode, 200)
  assert.deepEqual(calls[0].body.to, ['fixed@example.com'])
  assert.ok(calls[0].body.text.includes('министерство котохаоса'))
  assert.ok(!calls[0].body.text.includes('injected text'))
  assert.equal((await request()).statusCode, 200)
  assert.equal(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key'])
  globalThis.fetch = async () => { throw new Error('network unavailable') }
  assert.equal((await request()).statusCode, 502)
})
