'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignInPage() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!/^\d{4}$/.test(pin)) {
      setError('Pincode moet exact 4 cijfers zijn');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        name,
        pin,
        redirect: false,
      });

      if (result?.error) {
        setError('Ongeldige naam of pincode');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <Card className="w-full max-w-md border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Factor Forge ⚡
          </CardTitle>
          <CardDescription className="text-gray-300 text-lg">
            Voer je naam en pincode in om te starten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Naam</Label>
              <Input
                id="name"
                type="text"
                placeholder="Voer je naam in"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-gray-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-white">4-cijferige pincode</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                required
                className="bg-gray-900/50 border-purple-500/30 text-white text-2xl tracking-widest text-center focus:border-purple-500"
              />
            </div>
            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-400 text-sm animate-shake">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg h-12"
            >
              {loading ? 'Aanmelden...' : 'Aanmelden'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Nog geen account? Vraag het aan een ouder.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
