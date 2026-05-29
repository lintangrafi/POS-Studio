'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getUsers, createUser, toggleUserActive } from '@/actions/admin-actions';
import { Users, Plus } from 'lucide-react';

export default function SettingsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreateUser = async (formData: FormData) => {
    setError(null);
    const result = await createUser({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as 'CASHIER' | 'ADMIN' | 'SUPERADMIN',
    });

    if (result.error) {
      setError(result.error);
    } else {
      setShowAddUser(false);
      loadUsers();
    }
  };

  const handleToggleActive = async (userId: number) => {
    setToggleError(null);
    const result = await toggleUserActive(userId);
    if (result.error) {
      setToggleError(result.error);
      setTimeout(() => setToggleError(null), 3000);
    } else {
      loadUsers();
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-400">Memuat...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan</h1>
          <p className="text-sm text-slate-500">Kelola pengguna dan konfigurasi sistem</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddUser(!showAddUser)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah User
        </Button>
      </div>

      {toggleError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
          {toggleError}
        </div>
      )}

      {/* Add User Form */}
      {showAddUser && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Pengguna Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreateUser} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Nama *</label>
                <Input name="name" required placeholder="Nama lengkap" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Email *</label>
                <Input name="email" type="email" required placeholder="email@studio.com" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Password *</label>
                <Input name="password" type="password" required minLength={6} placeholder="Min. 6 karakter" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Role *</label>
                <select name="role" required className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                  <option value="CASHIER">Kasir</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>
              <div className="flex items-end gap-2 sm:col-span-2">
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" variant="primary">Simpan</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Pengguna
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                  <th className="pb-3 pr-4">Nama</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="py-3 pr-4 font-medium">{user.name}</td>
                    <td className="py-3 pr-4 text-slate-500">{user.email}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={user.role === 'SUPERADMIN' ? 'info' : user.role === 'ADMIN' ? 'success' : 'default'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(user.id)}
                      >
                        {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
