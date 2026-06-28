import { useLanguage } from '../i18n'

export default function HelpPage() {
  const { t, dir } = useLanguage()

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold mb-2">{t.helpTitle}</h1>
        <p className="text-sm text-gray-400">{t.helpIntro}</p>
      </div>

      <section className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">{t.tabsTitle}</h2>
        <div className="space-y-3">
          {t.tabs.map(([label, description]) => (
            <div key={label} className="grid sm:grid-cols-[150px_1fr] gap-1 sm:gap-4 border-b border-gray-700 pb-3 last:border-0 last:pb-0">
              <div className="font-semibold text-yellow-400">{label}</div>
              <div className="text-sm text-gray-300 leading-6">{description}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">{t.flowTitle}</h2>
        <ol className="space-y-3 text-sm text-gray-300 leading-6 list-decimal list-inside">
          {t.flow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">{t.notesTitle}</h2>
        <ul className="space-y-3 text-sm text-gray-300 leading-6 list-disc list-inside">
          {t.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
