const PIECES = [
  { letter: 'K', name: 'General' },
  { letter: 'R', name: 'Rook'    },
  { letter: 'C', name: 'Cannon'  },
  { letter: 'H', name: 'Horse'   },
  { letter: 'E', name: 'Elephant'},
  { letter: 'A', name: 'Advisor' },
  { letter: 'S', name: 'Soldier' },
]

export default function PieceLegend() {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">
        Piece Key
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        {PIECES.map(({ letter, name }) => (
          <div key={letter} className="flex items-center gap-2 text-sm">
            <span className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center
              justify-center font-bold text-xs text-gray-300 shrink-0">
              {letter}
            </span>
            <span className="text-gray-400">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
