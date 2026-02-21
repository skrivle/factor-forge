'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignUpPage() {
  const [step, setStep] = useState<'invite' | 'account' | 'group'>('invite');
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedTables, setSelectedTables] = useState<number[]>([1,2,3,4,5,6,7,8,9,10]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleValidateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode }),
      });

      const data = await response.json();

      if (data.valid) {
        setStep('account');
      } else {
        setError(data.error || 'Invalid invite code');
      }
    } catch (err) {
      setError('Er ging iets mis bij het valideren van de code');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{4}$/.test(pin)) {
      setError('Pincode moet exact 4 cijfers zijn');
      return;
    }

    // Move to group setup step
    setStep('group');
  };

  const toggleTable = (table: number) => {
    if (selectedTables.includes(table)) {
      setSelectedTables(selectedTables.filter(t => t !== table));
    } else {
      setSelectedTables([...selectedTables, table]);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!groupName.trim()) {
      setError('Voer een groepsnaam in');
      setLoading(false);
      return;
    }

    if (selectedTables.length === 0) {
      setError('Selecteer minimaal één tafel');
      setLoading(false);
      return;
    }

    try {
      // Create account
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin, inviteCode, groupName, selectedTables }),
      });

      const signupData = await signupResponse.json();

      if (signupResponse.ok) {
        // Sign in the user
        const result = await signIn('credentials', {
          name,
          pin,
          redirect: false,
        });

        if (result?.ok) {
          // Redirect to home
          router.push('/');
          router.refresh();
        } else {
          setError('Account aangemaakt, maar inloggen mislukt');
        }
      } else {
        setError(signupData.error || 'Er ging iets mis');
      }
    } catch (err) {
      setError('Er ging iets mis bij het aanmaken van je account');
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
            {step === 'invite' 
              ? 'Voer je uitnodigingscode in'
              : step === 'account'
              ? 'Maak je account aan'
              : 'Stel je groep in'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'invite' ? (
            <form onSubmit={handleValidateInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite" className="text-white">Uitnodigingscode</Label>
                <Input
                  id="invite"
                  type="text"
                  placeholder="XXXX-XXXX-XXXX"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  required
                  className="bg-gray-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500 font-mono"
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
                {loading ? 'Valideren...' : 'Volgende'}
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => router.push('/auth/signin')}
                  className="text-gray-400 hover:text-white"
                >
                  Al een account? Aanmelden
                </Button>
              </div>
            </form>
          ) : step === 'account' ? (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
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
                <p className="text-xs text-gray-400">Kies een pincode die je makkelijk kan onthouden</p>
              </div>
              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-400 text-sm animate-shake">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg h-12"
              >
                Volgende
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('invite')}
                className="w-full text-gray-400 hover:text-white"
              >
                Terug
              </Button>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName" className="text-white">Groepsnaam</Label>
                <Input
                  id="groupName"
                  type="text"
                  placeholder="Bijv: Familie Jansen"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  className="bg-gray-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Kies welke tafels jullie willen oefenen</Label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((table) => (
                    <button
                      key={table}
                      type="button"
                      onClick={() => toggleTable(table)}
                      className={`
                        p-3 rounded font-bold text-lg transition-all
                        ${
                          selectedTables.includes(table)
                            ? 'bg-purple-600 text-white border-2 border-purple-400'
                            : 'bg-gray-800 text-gray-500 border-2 border-gray-700'
                        }
                        hover:scale-105 cursor-pointer
                      `}
                    >
                      {table}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400">Je kunt dit later aanpassen</p>
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
                {loading ? 'Account aanmaken...' : 'Start Oefenen! 🚀'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('account')}
                className="w-full text-gray-400 hover:text-white"
              >
                Terug
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
