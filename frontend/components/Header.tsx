export default function Header() {
  return (
    <header className="bg-slate-900/50 backdrop-blur border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Kryptos</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-slate-300 hover:text-white transition">
              Security
            </a>
            <a href="#" className="text-slate-300 hover:text-white transition">
              About
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
