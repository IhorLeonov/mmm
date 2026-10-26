import { createHash } from 'node:crypto'
import { personal } from '../src/config.js'
import { makeResult, validAnswers } from '../src/story.js'

const windowMs = 10 * 60 * 1000
const recentRequests = new Map()
const maxBodyBytes = 4096

function respond(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(data))
}

async function readBody(req) {
  if (Number(req.headers['content-length']) > maxBodyBytes) throw new Error('BODY_TOO_LARGE')
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    if (Buffer.byteLength(raw) > maxBodyBytes) throw new Error('BODY_TOO_LARGE')
    return typeof req.body === 'string' ? JSON.parse(raw) : req.body
  }
  let raw = ''
  for await (const chunk of req) {
    raw += chunk.toString()
    if (Buffer.byteLength(raw) > maxBodyBytes) throw new Error('BODY_TOO_LARGE')
  }
  return JSON.parse(raw)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return respond(res, 405, { code: 'METHOD_NOT_ALLOWED' })
  }
  if (!req.headers['content-type']?.startsWith('application/json')) return respond(res, 415, { code: 'JSON_REQUIRED' })
  try {
    const origin = req.headers.origin
    const expected = process.env.APP_ORIGIN?.replace(/\/$/, '')
    if (!origin || (expected ? origin !== expected : new URL(origin).host !== req.headers.host)) return respond(res, 403, { code: 'ORIGIN_NOT_ALLOWED' })
  } catch {
    return respond(res, 403, { code: 'ORIGIN_NOT_ALLOWED' })
  }

  let body
  try { body = await readBody(req) } catch (error) {
    return respond(res, error.message === 'BODY_TOO_LARGE' ? 413 : 400, { code: 'INVALID_BODY' })
  }
  if (!body || !validAnswers(body.answers) || typeof body.sessionId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.sessionId) || typeof body.challengeComplete !== 'boolean' || typeof body.completedAt !== 'string' || body.completedAt.length > 32 || !Number.isFinite(Date.parse(body.completedAt))) {
    return respond(res, 400, { code: 'INVALID_ANSWERS' })
  }
  const apiKey = process.env.RESEND_API_KEY
  const recipient = process.env.RESULTS_EMAIL
  const from = process.env.EMAIL_FROM || 'Бюро хороших дней <onboarding@resend.dev>'
  if (!apiKey || !recipient) return respond(res, 503, { code: 'EMAIL_NOT_CONFIGURED' })

  // Best-effort per-instance throttle. Provider idempotency also prevents retry duplicates.
  const now = Date.now()
  for (const [key, entry] of recentRequests) if (entry.expires < now) recentRequests.delete(key)
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
  const rate = recentRequests.get(ip) || { count: 0, expires: now + windowMs }
  if (rate.count >= 8 || recentRequests.size > 2000) {
    res.setHeader('Retry-After', '600')
    return respond(res, 429, { code: 'TOO_MANY_REQUESTS' })
  }
  rate.count += 1
  recentRequests.set(ip, rate)

  // Only server-owned labels are emailed; client cannot set recipient or email content.
  const answers = Object.fromEntries(['mood', 'need', 'helper', 'detail'].map((key) => [key, body.answers[key]]))
  const result = makeResult(answers)
  const text = [
    `${personal.name} прошла Бюро хороших дней ✳`,
    '',
    `Настроение: ${result.mood.label}`,
    `Что поможет: ${result.need.label}`,
    `Помощник: ${result.helper.label}`,
    `Уточнение: ${result.detail.label}`,
    `Кошачья проверка: ${body.challengeComplete ? '5 из 5 поглаживаний, печать получена' : 'пропущена'}`,
    '',
    `Результат: ${result.title}`,
    result.introduction,
    ...result.recipe.map((line, index) => `${index + 1}. ${line}`),
    result.extra,
    result.secret ? 'Открыта секретная концовка!' : '',
    '',
    `Завершено: ${new Date(body.completedAt).toLocaleString('ru-RU', { timeZone: 'Europe/Kyiv' })} (Киев)`,
    'Maria сама нажала кнопку отправки результата.',
  ].filter((line) => line !== null).join('\n')
  const hash = createHash('sha256').update(JSON.stringify({ answers, challengeComplete: body.challengeComplete, completedAt: body.completedAt })).digest('hex').slice(0, 24)
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `mood/${body.sessionId}/${hash}` },
      body: JSON.stringify({ from, to: [recipient], subject: `${personal.name}: ${result.title}`, text }),
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) {
      // Never log the key, recipient, answers, or provider response body.
      console.error('Email provider rejected request:', response.status)
      return respond(res, 502, { code: 'EMAIL_FAILED' })
    }
    return respond(res, 200, { ok: true })
  } catch {
    return respond(res, 502, { code: 'EMAIL_FAILED' })
  }
}
