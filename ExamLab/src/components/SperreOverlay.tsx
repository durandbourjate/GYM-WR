export function SperreOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center">
      <div className="text-center text-white max-w-md px-6">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-3">Prüfung gesperrt</h2>
        <p className="text-red-300 font-semibold text-lg mb-4">
          Zu viele Verstösse
        </p>
        <p className="text-gray-300 mb-2">
          Deine Prüfung wurde gesperrt.
        </p>
        <p className="text-gray-300 mb-2">
          Wende dich an die Lehrperson zur Freischaltung.
        </p>
        <p className="text-gray-400 text-sm mt-4">
          Deine bisherigen Antworten sind gespeichert.
        </p>
      </div>
    </div>
  )
}
