'use client';

import { Button } from '@/components/ui/button';

interface NumpadProps {
  onNumberClick: (num: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}

export default function Numpad({ onNumberClick, onBackspace, onClear }: NumpadProps) {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="grid grid-cols-3 gap-2">
        {numbers.map((num) => (
          <Button
            key={num}
            onClick={() => onNumberClick(num)}
            className="h-16 text-2xl font-bold bg-purple-600/20 hover:bg-purple-600/40 border-2 border-purple-500/50 text-white"
            variant="outline"
          >
            {num}
          </Button>
        ))}
        <Button
          onClick={onBackspace}
          className="h-16 text-lg font-bold bg-red-600/20 hover:bg-red-600/40 border-2 border-red-500/50 text-white"
          variant="outline"
        >
          ⌫
        </Button>
        <Button
          onClick={onClear}
          className="h-16 text-lg font-bold bg-orange-600/20 hover:bg-orange-600/40 border-2 border-orange-500/50 text-white col-span-2"
          variant="outline"
        >
          Wis
        </Button>
      </div>
    </div>
  );
}
