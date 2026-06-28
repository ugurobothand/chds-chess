import { useCallback, useEffect, useState } from 'react'

export type LanguageCode = 'zh' | 'en' | 'ja' | 'ko' | 'es' | 'ar' | 'la'

export const LANGUAGES: { code: LanguageCode; label: string; dir?: 'rtl' }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'Español' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'la', label: 'Latina' },
]

const KEY = 'chds:language'

export function getLanguage(): LanguageCode {
  const stored = localStorage.getItem(KEY) as LanguageCode | null
  return LANGUAGES.some((lang) => lang.code === stored) ? stored! : 'zh'
}

export function useLanguage() {
  const [language, setLanguageState] = useState<LanguageCode>(() => getLanguage())

  useEffect(() => {
    function refresh() {
      setLanguageState(getLanguage())
    }

    window.addEventListener('storage', refresh)
    window.addEventListener('chds-language-change', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('chds-language-change', refresh)
    }
  }, [])

  const setLanguage = useCallback((next: LanguageCode) => {
    localStorage.setItem(KEY, next)
    setLanguageState(next)
    window.dispatchEvent(new Event('chds-language-change'))
  }, [])

  return { language, setLanguage, t: translations[language], dir: language === 'ar' ? 'rtl' : 'ltr' }
}

export const translations = {
  zh: {
    nav: { mint: '铸造', lobby: '大厅', game: '棋局', profile: '资料', leaderboard: '排行', help: '帮助' },
    helpTitle: '游戏说明',
    helpIntro: '这里说明每个标签的作用，以及从创建棋局到对弈的完整流程。',
    tabsTitle: '标签作用',
    flowTitle: '从开始到对局',
    notesTitle: '注意事项',
    tabs: [
      ['铸造', '领取 Chess Pass。没有 pass 的钱包不能创建或加入棋局。'],
      ['大厅', '显示尚未被加入的 open games。你可以创建新棋局，或加入别人创建的棋局。'],
      ['棋局 #ID', '最近访问过的棋局。这里是实际下棋、开启 Auto Moves、认输、超时认领和切换棋子显示的地方。'],
      ['资料', '查看当前钱包地址、pass 状态、胜负记录，并返回最近棋局。'],
      ['排行', '读取链上已结束棋局，显示胜场、负场和胜率。'],
      ['帮助', '查看这些多语言说明。'],
    ],
    flow: [
      '连接钱包，并确认网络是 Anvil Local / 31337。',
      '进入铸造页面，点击 Mint Pass，为当前钱包领取 pass。',
      '切到另一个浏览器或浏览器资料夹，导入第二个账号，也领取 pass。',
      '第一个账号进入大厅，点击 Create Game，测试时 wager 建议填 0。',
      '第二个账号进入大厅，点击 Join 加入这局 open game。',
      '加入成功后会进入 /game/:gameId，双方都打开同一个 gameId。',
      '红方先手，黑方随后轮流走棋。',
      '每个玩家可以在棋局页面点击 Enable Auto Moves，授权后普通走棋不再每步弹钱包。',
    ],
    notes: [
      '大厅只显示尚未开始的 open games；已经加入成功的棋局不会留在大厅。',
      '离开棋盘后，用顶部 Game #ID 或资料页的 Resume Game 返回当前棋局。',
      'Auto Moves 只对当前浏览器、当前钱包、当前 gameId 有效；换账号或换棋局要重新开启。',
      '认输、超时认领和资金相关操作仍然需要主钱包确认。',
    ],
  },
  en: {
    nav: { mint: 'Mint', lobby: 'Lobby', game: 'Game', profile: 'Profile', leaderboard: 'Leaderboard', help: 'Help' },
    helpTitle: 'Game Guide',
    helpIntro: 'This page explains each tab and the full flow from creating a game to playing it.',
    tabsTitle: 'Tabs',
    flowTitle: 'Start to Play',
    notesTitle: 'Notes',
    tabs: [
      ['Mint', 'Claim a Chess Pass. A wallet needs a pass before it can create or join games.'],
      ['Lobby', 'Shows open games that have not been joined yet. Create a game or join another player.'],
      ['Game #ID', 'Your most recently opened game. This is where you move pieces, enable Auto Moves, resign, claim timeout, and switch piece labels.'],
      ['Profile', 'Shows wallet address, pass status, win/loss record, and a resume-game button.'],
      ['Leaderboard', 'Reads finished games on-chain and shows wins, losses, and win rate.'],
      ['Help', 'Shows these multilingual instructions.'],
    ],
    flow: [
      'Connect your wallet and confirm the network is Anvil Local / 31337.',
      'Open Mint and click Mint Pass for the current wallet.',
      'Use a second browser or browser profile, import the second account, and mint a pass there too.',
      'With the first account, open Lobby and click Create Game. Use wager 0 for local testing.',
      'With the second account, open Lobby and click Join on that open game.',
      'After joining, open /game/:gameId. Both players should use the same gameId.',
      'Red moves first, then Black responds in turns.',
      'Each player may click Enable Auto Moves on the game page. After authorization, normal moves no longer need a wallet popup each turn.',
    ],
    notes: [
      'Lobby only shows open games. Joined games disappear from Lobby because they are already active.',
      'After leaving the board, use Game #ID in the top nav or Resume Game in Profile.',
      'Auto Moves is scoped to this browser, wallet, and gameId. Changing account or game requires enabling it again.',
      'Resign, timeout claims, and fund-related actions still require the main wallet.',
    ],
  },
  ja: {
    nav: { mint: 'ミント', lobby: 'ロビー', game: '対局', profile: 'プロフィール', leaderboard: 'ランキング', help: 'ヘルプ' },
    helpTitle: 'ゲーム説明',
    helpIntro: '各タブの役割と、対局を作成して遊ぶまでの流れを説明します。',
    tabsTitle: 'タブの役割',
    flowTitle: '開始から対局まで',
    notesTitle: '注意',
    tabs: [
      ['ミント', 'Chess Pass を取得します。pass がないウォレットは対局を作成・参加できません。'],
      ['ロビー', 'まだ参加されていない open games を表示します。新規作成または参加ができます。'],
      ['対局 #ID', '最近開いた対局です。駒を動かす、Auto Moves、投了、タイムアウト請求、駒表示切替を行います。'],
      ['プロフィール', 'ウォレット、pass 状態、勝敗記録、最近の対局への復帰を表示します。'],
      ['ランキング', '終了済み対局をオンチェーンで読み取り、勝敗と勝率を表示します。'],
      ['ヘルプ', 'この多言語説明を表示します。'],
    ],
    flow: [
      'ウォレットを接続し、ネットワークが Anvil Local / 31337 であることを確認します。',
      'ミント画面で Mint Pass をクリックし、現在のウォレットに pass を取得します。',
      '別ブラウザまたは別プロファイルで 2 つ目のアカウントをインポートし、同様に pass を取得します。',
      '1 つ目のアカウントでロビーを開き、Create Game をクリックします。ローカルテストでは wager 0 が便利です。',
      '2 つ目のアカウントでロビーを開き、その open game の Join をクリックします。',
      '参加後は /game/:gameId を開きます。両方のプレイヤーが同じ gameId を使います。',
      '赤が先手で、その後は黒と交互に指します。',
      '各プレイヤーは Enable Auto Moves を有効にできます。認可後、通常の着手で毎回ウォレット確認は不要になります。',
    ],
    notes: [
      'ロビーは未開始の open games だけを表示します。参加済みの対局はロビーから消えます。',
      '盤面を離れた後は、上部の Game #ID またはプロフィールの Resume Game で戻れます。',
      'Auto Moves は現在のブラウザ、ウォレット、gameId のみに有効です。変更した場合は再度有効化が必要です。',
      '投了、タイムアウト請求、資金関連操作は引き続きメインウォレット確認が必要です。',
    ],
  },
  ko: {
    nav: { mint: '민트', lobby: '로비', game: '게임', profile: '프로필', leaderboard: '순위', help: '도움말' },
    helpTitle: '게임 안내',
    helpIntro: '각 탭의 역할과 게임을 만들고 참여하고 진행하는 전체 흐름입니다.',
    tabsTitle: '탭 설명',
    flowTitle: '시작부터 대국까지',
    notesTitle: '주의사항',
    tabs: [
      ['민트', 'Chess Pass를 받습니다. pass가 없으면 게임 생성이나 참여가 불가능합니다.'],
      ['로비', '아직 참여자가 없는 open game을 보여줍니다. 새 게임을 만들거나 다른 게임에 참여합니다.'],
      ['게임 #ID', '최근 열었던 대국입니다. 실제로 말을 움직이고 Auto Moves, 기권, 시간초과 청구, 말 표시 전환을 합니다.'],
      ['프로필', '지갑 주소, pass 상태, 승패 기록, 최근 게임 복귀 버튼을 보여줍니다.'],
      ['순위', '완료된 게임을 온체인에서 읽어 승수, 패수, 승률을 보여줍니다.'],
      ['도움말', '이 다국어 안내를 보여줍니다.'],
    ],
    flow: [
      '지갑을 연결하고 네트워크가 Anvil Local / 31337인지 확인합니다.',
      '민트 페이지에서 Mint Pass를 눌러 현재 지갑에 pass를 받습니다.',
      '두 번째 브라우저나 프로필에서 두 번째 계정을 가져오고 pass를 받습니다.',
      '첫 번째 계정으로 로비에서 Create Game을 누릅니다. 로컬 테스트는 wager 0을 권장합니다.',
      '두 번째 계정으로 로비에서 해당 open game의 Join을 누릅니다.',
      '참여 후 /game/:gameId를 엽니다. 두 플레이어 모두 같은 gameId를 사용해야 합니다.',
      '빨간 쪽이 먼저 두고, 이후 검은 쪽과 번갈아 둡니다.',
      '각 플레이어는 Enable Auto Moves를 켤 수 있습니다. 승인 후 일반 이동은 매번 지갑 팝업이 필요 없습니다.',
    ],
    notes: [
      '로비는 아직 시작되지 않은 open game만 보여줍니다. 참여된 게임은 로비에서 사라집니다.',
      '보드를 떠난 뒤에는 상단 Game #ID 또는 프로필의 Resume Game으로 돌아갑니다.',
      'Auto Moves는 현재 브라우저, 지갑, gameId에만 적용됩니다. 계정이나 게임을 바꾸면 다시 켜야 합니다.',
      '기권, 시간초과 청구, 자금 관련 작업은 여전히 메인 지갑 확인이 필요합니다.',
    ],
  },
  es: {
    nav: { mint: 'Mint', lobby: 'Sala', game: 'Partida', profile: 'Perfil', leaderboard: 'Clasificación', help: 'Ayuda' },
    helpTitle: 'Guía del juego',
    helpIntro: 'Esta página explica cada pestaña y el flujo completo para crear, unirse y jugar.',
    tabsTitle: 'Pestañas',
    flowTitle: 'De inicio a partida',
    notesTitle: 'Notas',
    tabs: [
      ['Mint', 'Obtiene un Chess Pass. La cartera necesita un pass para crear o unirse a partidas.'],
      ['Sala', 'Muestra partidas abiertas que aún no tienen rival. Puedes crear una partida o unirte a otra.'],
      ['Partida #ID', 'Tu partida abierta más reciente. Aquí mueves piezas, activas Auto Moves, te rindes, reclamas timeout y cambias las etiquetas.'],
      ['Perfil', 'Muestra dirección, estado del pass, victorias/derrotas y botón para reanudar la partida.'],
      ['Clasificación', 'Lee partidas terminadas en la cadena y muestra victorias, derrotas y porcentaje de victoria.'],
      ['Ayuda', 'Muestra estas instrucciones multilingües.'],
    ],
    flow: [
      'Conecta la cartera y confirma que la red sea Anvil Local / 31337.',
      'Abre Mint y pulsa Mint Pass para la cartera actual.',
      'Usa otro navegador o perfil, importa la segunda cuenta y consigue también su pass.',
      'Con la primera cuenta abre Sala y pulsa Create Game. Para pruebas locales usa wager 0.',
      'Con la segunda cuenta abre Sala y pulsa Join en esa partida abierta.',
      'Después de unirte, abre /game/:gameId. Ambos jugadores deben usar el mismo gameId.',
      'Rojo juega primero y Negro responde por turnos.',
      'Cada jugador puede pulsar Enable Auto Moves. Después de autorizar, los movimientos normales no requieren popup de cartera cada turno.',
    ],
    notes: [
      'La sala solo muestra partidas abiertas. Las partidas ya unidas desaparecen porque están activas.',
      'Después de salir del tablero, usa Game #ID arriba o Resume Game en Perfil.',
      'Auto Moves vale solo para este navegador, cartera y gameId. Si cambias cuenta o partida, actívalo otra vez.',
      'Rendirse, reclamar timeout y acciones de fondos siguen requiriendo la cartera principal.',
    ],
  },
  ar: {
    nav: { mint: 'سك', lobby: 'الردهة', game: 'اللعبة', profile: 'الملف', leaderboard: 'الترتيب', help: 'المساعدة' },
    helpTitle: 'دليل اللعبة',
    helpIntro: 'تشرح هذه الصفحة وظيفة كل تبويب، وطريقة إنشاء اللعبة والانضمام إليها واللعب.',
    tabsTitle: 'التبويبات',
    flowTitle: 'من البداية إلى اللعب',
    notesTitle: 'ملاحظات',
    tabs: [
      ['سك', 'احصل على Chess Pass. لا يمكن للمحفظة إنشاء لعبة أو الانضمام بدون pass.'],
      ['الردهة', 'تعرض الألعاب المفتوحة التي لم ينضم إليها لاعب بعد. يمكنك إنشاء لعبة أو الانضمام إلى لعبة أخرى.'],
      ['اللعبة #ID', 'آخر لعبة فتحتها. هنا تحرك القطع، وتفعل Auto Moves، وتستسلم، وتطالب بانتهاء الوقت، وتغير عرض القطع.'],
      ['الملف', 'يعرض عنوان المحفظة، حالة pass، سجل الفوز والخسارة، وزر الرجوع إلى اللعبة الأخيرة.'],
      ['الترتيب', 'يقرأ الألعاب المنتهية من السلسلة ويعرض الفوز والخسارة ونسبة الفوز.'],
      ['المساعدة', 'تعرض هذه التعليمات متعددة اللغات.'],
    ],
    flow: [
      'صل المحفظة وتأكد أن الشبكة هي Anvil Local / 31337.',
      'افتح صفحة السك واضغط Mint Pass للمحفظة الحالية.',
      'استخدم متصفحا آخر أو ملفا آخر، واستورد الحساب الثاني، ثم احصل له على pass.',
      'بالحساب الأول افتح الردهة واضغط Create Game. للاختبار المحلي استخدم wager 0.',
      'بالحساب الثاني افتح الردهة واضغط Join على تلك اللعبة المفتوحة.',
      'بعد الانضمام افتح /game/:gameId. يجب أن يستخدم اللاعبان نفس gameId.',
      'الأحمر يبدأ أولا، ثم الأسود يرد بالتناوب.',
      'يمكن لكل لاعب ضغط Enable Auto Moves. بعد التفويض، لا تحتاج الحركات العادية إلى نافذة المحفظة في كل دور.',
    ],
    notes: [
      'الردهة تعرض الألعاب المفتوحة فقط. اللعبة التي تم الانضمام إليها تختفي لأنها أصبحت نشطة.',
      'بعد مغادرة اللوحة، استخدم Game #ID في الأعلى أو Resume Game في الملف.',
      'Auto Moves صالح فقط لهذا المتصفح والمحفظة و gameId. عند تغيير الحساب أو اللعبة يجب تفعيله من جديد.',
      'الاستسلام، مطالبة انتهاء الوقت، وأعمال الأموال ما زالت تحتاج تأكيد المحفظة الرئيسية.',
    ],
  },
  la: {
    nav: { mint: 'Signum', lobby: 'Atrium', game: 'Ludus', profile: 'Persona', leaderboard: 'Tabula', help: 'Auxilium' },
    helpTitle: 'Dux ludi',
    helpIntro: 'Haec pagina partes tabularum et ordinem ab initio usque ad ludum explicat.',
    tabsTitle: 'Tabulae',
    flowTitle: 'Ab initio ad ludum',
    notesTitle: 'Notae',
    tabs: [
      ['Signum', 'Accipe Chess Pass. Sine pass, marsupium ludum creare aut intrare non potest.'],
      ['Atrium', 'Ludos apertos nondum acceptos ostendit. Ludum novum crea vel alterius ludum intra.'],
      ['Ludus #ID', 'Ludus nuper apertus. Hic piezas moves, Auto Moves accendis, cedis, tempus vindicas, et notas mutas.'],
      ['Persona', 'Ostendit inscriptionem marsupii, statum pass, victorias et clades, et reditum ad ludum.'],
      ['Tabula', 'Ludos finitos e catena legit et victorias, clades, rationem victoriae ostendit.'],
      ['Auxilium', 'Has instructiones multis linguis ostendit.'],
    ],
    flow: [
      'Coniunge marsupium et confirma rete esse Anvil Local / 31337.',
      'Aperi Signum et preme Mint Pass pro marsupio praesenti.',
      'Alterum navigatrum vel profile utere, secundam rationem importa, et pass accipe.',
      'Prima ratione aperi Atrium et preme Create Game. In probatione locali wager 0 utere.',
      'Secunda ratione aperi Atrium et preme Join in illo ludo aperto.',
      'Post ingressum aperi /game/:gameId. Ambo lusores eodem gameId uti debent.',
      'Ruber primus movet, deinde Niger per vices respondet.',
      'Uterque lusor Enable Auto Moves premere potest. Post auctoritatem, motus ordinarii non iam singulis vicibus fenestram marsupii petunt.',
    ],
    notes: [
      'Atrium tantum ludos apertos ostendit. Ludus iam acceptus ab Atrio discedit quia activus est.',
      'Postquam tabulam reliquisti, utere Game #ID in summo vel Resume Game in Persona.',
      'Auto Moves valet tantum huic navigatro, marsupio, et gameId. Mutata ratione aut ludo, iterum accende.',
      'Cedere, tempus vindicare, et res pecuniariae adhuc confirmationem marsupii principalis requirunt.',
    ],
  },
} satisfies Record<LanguageCode, {
  nav: { mint: string; lobby: string; game: string; profile: string; leaderboard: string; help: string }
  helpTitle: string
  helpIntro: string
  tabsTitle: string
  flowTitle: string
  notesTitle: string
  tabs: [string, string][]
  flow: string[]
  notes: string[]
}>
