import { Info } from 'lucide-react'

export function DemoHint() {
  // Only show in demo mode
  if (import.meta.env.VITE_DEMO_MODE !== 'true') {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="text-blue-800 font-medium mb-1">
            Demo-Modus aktiv
          </p>
          <p className="text-blue-600">
            Du nutzt eine Demo-Version mit Beispieldaten. Alle Änderungen werden lokal in deinem Browser gespeichert.
          </p>
        </div>
      </div>
    </div>
  )
}
