import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const PROGRESS_URL = "https://functions.poehali.dev/5048a1bd-0ab6-4e8d-acb1-9ce0150792fa";

function getSessionId(): string {
  let sid = localStorage.getItem("cybershield_sid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("cybershield_sid", sid);
  }
  return sid;
}

// ─── Types ───────────────────────────────────────────────────────────────────
type Section = "intro" | "signs" | "community" | "scenarios" | "tips";
type Achievement = { id: string; title: string; icon: string; xp: number; unlocked: boolean };

// ─── Data ─────────────────────────────────────────────────────────────────────
const SECTIONS: { id: Section; label: string; icon: string; color: string; xp: number }[] = [
  { id: "intro", label: "Что такое кибербулинг?", icon: "BookOpen", color: "cyan", xp: 50 },
  { id: "signs", label: "Признаки и проявления", icon: "Eye", color: "purple", xp: 75 },
  { id: "community", label: "Сообщество поддержки", icon: "Users", color: "pink", xp: 60 },
  { id: "scenarios", label: "Интерактивные сценарии", icon: "Gamepad2", color: "yellow", xp: 100 },
  { id: "tips", label: "Советы защиты", icon: "Shield", color: "green", xp: 80 },
];

const ACHIEVEMENTS: Achievement[] = [
  { id: "first", title: "Первый шаг", icon: "⭐", xp: 25, unlocked: false },
  { id: "reader", title: "Знаток терминов", icon: "📚", xp: 50, unlocked: false },
  { id: "explorer", title: "Исследователь", icon: "🔍", xp: 75, unlocked: false },
  { id: "helper", title: "Помощник", icon: "🤝", xp: 100, unlocked: false },
  { id: "hero", title: "Кибергерой", icon: "🛡️", xp: 200, unlocked: false },
];

const QUIZ_QUESTIONS = [
  {
    question: "Одноклассник публично высмеивает тебя в чате класса. Что делать?",
    options: [
      { text: "Ответить тем же и высмеять его", correct: false },
      { text: "Сделать скриншот, покинуть чат и рассказать взрослому", correct: true },
      { text: "Игнорировать и ничего не предпринимать", correct: false },
      { text: "Удалить аккаунт", correct: false },
    ],
    explanation: "Фиксируй доказательства, не отвечай агрессией и обратись за помощью.",
  },
  {
    question: "Тебе пришло анонимное сообщение с угрозами. Как поступить?",
    options: [
      { text: "Написать в ответ и узнать кто это", correct: false },
      { text: "Заблокировать и удалить переписку", correct: false },
      { text: "Сохранить скриншоты и сообщить в полицию или школу", correct: true },
      { text: "Рассказать всем друзьям", correct: false },
    ],
    explanation: "Угрозы — это серьёзно. Сохрани доказательства и обратись к специалистам.",
  },
  {
    question: "Друг делится личными фото другого человека без его согласия. Ты:",
    options: [
      { text: "Посмотришь, раз уж прислали", correct: false },
      { text: "Перешлёшь другим — это ведь просто фото", correct: false },
      { text: "Скажешь другу, что это неэтично и может быть незаконно", correct: true },
      { text: "Промолчишь, чтобы не поссориться", correct: false },
    ],
    explanation: "Распространение чужих фото без согласия — нарушение приватности и закона.",
  },
  {
    question: "Ты стал свидетелем кибербулинга: в паблике унижают твоего одноклассника. Как поступишь?",
    options: [
      { text: "Поставлю лайк — это не моё дело", correct: false },
      { text: "Напишу поддерживающий комментарий жертве и сообщу модераторам", correct: true },
      { text: "Перешлю другим, чтобы они тоже видели", correct: false },
      { text: "Промолчу, чтобы не навлечь на себя", correct: false },
    ],
    explanation: "Поддержка жертвы и жалоба модераторам — это правильная реакция свидетеля. Молчание = соучастие.",
  },
  {
    question: "Незнакомец в игре постоянно оскорбляет тебя и мешает играть. Что делать?",
    options: [
      { text: "Оскорблять в ответ — он первый начал", correct: false },
      { text: "Использовать функцию блокировки и пожаловаться на игрока", correct: true },
      { text: "Удалить игру навсегда", correct: false },
      { text: "Поменять ник и продолжить играть", correct: false },
    ],
    explanation: "В каждой игре есть инструменты жалоб и блокировки. Используй их — это меняет токсичную среду.",
  },
];

const TIPS = [
  { icon: "🔒", title: "Настрой приватность", desc: "Закрой профили в соцсетях, ограничь, кто видит твои посты и данные." },
  { icon: "📸", title: "Фиксируй доказательства", desc: "Делай скриншоты перед блокировкой — они пригодятся при обращении за помощью." },
  { icon: "🚫", title: "Блокируй и не отвечай", desc: "Агрессоры ищут реакцию. Блокировка лишает их этого топлива." },
  { icon: "💬", title: "Говори с взрослыми", desc: "Родители, учителя или психологи могут помочь. Ты не один в этой ситуации." },
  { icon: "🧠", title: "Забота о себе", desc: "Ограничь время онлайн, занимайся хобби, общайся офлайн с теми, кому доверяешь." },
  { icon: "🆘", title: "Знай куда обратиться", desc: "Телефон доверия: 8-800-2000-122 (бесплатно, анонимно, 24/7)." },
];

const COMMUNITY_POSTS = [
  { name: "Алина К.", avatar: "🌟", text: "Я прошла через это в 9 классе. Главное — не молчать. Поговорила с мамой и стало легче!", likes: 42, time: "2 ч назад" },
  { name: "Максим Р.", avatar: "🔥", text: "Совет: создайте отдельный аккаунт только для близких друзей. Помогает контролировать, кто тебя видит.", likes: 38, time: "5 ч назад" },
  { name: "Дарья П.", avatar: "💙", text: "Наша школа провела классный час по этой теме. Многие поняли, что сами иногда были агрессорами, не осознавая.", likes: 67, time: "1 д назад" },
];

// ─── Color helpers ────────────────────────────────────────────────────────────
const colorMap: Record<string, string> = {
  cyan: "border-neon-cyan/30 hover:border-neon-cyan/60 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]",
  purple: "border-neon-purple/30 hover:border-neon-purple/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]",
  pink: "border-neon-pink/30 hover:border-neon-pink/60 hover:shadow-[0_0_20px_rgba(236,72,153,0.2)]",
  yellow: "border-neon-yellow/30 hover:border-neon-yellow/60 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]",
  green: "border-neon-green/30 hover:border-neon-green/60 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]",
};

const textColorMap: Record<string, string> = {
  cyan: "text-neon-cyan", purple: "text-neon-purple",
  pink: "text-neon-pink", yellow: "text-neon-yellow", green: "text-neon-green",
};

const bgColorMap: Record<string, string> = {
  cyan: "bg-neon-cyan/10", purple: "bg-neon-purple/10",
  pink: "bg-neon-pink/10", yellow: "bg-neon-yellow/10", green: "bg-neon-green/10",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function XPBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100);
  return (
    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg, #00ffff, #a855f7)",
          boxShadow: "0 0 10px rgba(0,255,255,0.5)",
        }}
      />
    </div>
  );
}

function LevelBadge({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30">
      <span className="font-orbitron text-neon-cyan text-xs font-bold">LVL {level}</span>
    </div>
  );
}

function IntroSection({ onComplete }: { onComplete: () => void }) {
  const types = [
    { icon: "💬", name: "Харассмент", desc: "Систематические оскорбления и угрозы в личных сообщениях или чатах" },
    { icon: "🎭", name: "Самозванство", desc: "Создание фейкового аккаунта от имени жертвы для её дискредитации" },
    { icon: "📤", name: "Аутинг", desc: "Публичное раскрытие личных тайн или компрометирующих фото без согласия" },
    { icon: "🚪", name: "Остракизм", desc: "Намеренное исключение человека из онлайн-групп и сообществ" },
    { icon: "🎮", name: "Геймер-булинг", desc: "Преследование и унижение в онлайн-играх: читерство, токсичность, угрозы" },
    { icon: "📊", name: "Голосование", desc: "Организация публичных опросов унизительного характера против жертвы" },
  ];
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 mb-4">
          <span className="text-neon-cyan text-sm font-medium">Уровень 1 • Основы</span>
        </div>
        <h2 className="font-russo text-3xl md:text-4xl text-white">
          Что такое <span className="neon-cyan">кибербулинг?</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
          Кибербулинг — это систематическое преследование, запугивание или унижение человека
          с использованием цифровых технологий: социальных сетей, мессенджеров, онлайн-игр.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {types.map((t, i) => (
          <div key={i} className="game-card flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
            <div className="text-2xl mt-0.5 shrink-0">{t.icon}</div>
            <div>
              <h4 className="font-russo text-white text-sm mb-1">{t.name}</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-5 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <h4 className="font-russo text-neon-cyan mb-2">Ключевые факты</h4>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li>• Каждый 3-й подросток сталкивался с кибербулингом</li>
              <li>• 58% подростков не рассказывают взрослым о происходящем</li>
              <li>• Кибербулинг может продолжаться 24/7, в отличие от обычного</li>
              <li>• В России действует ФЗ о защите от интернет-угроз</li>
            </ul>
          </div>
        </div>
      </div>
      <button onClick={onComplete} className="btn-neon w-full py-4 rounded-xl font-russo text-lg text-background bg-neon-cyan hover:bg-neon-cyan/90 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.4)]">
        Получить +50 XP и продолжить →
      </button>
    </div>
  );
}

function SignsSection({ onComplete }: { onComplete: () => void }) {
  const [revealed, setRevealed] = useState<number[]>([]);
  const signs = [
    { icon: "😰", title: "Тревога после девайса", desc: "Человек становится тревожным или подавленным после использования телефона/компьютера", victim: true },
    { icon: "🚫", title: "Избегание устройств", desc: "Резко перестаёт пользоваться телефоном или соцсетями, которые раньше любил", victim: true },
    { icon: "🏫", title: "Отказ от школы", desc: "Ищет поводы не идти в школу, особенно после инцидентов в сети", victim: true },
    { icon: "😡", title: "Токсичные комментарии", desc: "Регулярно оставляет оскорбительные комментарии под чужими постами", victim: false },
    { icon: "📵", title: "Скрытность онлайн", desc: "Прячет экран, быстро закрывает вкладки при чужом приближении", victim: false },
    { icon: "💸", title: "Шантаж ресурсами", desc: "Использует игровые предметы или деньги как инструмент давления", victim: false },
  ];
  const toggle = (i: number) => setRevealed(r => r.includes(i) ? r.filter(x => x !== i) : [...r, i]);
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-purple/10 border border-neon-purple/30 mb-2">
          <span className="text-neon-purple text-sm font-medium">Уровень 2 • Распознавание</span>
        </div>
        <h2 className="font-russo text-3xl md:text-4xl text-white">
          Признаки и <span className="neon-purple">проявления</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Нажми на карточку, чтобы узнать подробности</p>
      </div>
      <div className="flex gap-3 justify-center flex-wrap">
        <div className="flex items-center gap-2 text-sm text-neon-green"><span>🟢</span> Жертва</div>
        <div className="flex items-center gap-2 text-sm text-neon-pink"><span>🔴</span> Агрессор</div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {signs.map((s, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`game-card text-left p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
              s.victim ? "border-neon-green/30 hover:border-neon-green/60 bg-neon-green/5" : "border-neon-pink/30 hover:border-neon-pink/60 bg-neon-pink/5"
            } ${revealed.includes(i) ? "scale-[1.02]" : ""}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{s.icon}</span>
              <span className="font-russo text-white text-sm">{s.title}</span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${s.victim ? "bg-neon-green/20 text-neon-green" : "bg-neon-pink/20 text-neon-pink"}`}>
                {s.victim ? "жертва" : "агрессор"}
              </span>
            </div>
            {revealed.includes(i) && (
              <p className="text-muted-foreground text-sm leading-relaxed mt-2 pt-2 border-t border-border">{s.desc}</p>
            )}
          </button>
        ))}
      </div>
      <button onClick={onComplete} className="btn-neon w-full py-4 rounded-xl font-russo text-lg text-background bg-neon-purple hover:bg-neon-purple/90 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
        Получить +75 XP и продолжить →
      </button>
    </div>
  );
}

function CommunitySection({ onComplete }: { onComplete: () => void }) {
  const [liked, setLiked] = useState<number[]>([]);
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState(COMMUNITY_POSTS);
  const sendPost = () => {
    if (!postText.trim()) return;
    setPosts(p => [{ name: "Ты", avatar: "✨", text: postText, likes: 0, time: "только что" }, ...p]);
    setPostText("");
  };
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-pink/10 border border-neon-pink/30 mb-2">
          <span className="text-neon-pink text-sm font-medium">Уровень 3 • Сообщество</span>
        </div>
        <h2 className="font-russo text-3xl md:text-4xl text-white">Стена <span className="neon-pink">поддержки</span></h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Делись опытом анонимно, помогай другим, получай поддержку</p>
      </div>
      <div className="p-4 rounded-xl bg-card border border-neon-pink/20 space-y-3">
        <textarea
          value={postText}
          onChange={e => setPostText(e.target.value)}
          placeholder="Поделись историей или советом... (анонимно)"
          className="w-full bg-muted/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:border-neon-pink/50 transition-colors"
        />
        <button onClick={sendPost} disabled={!postText.trim()} className="btn-neon px-6 py-2 rounded-lg font-russo text-sm text-background bg-neon-pink hover:bg-neon-pink/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          Поделиться
        </button>
      </div>
      <div className="space-y-3">
        {posts.map((p, i) => (
          <div key={i} className="game-card p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">{p.avatar}</div>
              <div>
                <div className="font-russo text-sm text-white">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.time}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{p.text}</p>
            <button
              onClick={() => setLiked(l => l.includes(i) ? l.filter(x => x !== i) : [...l, i])}
              className={`flex items-center gap-2 text-xs transition-colors ${liked.includes(i) ? "text-neon-pink" : "text-muted-foreground hover:text-neon-pink"}`}
            >
              <Icon name="Heart" size={14} />
              {p.likes + (liked.includes(i) ? 1 : 0)} поддерживают
            </button>
          </div>
        ))}
      </div>
      <button onClick={onComplete} className="btn-neon w-full py-4 rounded-xl font-russo text-lg text-background bg-neon-pink hover:bg-neon-pink/90 transition-all duration-300 shadow-[0_0_20px_rgba(236,72,153,0.4)]">
        Получить +60 XP и продолжить →
      </button>
    </div>
  );
}

function ScenariosSection({ onComplete }: { onComplete: () => void }) {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = QUIZ_QUESTIONS[qIndex];
  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (q.options[i].correct) setScore(s => s + 1);
  };
  const next = () => {
    if (qIndex + 1 < QUIZ_QUESTIONS.length) { setQIndex(qi => qi + 1); setSelected(null); }
    else setDone(true);
  };
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-yellow/10 border border-neon-yellow/30 mb-2">
          <span className="text-neon-yellow text-sm font-medium">Уровень 4 • Практика</span>
        </div>
        <h2 className="font-russo text-3xl md:text-4xl text-white">Интерактивные <span className="neon-yellow">сценарии</span></h2>
      </div>
      {!done ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Вопрос {qIndex + 1} из {QUIZ_QUESTIONS.length}</span>
            <span className="text-neon-yellow">Правильных: {score}</span>
          </div>
          <div className="h-2 bg-muted rounded-full">
            <div className="h-full bg-neon-yellow rounded-full transition-all duration-500" style={{ width: `${(qIndex / QUIZ_QUESTIONS.length) * 100}%` }} />
          </div>
          <div className="p-6 rounded-xl bg-neon-yellow/5 border border-neon-yellow/20">
            <p className="font-russo text-white text-lg leading-relaxed">{q.question}</p>
          </div>
          <div className="space-y-3">
            {q.options.map((opt, i) => {
              let style = "border-border bg-card hover:border-neon-yellow/50 cursor-pointer";
              if (selected !== null) {
                if (opt.correct) style = "border-neon-green bg-neon-green/10 cursor-default";
                else if (i === selected && !opt.correct) style = "border-destructive bg-destructive/10 cursor-default";
                else style = "border-border bg-card/50 opacity-50 cursor-default";
              }
              return (
                <button key={i} onClick={() => choose(i)} className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 text-sm ${style}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt.text}</span>
                    {selected !== null && opt.correct && <Icon name="CheckCircle" size={18} className="ml-auto text-neon-green" />}
                    {selected !== null && i === selected && !opt.correct && <Icon name="XCircle" size={18} className="ml-auto text-destructive" />}
                  </div>
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <div className="p-4 rounded-xl bg-muted border border-border">
              <p className="text-sm text-muted-foreground"><span className="text-neon-cyan font-medium">Объяснение: </span>{q.explanation}</p>
              <button onClick={next} className="mt-3 btn-neon px-6 py-2 rounded-lg font-russo text-sm text-background bg-neon-yellow hover:bg-neon-yellow/90 transition-all">
                {qIndex + 1 < QUIZ_QUESTIONS.length ? "Следующий вопрос →" : "Завершить тест →"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center space-y-6 py-8">
          <div className="text-6xl animate-float">{score === 3 ? "🏆" : score === 2 ? "🥈" : "🎯"}</div>
          <h3 className="font-russo text-2xl text-white">Результат: {score}/{QUIZ_QUESTIONS.length}</h3>
          <p className="text-muted-foreground">
            {score === 3 ? "Отлично! Ты знаешь, как реагировать на кибербулинг." : score === 2 ? "Хорошо! Есть пара моментов для изучения." : "Не переживай — практика поможет лучше разобраться."}
          </p>
          <button onClick={onComplete} className="btn-neon px-10 py-4 rounded-xl font-russo text-lg text-background bg-neon-yellow hover:bg-neon-yellow/90 transition-all shadow-[0_0_20px_rgba(251,191,36,0.4)]">
            Получить +100 XP →
          </button>
        </div>
      )}
    </div>
  );
}

function TipsSection({ onComplete }: { onComplete: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-green/10 border border-neon-green/30 mb-2">
          <span className="text-neon-green text-sm font-medium">Уровень 5 • Защита</span>
        </div>
        <h2 className="font-russo text-3xl md:text-4xl text-white">Советы <span style={{ color: "#22c55e", textShadow: "0 0 10px #22c55e, 0 0 30px #22c55e" }}>защиты</span></h2>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {TIPS.map((t, i) => (
          <button key={i} onClick={() => setExpanded(expanded === i ? null : i)}
            className={`game-card text-left p-5 rounded-xl border-2 transition-all duration-300 ${
              expanded === i ? "border-neon-green/60 bg-neon-green/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]" : "border-border bg-card hover:border-neon-green/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{t.icon}</span>
              <span className="font-russo text-white text-sm">{t.title}</span>
              <Icon name={expanded === i ? "ChevronUp" : "ChevronDown"} size={16} className="ml-auto text-muted-foreground" />
            </div>
            {expanded === i && <p className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground leading-relaxed">{t.desc}</p>}
          </button>
        ))}
      </div>
      <div className="p-5 rounded-xl border-2 border-neon-green/30 bg-neon-green/5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📞</span>
          <div>
            <h4 className="font-russo text-neon-green mb-1">Телефон доверия</h4>
            <p className="font-orbitron text-white text-xl mb-1">8-800-2000-122</p>
            <p className="text-muted-foreground text-sm">Бесплатно, анонимно, 24/7 — для детей и подростков</p>
          </div>
        </div>
      </div>
      <button onClick={onComplete} className="btn-neon w-full py-4 rounded-xl font-russo text-lg text-background bg-neon-green hover:bg-neon-green/90 transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
        Завершить Workbook и получить +80 XP! 🎉
      </button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Index() {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [completed, setCompleted] = useState<Section[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(getSessionId());

  const XP_PER_LEVEL = 200;
  const currentLevelXp = xp % XP_PER_LEVEL;

  // Загрузка прогресса при старте
  useEffect(() => {
    fetch(PROGRESS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "load", session_id: sessionId.current }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.xp > 0 || data.completed_sections?.length > 0) {
          setXp(data.xp);
          setLevel(data.level);
          setCompleted(data.completed_sections as Section[]);
          setAchievements(prev => prev.map(a => ({ ...a, unlocked: data.achievements.includes(a.id) })));
          setShowWelcome(false);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Сохранение прогресса
  const saveProgress = useCallback((newXp: number, newLevel: number, newCompleted: Section[], newAchievements: Achievement[]) => {
    fetch(PROGRESS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        session_id: sessionId.current,
        xp: newXp,
        level: newLevel,
        completed_sections: newCompleted,
        achievements: newAchievements.filter(a => a.unlocked).map(a => a.id),
      }),
    }).catch(() => {});
  }, []);

  const addXp = (amount: number) => {
    setXp(prev => {
      const newXp = prev + amount;
      const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
      if (newLevel > level) setLevel(newLevel);
      return newXp;
    });
  };

  const unlockAchievement = (id: string) => {
    setAchievements(prev =>
      prev.map(a => {
        if (a.id === id && !a.unlocked) {
          const unlocked = { ...a, unlocked: true };
          setTimeout(() => setShowAchievement(unlocked), 300);
          setTimeout(() => setShowAchievement(null), 3500);
          return unlocked;
        }
        return a;
      })
    );
  };

  const completeSection = (id: Section, xpAmount: number) => {
    if (completed.includes(id)) return;
    const newCompleted = [...completed, id];
    const newXp = xp + xpAmount;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

    setCompleted(newCompleted);
    addXp(xpAmount);

    let newAchievements = achievements;
    const unlock = (aid: string) => {
      newAchievements = newAchievements.map(a => a.id === aid ? { ...a, unlocked: true } : a);
      unlockAchievement(aid);
    };
    if (newCompleted.length === 1) unlock("first");
    if (id === "intro") unlock("reader");
    if (id === "signs") unlock("explorer");
    if (id === "community") unlock("helper");
    if (newCompleted.length === SECTIONS.length) unlock("hero");

    setActiveSection(null);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
    saveProgress(newXp, newLevel, newCompleted, newAchievements);
  };

  const openSection = (id: Section) => {
    setActiveSection(id);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background cyber-grid flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-float">🛡️</div>
          <p className="font-orbitron text-neon-cyan text-sm animate-pulse-glow">Загрузка прогресса...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cyber-grid" ref={topRef}>
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10"
        style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)" }}
      />

      {/* Achievement toast */}
      {showAchievement && (
        <div className="fixed top-6 right-6 z-50 achievement-badge">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border-2 border-neon-yellow/60 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
            <span className="text-2xl">{showAchievement.icon}</span>
            <div>
              <div className="text-xs text-neon-yellow font-medium">Достижение разблокировано!</div>
              <div className="font-russo text-white text-sm">{showAchievement.title}</div>
            </div>
            <div className="text-xs text-neon-cyan font-orbitron ml-2">+{showAchievement.xp} XP</div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center">
              <span className="font-orbitron text-neon-cyan text-xs font-bold">CS</span>
            </div>
            <span className="font-russo text-white text-sm hidden sm:block">КиберЩит</span>
          </div>
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <LevelBadge level={level} />
            <div className="flex-1 space-y-1">
              <XPBar current={currentLevelXp} max={XP_PER_LEVEL} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentLevelXp} XP</span><span>{XP_PER_LEVEL} XP</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-orbitron text-neon-yellow animate-pulse-glow">{xp} XP</div>
            <div className="flex gap-1">
              {achievements.filter(a => a.unlocked).slice(0, 3).map(a => (
                <span key={a.id} className="text-sm">{a.icon}</span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-8">

          {/* Welcome / Hero */}
          {showWelcome && !activeSection && (
            <div className="text-center space-y-8 py-8 animate-slide-up">
              <div className="relative inline-block">
                <div className="absolute inset-0 blur-3xl bg-neon-cyan/20 rounded-full scale-150" />
                <div className="relative text-6xl md:text-7xl animate-float">🛡️</div>
              </div>
              <div className="space-y-4">
                <div className="font-orbitron text-neon-cyan text-sm tracking-widest uppercase animate-pulse-glow">
                  Образовательный Workbook
                </div>
                <h1 className="font-russo text-4xl md:text-6xl text-white leading-tight">
                  КИБЕР<span className="neon-cyan">ЩИТ</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                  Научись распознавать, противостоять и защищаться от кибербулинга.
                  Прокачай навыки, зарабатывай опыт и становись кибергероем!
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                {[{ label: "Разделов", value: "5" }, { label: "Заданий", value: "12+" }, { label: "XP", value: "365" }].map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-card border border-border text-center">
                    <div className="font-orbitron text-neon-cyan text-xl">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="btn-neon inline-flex items-center gap-2 px-10 py-4 rounded-xl font-russo text-lg text-background bg-neon-cyan hover:bg-neon-cyan/90 transition-all shadow-[0_0_30px_rgba(0,255,255,0.5)]"
              >
                <Icon name="Zap" size={20} />
                Начать обучение
              </button>
            </div>
          )}

          {/* Section list */}
          {!showWelcome && !activeSection && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center space-y-2">
                <h2 className="font-russo text-2xl text-white">Выбери раздел</h2>
                <p className="text-muted-foreground text-sm">Пройди все 5 уровней и стань кибергероем</p>
              </div>
              <div className="space-y-3">
                {SECTIONS.map((s, i) => {
                  const isDone = completed.includes(s.id);
                  const isLocked = i > 0 && !completed.includes(SECTIONS[i - 1].id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => !isLocked && openSection(s.id)}
                      disabled={isLocked}
                      className={`w-full game-card flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-300 text-left ${
                        isDone ? "border-neon-green/40 bg-neon-green/5"
                          : isLocked ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                          : colorMap[s.color] + " bg-card cursor-pointer"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDone ? "bg-neon-green/20" : bgColorMap[s.color]}`}>
                        {isDone ? <Icon name="CheckCircle" size={24} className="text-neon-green" />
                          : isLocked ? <Icon name="Lock" size={24} className="text-muted-foreground" />
                          : <Icon name={s.icon} fallback="BookOpen" size={24} className={textColorMap[s.color]} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-russo text-white text-sm">{s.label}</span>
                          {isDone && <span className="text-xs text-neon-green">✓ Завершено</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-orbitron ${isDone ? "text-neon-green" : textColorMap[s.color]}`}>+{s.xp} XP</span>
                          <span className="text-xs text-muted-foreground">Уровень {i + 1}</span>
                        </div>
                      </div>
                      {!isLocked && !isDone && <Icon name="ChevronRight" size={20} className={textColorMap[s.color]} />}
                    </button>
                  );
                })}
              </div>

              {/* Achievements grid */}
              <div className="mt-8 space-y-3">
                <h3 className="font-russo text-white text-lg">Достижения</h3>
                <div className="grid grid-cols-5 gap-3">
                  {achievements.map(a => (
                    <div key={a.id} className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                      a.unlocked ? "border-neon-yellow/40 bg-neon-yellow/5 shadow-[0_0_10px_rgba(251,191,36,0.2)]" : "border-border bg-muted/20 opacity-40"
                    }`}>
                      <span className="text-2xl">{a.icon}</span>
                      <span className="text-xs text-center text-muted-foreground leading-tight">{a.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {completed.length === SECTIONS.length && (
                <div className="mt-6 p-6 rounded-xl border-2 border-neon-yellow/50 bg-neon-yellow/5 text-center space-y-3">
                  <div className="text-4xl animate-float">🏆</div>
                  <h3 className="font-russo text-neon-yellow text-xl">Workbook завершён!</h3>
                  <p className="text-muted-foreground text-sm">Ты заработал {xp} XP и прошёл все уровни. Ты — настоящий кибергерой!</p>
                </div>
              )}
            </div>
          )}

          {/* Active section content */}
          {activeSection && (
            <div>
              <button onClick={() => setActiveSection(null)} className="flex items-center gap-2 text-muted-foreground hover:text-neon-cyan transition-colors mb-6 text-sm">
                <Icon name="ArrowLeft" size={16} />
                Вернуться к разделам
              </button>
              {activeSection === "intro" && <IntroSection onComplete={() => completeSection("intro", 50)} />}
              {activeSection === "signs" && <SignsSection onComplete={() => completeSection("signs", 75)} />}
              {activeSection === "community" && <CommunitySection onComplete={() => completeSection("community", 60)} />}
              {activeSection === "scenarios" && <ScenariosSection onComplete={() => completeSection("scenarios", 100)} />}
              {activeSection === "tips" && <TipsSection onComplete={() => completeSection("tips", 80)} />}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}