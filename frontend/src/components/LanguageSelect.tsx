import { LANGUAGES, LanguageCode, useLanguage } from '../i18n'

export default function LanguageSelect() {
  const { language, setLanguage } = useLanguage()

  return (
    <select
      value={language}
      onChange={(event) => setLanguage(event.target.value as LanguageCode)}
      className="text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
      title="Language"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  )
}
