import Link from 'next/link';

export default function NavigationButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-6 sm:mt-8">
      <Link
        href="/game"
        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-base sm:text-lg h-12 sm:h-14 rounded-md flex items-center justify-center transition-colors"
      >
        Speel Nu 🎮
      </Link>
      <Link
        href="/"
        className="flex-1 border-2 border-purple-500/50 text-white hover:bg-purple-500/20 font-bold text-base sm:text-lg h-12 sm:h-14 rounded-md flex items-center justify-center transition-colors"
      >
        Home
      </Link>
    </div>
  );
}
