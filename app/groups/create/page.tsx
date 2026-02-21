'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';

interface User {
  id: string;
  name: string;
  role: string;
}

export default function CreateGroupPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (session?.user) {
      const userId = (session.user as any).id;
      setSelectedUsers([userId]);
      // In a real app, you'd fetch all users from an API
      // For now, we'll just auto-add the current user
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      alert('Voer een groepsnaam in!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          userIds: selectedUsers,
        }),
      });

      if (response.ok) {
        alert('Groep succesvol aangemaakt!');
        router.push('/tests/create');
      } else {
        const error = await response.json();
        alert(`Fout: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Er ging iets mis bij het aanmaken van de groep.');
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user || (session.user as any).role !== 'parent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
          <CardContent className="p-12 text-center text-white">
            <p>Alleen ouders kunnen groepen aanmaken.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-white mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug
        </Button>

        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
              <Users className="h-8 w-8 text-purple-400" />
              Nieuwe Groep Maken
            </CardTitle>
            <p className="text-gray-300 mt-2">
              Maak een gezinsgroep aan om tests te kunnen maken en resultaten te bekijken.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Groepsnaam *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded text-white text-lg"
                  placeholder="Bijv: Familie Jansen"
                />
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4">
                <div className="text-blue-400 font-bold mb-2">ℹ️ Over Groepen</div>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Je wordt automatisch lid van de groep</li>
                  <li>• Je kunt later meer gezinsleden toevoegen</li>
                  <li>• Alleen groepsleden kunnen elkaars voortgang zien</li>
                  <li>• Het klassement wordt gefilterd op je groep</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={loading || !groupName.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xl h-14"
              >
                {loading ? 'Bezig...' : 'Groep Aanmaken'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
