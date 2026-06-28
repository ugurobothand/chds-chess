import { useLanguage } from '../i18n'

const PIECES = [
  { letter: 'K' },
  { letter: 'R' },
  { letter: 'C' },
  { letter: 'H' },
  { letter: 'E' },
  { letter: 'A' },
  { letter: 'S' },
]

export default function PieceLegend() {
  const { t } = useLanguage()

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">
        {t.game.labels.pieceKey}
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        {PIECES.map(({ letter }) => (
          <div key={letter} className="flex items-center gap-2 text-sm">
            <span className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center
              justify-center font-bold text-xs text-gray-300 shrink-0">
              {letter}
            </span>
            <span className="text-gray-400">{t.game.pieces[letter as keyof typeof t.game.pieces]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
