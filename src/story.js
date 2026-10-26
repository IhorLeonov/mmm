import { personal } from './config.js'

export const moods = [
  { id: 'happy', label: 'Я сегодня солнышко', note: 'Просто зашла за добавкой', color: 'yellow', face: 'happy' },
  { id: 'sad', label: 'Сегодня лучше потише', note: 'Мы с котом немножко не в ресурсе', color: 'lavender', face: 'sad' },
]

export const needs = [
  { id: 'snack', label: 'Что-нибудь вкусное', note: 'Внутренний хомяк одобряет', icon: 'cookie', color: 'yellow' },
  { id: 'cat', label: 'Смешной кот', note: 'У науки нет к нему вопросов', icon: 'cat', color: 'lavender' },
  { id: 'hug', label: 'Обнимашки', note: 'Без разговоров. Просто обнимашки.', icon: 'heart', color: 'peach' },
  { id: 'movie', label: 'Фильм или сериал', note: 'Ещё одну серию. И точно спать.', icon: 'film', color: 'mint' },
]

export const helpers = [
  { id: 'cat', label: 'Кот Пупсик', note: 'Твой личный специалист. Уже помогает.', role: 'личный антигрустин Maria', color: 'lavender' },
  { id: 'capybara', label: 'Капибара Галина', note: 'Не суетится. И тебе не советует.', role: 'эксперт по спокойствию', color: 'yellow' },
  { id: 'pigeon', label: 'Голубь Геннадий', note: 'Опыт: жизнь. Навыки: крошки.', role: 'специалист по неожиданностям', color: 'mint' },
]

export const details = {
  snack: {
    title: 'Уточним масштаб вкусного.',
    subtitle: 'Решение ответственное. Хомяк ждёт.',
    choices: [
      { id: 'sweet', label: 'Что-нибудь сладкое', note: 'Десерт — это тоже план', icon: 'cake', color: 'peach' },
      { id: 'salty', label: 'Пицца. Или картошка.', note: 'Возможно, и пицца, и картошка', icon: 'pizza', color: 'yellow' },
    ],
  },
  cat: {
    title: 'Какого кота заказывали?',
    subtitle: 'Оба без опыта работы. Оба приняты.',
    choices: [
      { id: 'sleepy', label: 'Уютного кота-батона', note: 'Он лежит. Ты тоже можешь.', icon: 'coffee', color: 'yellow' },
      { id: 'chaos', label: 'Кота с приветом', note: 'В голове крутится микроволновка', icon: 'sparkles', color: 'lavender' },
    ],
  },
  hug: {
    title: 'Выбери режим обнимашек.',
    subtitle: 'Отдел тактильной поддержки слушает.',
    choices: [
      { id: 'gentle', label: 'Тихо и аккуратно', note: 'Как будто ты маленький круассан', icon: 'heart', color: 'peach' },
      { id: 'bear', label: 'Медвежий захват', note: 'Хрустеть запрещено', icon: 'shield', color: 'mint' },
    ],
  },
  movie: {
    title: 'Что включаем сегодня?',
    subtitle: 'Выбор на три часа — отдельный жанр кино.',
    choices: [
      { id: 'cozy', label: 'Что-то доброе и знакомое', note: 'Пересматривать — это нормально', icon: 'coffee', color: 'yellow' },
      { id: 'mystery', label: 'Интриги и «ещё серию»', note: 'Режим домашнего детектива', icon: 'search', color: 'lavender' },
    ],
  },
}

export const findChoice = (items, id) => items.find((item) => item.id === id)

export function validAnswers(answers, complete = true) {
  if (!answers || typeof answers !== 'object') return false
  const valid = [
    !answers.mood || !!findChoice(moods, answers.mood),
    !answers.need || !!findChoice(needs, answers.need),
    !answers.helper || !!findChoice(helpers, answers.helper),
    !answers.detail || !!findChoice(details[answers.need]?.choices || [], answers.detail),
  ].every(Boolean)
  return valid && (!complete || ['mood', 'need', 'helper', 'detail'].every((key) => typeof answers[key] === 'string' && !!answers[key]))
}

export function makeResult(answers) {
  if (!validAnswers(answers)) throw new Error('Incomplete adventure')
  const mood = findChoice(moods, answers.mood)
  const need = findChoice(needs, answers.need)
  const helper = findChoice(helpers, answers.helper)
  const detail = findChoice(details[answers.need].choices, answers.detail)
  const secret = answers.need === 'cat' && answers.detail === 'chaos' && answers.helper === 'pigeon'
  const recipes = {
    sweet: ['Официально разрешить себе любимый десерт.', 'Сделать чай или какао. Кружку побольше.', 'Есть без спешки. Красивую тарелку — по желанию.'],
    salty: ['Собрать команду из пиццы и чего-нибудь хрустящего.', 'Устроиться там, где максимально удобно.', 'Сегодня не делиться последним кусочком. Это закон.'],
    sleepy: ['Найти самое удобное место в радиусе квартиры.', 'Посмотреть на кота. Перенять технику лежания.', 'Хотя бы десять минут ничего от себя не требовать.'],
    chaos: ['Назначить Пупсика твоим личным антигрустином на вечер.', 'Посмотреть на эту мордочку. Да, он тоже не всё понимает.', 'Устроить себе пять минут кошачьего абсурда. Эта пауза — только для тебя.'],
    gentle: ['Поймать виртуальные обнимашки. Вот: (づ ◕‿◕ )づ', 'Обнять подушку, любимого питомца или приятного человека.', 'Побыть в тишине столько, сколько хочется.'],
    bear: ['Выдать подушке внеплановый медвежий захват.', 'Расслабить плечи и выдохнуть. Да, прямо сейчас.', 'При желании запросить настоящие обнимашки.'],
    cozy: ['Включить знакомый фильм, в котором всё будет хорошо.', 'Взять что-нибудь вкусное и отключить лишние уведомления.', 'Разрешить себе просто смотреть, без параллельных дел.'],
    mystery: ['Выбрать детектив или сериал с хорошей интригой.', 'Назначить себя главным следователем дивана.', 'Если угадала злодея — торжественно сказать: «Я знала».'],
  }
  const titles = {
    sweet: 'Сладкая жизнь. Хотя бы на вечер.',
    salty: 'Операция «последний кусочек».',
    sleepy: 'Режим кота-батона активирован.',
    chaos: 'Выписана небольшая доза хаоса.',
    gentle: 'Сегодня можно быть круассаном.',
    bear: 'Тебе выдана лицензия на обнимашки.',
    cozy: 'Главная роль — отдыхать.',
    mystery: 'Дело о пропавшем плохом настроении.',
  }
  const introductions = {
    happy: `${personal.name}, солнышку тоже положена подзарядка. Вот твой личный план на вечер — из того, что выбрала именно ты.`,
    sad: `${personal.name}, сегодня можно никуда не спешить. Мы с Пупсиком собрали этот план специально для тебя — без требования срочно веселиться.`,
  }
  const extras = {
    cat: 'Пупсик добавил тебе в назначение мурчание. Дозировка: по ощущениям.',
    capybara: 'Галина просит не торопиться. У неё с этим очень убедительный личный пример.',
    pigeon: 'Геннадий добавил пункт: пройтись по комнате с важным видом. Причину не объяснил.',
  }
  return {
    title: secret ? 'Твоё личное министерство котохаоса.' : titles[answers.detail],
    introduction: introductions[answers.mood],
    recipe: recipes[answers.detail],
    extra: extras[answers.helper],
    secret,
    mood,
    need,
    helper,
    detail,
    code: `${mood.id.slice(0, 1)}${need.id.slice(0, 1)}${helper.id.slice(0, 1)}`.toUpperCase(),
  }
}
