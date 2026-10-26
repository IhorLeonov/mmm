import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Asterisk, Cat, Check, ChevronRight, Coffee, Cookie, Download, Film, Heart, LoaderCircle, Mail, Moon, PartyPopper, PawPrint, Pizza, RotateCcw, Search, ShieldCheck, Sparkles, Volume2, VolumeX, X, CakeSlice } from 'lucide-react'
import { personal } from './config.js'
import { details, findChoice, helpers, makeResult, moods, needs, validAnswers } from './story.js'

const STORAGE_KEY = 'maria-bureau-v1'
const icons = { cookie: Cookie, cat: Cat, heart: Heart, film: Film, cake: CakeSlice, pizza: Pizza, coffee: Coffee, sparkles: Sparkles, search: Search, shield: ShieldCheck }
const stages = ['Знакомство', 'Настроение', 'План спасения', 'Твой помощник', 'Маленькая деталь', 'Кошачья проверка', 'Твой рецепт']
const freshAdventure = () => ({ screen: 0, answers: {}, sessionId: crypto.randomUUID(), challengeComplete: false, sent: false, completedAt: null })

function readAdventure() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (data && Number.isInteger(data.screen) && data.screen >= 0 && data.screen <= 6 && typeof data.sessionId === 'string' && validAnswers(data.answers, data.screen >= 5)) {
      const required = ['mood', 'need', 'helper', 'detail'].slice(0, Math.max(0, data.screen - 1))
      if (required.every((key) => !!data.answers[key])) return data
    }
  } catch { /* Private mode and unavailable storage are fine. */ }
  return freshAdventure()
}

function RealCat({ className = '' }) {
  return <div className={`real-cat ${className}`}><img src="/photos/cozy-cat.jpg" alt="Пупсик — личный специалист Maria по хорошему настроению" /></div>
}

function Animal({ type, className = '' }) {
  if (type === 'cat') return <RealCat className={className} />
  return <svg className={`animal ${className}`} viewBox="0 0 240 210" role="img" aria-label={type === 'capybara' ? 'Невозмутимая капибара' : 'Деловой голубь'}>
    {type === 'capybara' ? <>
      <ellipse cx="120" cy="172" rx="82" ry="14" fill="#364b3e" opacity=".09" />
      <path d="M59 160Q40 104 78 76Q81 48 104 70Q160 52 180 100Q202 128 177 167Z" fill="#b89571" stroke="#624c3b" strokeWidth="3" />
      <path d="M84 77q-8-14 2-16q13-4 15 12" fill="#b89571" stroke="#624c3b" strokeWidth="3" />
      <path d="M174 113q35 0 24 28q-10 18-46 5" fill="#caa583" stroke="#624c3b" strokeWidth="3" />
      <path d="M132 105h15M88 105h15M172 127h3" stroke="#443e35" strokeWidth="4" strokeLinecap="round" />
      <path d="M78 158v17h21v-18m43 0v18h21v-17" fill="#b89571" stroke="#624c3b" strokeWidth="3" strokeLinejoin="round" />
      <path d="M65 127q15 11 31 0" fill="none" stroke="#8c6a4e" strokeWidth="3" />
      <ellipse cx="120" cy="69" rx="27" ry="12" fill="#f4ba51" /><path d="M103 68q16-22 34 0" fill="#f4ba51" /><path d="m117 55 5-10" stroke="#658359" strokeWidth="4" />
    </> : <>
      <ellipse cx="120" cy="181" rx="65" ry="10" fill="#364b3e" opacity=".09" />
      <path d="m82 165-14 12m21-12 4 14m47-15 12 14m-5-14 15 5" stroke="#dd8b78" strokeWidth="4" strokeLinecap="round" />
      <path d="M72 156Q43 131 70 106Q100 95 105 61Q109 31 138 39Q168 45 157 78L149 99Q183 128 162 160Q132 189 72 156Z" fill="#9ba8b3" stroke="#48545d" strokeWidth="3" />
      <path d="m159 61 22 10-25 10" fill="#e7b756" stroke="#48545d" strokeWidth="3" strokeLinejoin="round" />
      <path d="M112 87q14 19 39 7l1 17q-26 5-46-9" fill="#78a897" />
      <path d="M84 115q61-17 61 30q-36 21-67-3" fill="#b7c1c8" stroke="#48545d" strokeWidth="3" />
      <circle cx="141" cy="58" r="6" fill="white" /><circle cx="143" cy="58" r="3" fill="#26372d" />
      <path d="m55 149-19 8 34 8" fill="#7e8f9c" stroke="#48545d" strokeWidth="3" strokeLinejoin="round" />
      <path d="m117 40-4-17 30-4 8 23" fill="#49604e" /><path d="m103 42 58-3" stroke="#364b3e" strokeWidth="5" strokeLinecap="round" />
    </>}
  </svg>
}

function ChoiceCard({ item, selected, onClick, children, photo }) {
  const Icon = icons[item.icon] || Sparkles
  return <button className={`choice-card ${photo ? 'photo-choice' : ''} ${selected ? 'is-selected' : ''}`} onClick={onClick} aria-pressed={selected}>
    {photo ? <div className={`photo-window ${item.color}`}><img src={photo} alt={item.id === 'happy' ? 'Maria в солнечном настроении' : 'Maria и кот отдыхают под пледом'} /><span className="photo-corner"><ArrowUpRight size={21} /></span></div> : children || <span className={`choice-icon ${item.color}`}><Icon size={27} strokeWidth={1.5} /></span>}
    <div className="choice-copy"><h3>{item.label}</h3><p>{item.note}</p></div>
    <span className="selection-circle">{selected ? <Check size={15} strokeWidth={2.5} /> : <ArrowUpRight size={17} />}</span>
  </button>
}

function RunawayBlanket() {
  const [moves, setMoves] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const zone = useRef(null)
  const button = useRef(null)
  const lines = ['Исчезнуть под пледом на 48 часов', 'Плед не согласовал отпуск', 'Плед: «Меня тут нет»', 'Хитрая. Но плед хитрее.', 'Ладно, на 20 минут можно. Но потом к нам.']
  function escape(event) {
    event?.preventDefault()
    const width = zone.current.clientWidth - button.current.offsetWidth - 8
    const x = position.x < width / 2 ? width : 0
    setPosition({ x: Math.max(0, x), y: moves % 2 ? 2 : 38 })
    setMoves((count) => count + 1)
  }
  return <div className="blanket-section"><div className="blanket-zone" ref={zone}>
    <button ref={button} className="blanket-button" style={{ transform: `translate(${position.x}px, ${position.y}px)` }} onPointerEnter={(event) => { if (event.pointerType === 'mouse') escape(event) }} onPointerDown={escape} onClick={escape} aria-label="Исчезнуть под пледом на 48 часов — шуточная убегающая кнопка"><Moon size={17} /> Исчезнуть под пледом на 48 часов <span>↗</span></button>
  </div><p className="blanket-caption" aria-live="polite">{moves ? lines[Math.min(moves, lines.length - 1)] : 'Этот вариант подозрительно скользкий. Попробуй нажать.'}</p></div>
}

function downloadCard(result) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1440
  const context = canvas.getContext('2d')
  context.fillStyle = '#f7f4e9'
  context.fillRect(0, 0, 1080, 1440)
  context.fillStyle = '#e3eadb'
  context.fillRect(56, 56, 968, 1328)
  context.fillStyle = '#fffdf7'
  context.fillRect(80, 80, 920, 1280)
  context.fillStyle = '#385447'
  context.font = '600 25px Manrope Variable, sans-serif'
  context.fillText('БЮРО ХОРОШИХ ДНЕЙ  /  ЛИЧНО ДЛЯ MARIA', 130, 158)
  let y = 252
  function wrap(text, font, color, lineHeight, gap = 25) {
    context.font = font
    context.fillStyle = color
    let line = ''
    for (const word of text.split(' ')) {
      if (context.measureText(`${line} ${word}`).width > 810 && line) {
        context.fillText(line, 130, y)
        y += lineHeight
        line = word
      } else line = `${line} ${word}`.trim()
    }
    context.fillText(line, 130, y)
    y += lineHeight + gap
  }
  wrap(result.title, '500 57px Lora Variable, Georgia, serif', '#273e33', 72, 22)
  wrap(result.introduction, '400 27px Manrope Variable, sans-serif', '#667268', 43, 30)
  result.recipe.forEach((line, index) => wrap(`${index + 1}.  ${line}`, '500 30px Manrope Variable, sans-serif', '#273e33', 48, 30))
  wrap(result.extra, '400 25px Manrope Variable, sans-serif', '#667268', 40, 20)
  context.fillStyle = '#d26952'
  context.font = '600 24px Manrope Variable, sans-serif'
  context.fillText('ПЕЧАТЬ КОТОМ ПОСТАВЛЕНА. МОЖНО ОТДЫХАТЬ.', 130, 1275)
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'maria-good-evening.png'
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }, 'image/png')
}

export default function App() {
  const [adventure, setAdventure] = useState(readAdventure)
  const [sound, setSound] = useState(false)
  const [taps, setTaps] = useState(0)
  const [mailState, setMailState] = useState('idle')
  const [mailError, setMailError] = useState('')
  const [toast, setToast] = useState('')
  const [restartOpen, setRestartOpen] = useState(false)
  const [petBurst, setPetBurst] = useState(0)
  const mainRef = useRef(null)
  const audioRef = useRef(null)
  const { screen, answers } = adventure
  const result = validAnswers(answers) ? makeResult(answers) : null
  const busy = mailState === 'sending'

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(adventure)) } catch { /* Continue without persistence. */ } }, [adventure])
  useEffect(() => {
    if (screen > 0) mainRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [screen])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])
  useEffect(() => () => { audioRef.current?.close() }, [])
  useEffect(() => {
    if (!restartOpen) return
    const previousFocus = document.activeElement
    function handleKey(event) {
      if (event.key === 'Escape') setRestartOpen(false)
      if (event.key !== 'Tab') return
      const controls = document.querySelectorAll('.restart-dialog button')
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [restartOpen])

  function chime() {
    if (!sound) return
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      audioRef.current ||= new AudioContext()
      const ctx = audioRef.current
      ctx.resume()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(480 + Math.random() * 220, ctx.currentTime)
      gain.gain.setValueAtTime(0.035, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.2)
    } catch { /* Sound is optional. */ }
  }
  function go(next) { chime(); setAdventure((state) => ({ ...state, screen: next })) }
  function choose(key, value) {
    chime()
    setAdventure((state) => {
      const next = { ...state.answers, [key]: value }
      if (key === 'need' && state.answers.need !== value) delete next.detail
      return { ...state, answers: next, sent: false, completedAt: null, challengeComplete: false }
    })
    setMailState('idle')
  }
  function finish(completed) {
    chime()
    setAdventure((state) => ({ ...state, screen: 6, challengeComplete: completed, completedAt: state.completedAt || new Date().toISOString() }))
  }
  function petCat() {
    if (taps >= 5) return
    chime()
    setTaps((count) => Math.min(count + 1, 5))
    setPetBurst((count) => count + 1)
  }
  async function sendResult() {
    if (busy || adventure.sent) return
    setMailState('sending')
    setMailError('')
    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: adventure.sessionId, answers, challengeComplete: adventure.challengeComplete, completedAt: adventure.completedAt }),
        signal: AbortSignal.timeout(20000),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.code === 'EMAIL_NOT_CONFIGURED' ? 'Почтовый голубь пока не вышел на смену. Сохрани карточку — её можно отправить вручную.' : 'Голубь немного сбился с маршрута. Попробуй ещё раз через минутку.')
      setAdventure((state) => ({ ...state, sent: true }))
      setMailState('sent')
    } catch (error) {
      setMailState('error')
      setMailError(error.name === 'TimeoutError' ? 'Голубь задерживается. Попробуй ещё раз: копия письма не отправится.' : error.message)
    }
  }
  function restart() {
    setAdventure(freshAdventure())
    setTaps(0)
    setMailState('idle')
    setRestartOpen(false)
  }

  const stepTitle = (eyebrow, title, subtitle) => <div className="step-heading"><span className="eyebrow"><span className="tiny-star">✳</span> {eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>
  const continueButton = (key, next, label = 'Дальше, интересно') => <div className="step-actions"><span className="micro-note">{answers[key] ? <><Check size={15} /> Принято без осуждения</> : 'Выбери то, что ближе сейчас'}</span><button className="primary-button" disabled={!answers[key]} onClick={() => go(next)}>{label}<ArrowRight size={19} /></button></div>

  return <div className="app-shell">
    <header className="site-header"><button className="brand" onClick={() => screen === 0 ? setToast('Бюро на месте. Кот тоже.') : setRestartOpen(true)} aria-label="Бюро хороших дней — в начало"><Asterisk size={43} strokeWidth={2.3} /><span>бюро<br />хороших дней</span></button><div className="header-status"><span className="status-dot" /> кот уже на смене</div><button className="sound-toggle" onClick={() => { setSound(!sound); setToast(sound ? 'Тихий режим. Уважаем.' : 'Звуки включены. Совсем чуть-чуть.') }} aria-label={sound ? 'Выключить звуки' : 'Включить звуки'} aria-pressed={sound}>{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}<span>звук {sound ? 'вкл' : 'выкл'}</span></button></header>

    {screen > 0 && screen < 6 && <nav className="progress-nav" aria-label="Этапы приключения"><button className="back-button" onClick={() => go(screen - 1)}><ArrowLeft size={16} /> Назад</button><div className="progress-track">{[1, 2, 3, 4, 5].map((number) => <span key={number} className={number <= screen ? 'active' : ''} aria-label={`${stages[number]}${number === screen ? ', текущий этап' : ''}`} />)}</div><span className="step-counter">0{screen} <span>/ 05</span></span></nav>}

    <main ref={mainRef} tabIndex={-1} className={`main-content screen-${screen}`} key={screen}>
      {screen === 0 && <>
        <section className="welcome-layout"><div className="welcome-copy"><span className="eyebrow"><span className="tiny-star">✳</span> ОСОБОЕ ДЕЛО: {personal.name.toUpperCase()}</span><h1>Твоему дню<br />положено <span className="serif-accent">кое-что<br />хорошее.</span><svg className="headline-doodle" viewBox="0 0 240 17" aria-hidden="true"><path d="M3 11Q95-3 235 8M19 16Q120 3 209 11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></h1><p className="hero-description">Твои фотографии. Твой Пупсик.<br />И маленькое приключение, которое я собрал<br />специально для твоего хорошего настроения.</p><button className="primary-button hero-start" onClick={() => go(1)}>Так, что тут у вас?<ArrowUpRight size={22} /></button><p className="time-note"><span className="little-clock" /> 2 минуты · правильных ответов нет</p></div>
          <div className="welcome-art"><span className="art-label">ЭТО НЕ СЛУЧАЙНАЯ ССЫЛКА</span><div className="portrait-card"><span className="tape" /><img className="hero-photo" src={personal.photos.finale} alt="Maria — главная героиня этого маленького приключения" /><div className="polaroid-caption"><span>главная героиня дня</span><Sparkles size={20} /></div></div><span className="sun-sticker"><Asterisk size={65} strokeWidth={1.9} /></span><div className="cat-sticker"><RealCat /><span>я всё<br />организовал.</span></div><div className="round-stamp">100%<br /><span>для тебя</span><Sparkles size={17} /></div><span className="handwritten art-note">по важному поводу:<br />просто захотелось :)</span><svg className="art-arrow" viewBox="0 0 110 70" aria-hidden="true"><path d="M5 5Q90-1 86 54m-15-8 16 15 13-18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        </section>
        <section className="welcome-bottom"><span className="bottom-tag">МАЛЕНЬКИЙ ПЛАН</span><div><span>01</span> Как ты сейчас?</div><ChevronRight size={15} /><div><span>02</span> Что тебе нужно?</div><ChevronRight size={15} /><div><span>03</span> Что-нибудь хорошее</div><span className="bottom-star">✳</span></section>
      </>}

      {screen === 1 && <section className="step-section mood-step">{stepTitle('НАЧНЁМ С ГЛАВНОГО', `${personal.name}, как ты сегодня?`, 'Выбери свою версию. Обе, между прочим, отличные.')}<div className="mood-grid">{moods.map((mood) => <ChoiceCard key={mood.id} item={mood} selected={answers.mood === mood.id} photo={personal.photos[mood.id]} onClick={() => choose('mood', mood.id)} />)}</div><div className="small-aside"><PawPrint size={18} /><span>Кот с фотографии уже проголосовал за второй вариант.</span></div>{continueButton('mood', 2, 'Это сегодня я')}</section>}

      {screen === 2 && <section className="step-section">{stepTitle('ОТДЕЛ МАЛЕНЬКИХ РАДОСТЕЙ', 'Что сейчас могло бы помочь?', answers.mood === 'happy' ? 'Хорошее настроение тоже можно улучшить. Кот проверял.' : 'Не нужно чинить весь день. Начнём с чего-нибудь маленького.')}<div className="choices-grid">{needs.map((need) => <ChoiceCard key={need.id} item={need} selected={answers.need === need.id} onClick={() => choose('need', need.id)} />)}</div><RunawayBlanket />{continueButton('need', 3, 'Да, вот это нужно')}</section>}

      {screen === 3 && <section className="step-section helpers-step">{stepTitle('КОМИССИЯ СОБРАЛАСЬ', 'Кто будет за тебя отвечать?', 'Квалификация сомнительная. Намерения прекрасные.')}<div className="helpers-grid">{helpers.map((helper) => <ChoiceCard key={helper.id} item={helper} selected={answers.helper === helper.id} onClick={() => choose('helper', helper.id)}><div className={`helper-art ${helper.color}`}><Animal type={helper.id} /><span className="helper-role">{helper.role}</span></div></ChoiceCard>)}</div>{continueButton('helper', 4, 'Беру этого специалиста')}</section>}

      {screen === 4 && <section className="step-section detail-step">{stepTitle('ДЕТАЛИ ИМЕЮТ ЗНАЧЕНИЕ', details[answers.need].title, details[answers.need].subtitle)}<div className="choices-grid">{details[answers.need].choices.map((detail) => <ChoiceCard key={detail.id} item={detail} selected={answers.detail === detail.id} onClick={() => choose('detail', detail.id)} />)}</div><div className="desk-note"><span className="note-asterisk">✳</span><p>Твой специалист <strong>{findChoice(helpers, answers.helper).label}</strong> всё записывает.<br />Ну, или делает вид. Выглядит убедительно.</p></div>{continueButton('detail', 5, 'Почти готово?')}</section>}

      {screen === 5 && <section className="step-section pet-step">{stepTitle('ПОСЛЕДНЯЯ ФОРМАЛЬНОСТЬ', taps >= 5 ? 'Всё. Ты принята в свои.' : 'Документы надо заверить котом.', taps >= 5 ? 'Кот довольно промолчал. Это высшая оценка.' : 'Погладь его пять раз. У бюрократии свои правила.')}<div className={`pet-stage ${taps >= 5 ? 'pet-complete' : ''}`}><span className="pet-scribble handwritten">нажми на кота ↓</span><button className="pet-button" onClick={petCat} disabled={taps >= 5} aria-label={`Погладить кота, ${taps} из 5`}><RealCat />{petBurst > 0 && <span key={petBurst} className="pet-burst">{['мр.', 'мрр.', 'мррр.', 'ладно, ты ничего.', 'одобрено.'][taps - 1]}</span>}</button><div className="paw-progress" aria-label={`Поглаживаний: ${taps} из 5`}>{[1, 2, 3, 4, 5].map((number) => <PawPrint key={number} size={24} className={number <= taps ? 'filled' : ''} />)}</div><p className="pet-counter" aria-live="polite">{taps >= 5 ? 'Печать поставлена. Мурчание получено.' : `${taps} / 5 · немножко кошачьей терапии`}</p></div><div className="pet-actions"><button className="primary-button" disabled={taps < 5} onClick={() => finish(true)}>Получить мой рецепт<Sparkles size={19} /></button><button className="text-button" onClick={() => finish(false)}>Кот занят. Забрать рецепт так <ArrowRight size={14} /></button></div></section>}

      {screen === 6 && result && <section className="result-section"><div className="result-topline"><span className="eyebrow"><ShieldCheck size={17} /> {result.secret ? 'СЕКРЕТНЫЙ ПРОТОКОЛ РАЗБЛОКИРОВАН' : 'КОМИССИЯ ПРИНЯЛА РЕШЕНИЕ'}</span><span className="case-number">ДЕЛО № {result.code}–001</span></div><div className="result-layout"><article className="result-paper"><div className="result-paper-heading"><span>ЛИЧНО ДЛЯ {personal.name.toUpperCase()}</span><Asterisk size={30} /></div><h1>{result.title}</h1><p className="result-intro">{result.introduction}</p><div className="recipe-list">{result.recipe.map((line, index) => <div className="recipe-line" key={line}><span>0{index + 1}</span><p>{line}</p></div>)}</div><div className="result-extra"><PawPrint size={20} /><p>{result.extra}</p></div><div className="paper-footer"><span className="approval-stamp">{adventure.challengeComplete ? 'ЗАВЕРЕНО КОТОМ' : 'КОТ НЕ ВОЗРАЖАЕТ'}<Check size={17} /></span><span className="handwritten">Можешь начинать<br />прямо сейчас.</span></div></article><aside className="result-sidebar"><div className="result-photo"><img src={personal.photos.finale} alt="Maria" /><span>С этой героиней всё получится ✳</span></div><div className="personal-note"><span className="eyebrow">ЗАПИСКА НА ПОЛЯХ</span><p>{personal.finalNote}</p><span className="note-sign">— {personal.author}</span></div>{result.secret && <div className="secret-note"><PartyPopper size={22} /><p>Кот с приветом + голубь.<br />Отлично. У этой команды нет тормозов.</p></div>}</aside></div><div className="result-delivery"><div><h2>Ну что, план принят?</h2><p>{adventure.sent ? 'Ответы и рецепт отправлены автору. Голубь молодец.' : 'Можно отправить автору твои ответы и этот рецепт на почту.'}</p></div><button className={`primary-button ${adventure.sent ? 'sent-button' : ''}`} disabled={busy || adventure.sent} onClick={sendResult}>{busy ? <LoaderCircle size={18} className="spin" /> : adventure.sent ? <Check size={18} /> : <Mail size={18} />}{busy ? 'Голубь вылетел…' : adventure.sent ? 'Отправлено!' : 'Отправить мой план автору'}</button></div>{mailError && <p className="mail-error" role="alert">{mailError}</p>}<div className="result-actions"><button className="text-button" onClick={() => { downloadCard(result); setToast('Сохраняю рецепт на хороший вечер.') }}><Download size={16} /> Сохранить карточку</button><button className="text-button" onClick={() => setRestartOpen(true)} disabled={busy}><RotateCcw size={15} /> А если выбрать по-другому?</button></div></section>}
    </main>

    <footer className="site-footer"><span>Немного заботы. Ноль серьёзности.</span><button onClick={() => setToast('Секрет бюро: коту тоже иногда нужен кот.')} aria-label="Маленький секрет бюро"><Asterisk size={18} /></button><span>СДЕЛАНО В ОДНОМ ЭКЗЕМПЛЯРЕ</span></footer>
    {toast && <div className="toast" role="status"><Sparkles size={17} />{toast}</div>}
    {restartOpen && <div className="dialog-backdrop" onClick={() => setRestartOpen(false)}><div className="restart-dialog" role="dialog" aria-modal="true" aria-labelledby="restart-title" onClick={(event) => event.stopPropagation()}><button className="dialog-close" onClick={() => setRestartOpen(false)} aria-label="Закрыть" autoFocus><X size={19} /></button><Asterisk size={38} /><h2 id="restart-title">Ещё один заход?</h2><p>Можно выбрать другую версию вечера. Текущий рецепт лучше сначала сохранить.</p><button className="primary-button" onClick={restart}>Да, начнём заново<RotateCcw size={17} /></button><button className="text-button" onClick={() => setRestartOpen(false)}>Останусь здесь</button></div></div>}
  </div>
}
