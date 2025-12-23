import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-3xl">⚓</span>
          <span className="text-2xl font-bold text-white">Harbor</span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-slate-300 hover:text-white transition"
          >
            Login
          </Link>
          <Link
            href="/login"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Deploy apps to hardware
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              you already own.
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
            Your laptop can host your app. Free forever. No cloud rent.
            <br />
            Install HarborFlow, click deploy, get a public URL.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-lg transition shadow-lg shadow-blue-600/25"
            >
              Get Started — It&apos;s Free
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 border border-slate-600 hover:border-slate-500 text-slate-300 rounded-xl font-semibold text-lg transition"
            >
              How it works
            </a>
          </div>
        </div>

        {/* How it works */}
        <div id="how-it-works" className="mt-32">
          <h2 className="text-3xl font-bold text-white text-center mb-16">
            Three steps. Zero monthly bills.
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-2xl mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Install HarborFlow
              </h3>
              <p className="text-slate-400">
                Download HarborFlow on your laptop or PC. It runs quietly in the background.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
              <div className="w-12 h-12 bg-cyan-600/20 rounded-xl flex items-center justify-center text-2xl mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Connect your IDE
              </h3>
              <p className="text-slate-400">
                Add your API key to Cursor, VS Code, or any IDE. One-time setup.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center text-2xl mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Click deploy. Done.
              </h3>
              <p className="text-slate-400">
                Your app runs on YOUR hardware. Get a public URL instantly. Pay nothing.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-white text-center mb-16">
            Common questions
          </h2>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                What if my laptop sleeps?
              </h3>
              <p className="text-slate-400">
                Your app sleeps too. Visitors see a nice landing page. When you open your laptop, it&apos;s back online in seconds.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                What about bandwidth?
              </h3>
              <p className="text-slate-400">
                Harbor uses P2P technology. When many people access your content, they share with each other. Your laptop barely notices.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Is it really free?
              </h3>
              <p className="text-slate-400">
                Yes. Harbor coordinates, but YOUR hardware does the work. Our costs are minimal, so free works. Pro is $10/month for custom domains and extra features.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500">
          Harbor — Deploy apps to hardware you already own.
        </div>
      </footer>
    </div>
  );
}
