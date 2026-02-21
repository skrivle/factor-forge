'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Settings, Trash2, UserPlus } from 'lucide-react';

interface User {
  id: string;
  name: string;
  role: string;
  created_at: string;
}

interface Group {
  id: string;
  name: string;
  supported_tables: number[];
  created_at: string;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [showCreateMember, setShowCreateMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPin, setNewMemberPin] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'parent' | 'child'>('child');
  const [editingTables, setEditingTables] = useState(false);
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (session?.user) {
      fetchGroupData();
    }
  }, [session]);

  const fetchGroupData = async () => {
    try {
      // Get user's group
      const groupResponse = await fetch('/api/groups');
      if (groupResponse.ok) {
        const data = await groupResponse.json();
        setGroup(data.group);
        setMembers(data.members || []);
        setSelectedTables(data.group?.supported_tables || [1,2,3,4,5,6,7,8,9,10]);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async () => {
    if (!group || !newMemberName || !newMemberPin) {
      alert('Vul alle velden in!');
      return;
    }

    if (!/^\d{4}$/.test(newMemberPin)) {
      alert('Pincode moet exact 4 cijfers zijn');
      return;
    }

    try {
      const response = await fetch('/api/admin/create-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.id,
          name: newMemberName,
          pin: newMemberPin,
          role: newMemberRole,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data.members);
        setShowCreateMember(false);
        setNewMemberName('');
        setNewMemberPin('');
        setNewMemberRole('child');
        alert(`${newMemberRole === 'parent' ? 'Ouder' : 'Kind'} succesvol aangemaakt!`);
      } else {
        const error = await response.json();
        alert(`Fout: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Er ging iets mis bij het aanmaken van het lid.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;

    if (deleteConfirmText !== 'DELETE') {
      alert('Type "DELETE" om te bevestigen');
      return;
    }

    try {
      const response = await fetch(`/api/admin/delete-group?groupId=${group.id}&confirm=DELETE`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Groep verwijderd. Je wordt uitgelogd...');
        // Sign out and redirect
        window.location.href = '/auth/signin';
      } else {
        const error = await response.json();
        alert(`Fout: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Er ging iets mis bij het verwijderen van de groep.');
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!group) return;
    
    if (!confirm(`Weet je zeker dat je ${userName} wilt verwijderen uit de groep?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/members?groupId=${group.id}&userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data.members);
        alert('Lid succesvol verwijderd!');
      } else {
        const error = await response.json();
        alert(`Fout: ${error.error}`);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Er ging iets mis bij het verwijderen van het lid.');
    }
  };

  const handleSaveSettings = async () => {
    if (!group || selectedTables.length === 0) {
      alert('Selecteer minimaal één tafel!');
      return;
    }

    try {
      const response = await fetch('/api/admin/group-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.id,
          supportedTables: selectedTables.sort((a, b) => a - b),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGroup(data.group);
        setEditingTables(false);
        alert('Instellingen succesvol bijgewerkt!');
      } else {
        const error = await response.json();
        alert(`Fout: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Er ging iets mis bij het bijwerken van de instellingen.');
    }
  };

  const toggleTable = (table: number) => {
    if (selectedTables.includes(table)) {
      setSelectedTables(selectedTables.filter(t => t !== table));
    } else {
      setSelectedTables([...selectedTables, table]);
    }
  };

  if (!session?.user || (session.user as { role: string }).role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
          <CardContent className="p-12 text-center text-white">
            <p>Alleen admins hebben toegang tot deze pagina.</p>
            <Button
              onClick={() => router.push('/')}
              className="mt-4"
            >
              Terug naar Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
        <div className="text-white text-2xl">Laden...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
          <CardContent className="p-12 text-center text-white">
            <p className="mb-4">Je zit nog niet in een groep.</p>
            <Button
              onClick={() => router.push('/groups/create')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            >
              Maak een Groep
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-white mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug
        </Button>

        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
              <Settings className="h-8 w-8 text-purple-400" />
              Admin Dashboard
            </CardTitle>
            <p className="text-gray-300 mt-2">
              Beheer groep: {group.name}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Groepsleden ({members.length})
                </h3>
                <Button
                  onClick={() => setShowCreateMember(true)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-500"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nieuw Lid Aanmaken
                </Button>
              </div>

              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-gray-900/50 border border-gray-700 rounded p-3 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-white font-semibold">{member.name}</div>
                      <div className="text-sm text-gray-400">
                        {member.role === 'admin' ? '👑 Admin' : member.role === 'parent' ? '👨‍👩‍👧 Ouder' : '👶 Kind'}
                      </div>
                    </div>
                    {member.id !== (session.user as { id: string }).id && (
                      <Button
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {showCreateMember && (
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded">
                  <h4 className="text-white font-bold mb-3">Nieuw Lid Aanmaken</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-white text-sm mb-1">Naam</label>
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                        placeholder="Naam"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">4-cijferige pincode</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={newMemberPin}
                        onChange={(e) => setNewMemberPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white text-center text-xl tracking-widest"
                        placeholder="••••"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">Rol</label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as 'parent' | 'child')}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                      >
                        <option value="child">Kind</option>
                        <option value="parent">Ouder</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateMember}
                        className="bg-green-600 hover:bg-green-500"
                      >
                        Aanmaken
                      </Button>
                      <Button
                        onClick={() => {
                          setShowCreateMember(false);
                          setNewMemberName('');
                          setNewMemberPin('');
                          setNewMemberRole('child');
                        }}
                        variant="ghost"
                        className="text-gray-400"
                      >
                        Annuleren
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Ondersteunde Tafels</h3>
                {!editingTables ? (
                  <Button
                    onClick={() => setEditingTables(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-500"
                  >
                    Bewerken
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveSettings}
                      size="sm"
                      className="bg-green-600 hover:bg-green-500"
                    >
                      Opslaan
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingTables(false);
                        setSelectedTables(group.supported_tables || []);
                      }}
                      size="sm"
                      variant="ghost"
                      className="text-gray-400"
                    >
                      Annuleren
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((table) => (
                  <button
                    key={table}
                    onClick={() => editingTables && toggleTable(table)}
                    disabled={!editingTables}
                    className={`
                      p-3 rounded font-bold text-lg transition-all
                      ${
                        (editingTables ? selectedTables : group.supported_tables).includes(table)
                          ? 'bg-purple-600 text-white border-2 border-purple-400'
                          : 'bg-gray-800 text-gray-500 border-2 border-gray-700'
                      }
                      ${editingTables ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                    `}
                  >
                    {table}
                  </button>
                ))}
              </div>

              <p className="text-sm text-gray-400 mt-3">
                {editingTables 
                  ? 'Klik op de tafels om ze te selecteren/deselecteren.'
                  : 'Deze tafels worden gebruikt in alle oefeningen en tests voor deze groep.'
                }
              </p>
            </div>

            <div className="border-t border-red-900/50 pt-6">
              <h3 className="text-xl font-bold text-red-400 mb-3">⚠️ Gevaarlijke Zone</h3>
              
              {!showDeleteConfirm ? (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <p className="text-gray-300 mb-3">
                    Verwijder deze groep en alle bijbehorende data permanent.
                  </p>
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-900/30"
                  >
                    Groep Verwijderen
                  </Button>
                </div>
              ) : (
                <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 space-y-4">
                  <div className="text-red-400 font-bold">
                    ⚠️ LET OP: Deze actie kan NIET ongedaan worden!
                  </div>
                  <div className="text-gray-300 text-sm space-y-1">
                    <p>Dit verwijdert permanent:</p>
                    <ul className="list-disc list-inside ml-4">
                      <li>Alle {members.length} groepsleden en hun accounts</li>
                      <li>Alle game sessies en scores</li>
                      <li>Alle tests en test resultaten</li>
                      <li>Alle statistieken en voortgang</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white text-sm">
                      Type <span className="font-mono font-bold text-red-400">DELETE</span> om te bevestigen:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-red-500 rounded text-white font-mono"
                      placeholder="DELETE"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDeleteGroup}
                      disabled={deleteConfirmText !== 'DELETE'}
                      className="bg-red-600 hover:bg-red-500 text-white"
                    >
                      Permanent Verwijderen
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      variant="ghost"
                      className="text-gray-400"
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
