import Link from 'next/link';

interface TabSwitcherProps {
  currentType: 'all-time' | 'weekly';
}

export default function TabSwitcher({ currentType }: TabSwitcherProps) {
  return (
    <div className="flex gap-2 mb-4 sm:mb-6">
      <Link
        href="/leaderboard?type=all-time"
        className={`flex-1 text-sm sm:text-base rounded-md px-4 py-2 font-medium transition-colors text-center ${
          currentType === 'all-time'
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
            : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
      >
        Alle Tijden
      </Link>
      <Link
        href="/leaderboard?type=weekly"
        className={`flex-1 text-sm sm:text-base rounded-md px-4 py-2 font-medium transition-colors text-center ${
          currentType === 'weekly'
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
            : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
      >
        Deze Week
      </Link>
    </div>
  );
}
