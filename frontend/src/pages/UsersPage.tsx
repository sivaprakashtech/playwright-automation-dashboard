import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Shield, User as UserIcon, Search } from 'lucide-react';
import api from '@/services/api';
import { generateUsers } from '@/data/demo';
import { User } from '@/types';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

const DEMO_USERS = generateUsers(20);

export default function UsersPage() {
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: async () => { const res = await api.get('/users'); return res.data.users; },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Deleted'); },
    onError: (err: { response?: { data?: { error?: string } } }) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const users = (data && data.length > 0) ? data : DEMO_USERS;
  const filtered = search ? users.filter((u: User) => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase())) : users;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-dark-400 mt-0.5">{filtered.length} team members</p>
        </div>
        <button onClick={() => { setEditUser(null); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search users..." />
      </div>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700/50">
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">User</th>
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Email</th>
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Role</th>
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-right text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/30">
            {filtered.map((user: User, index: number) => (
              <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }} className="hover:bg-dark-800/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${user.role === 'admin' ? 'bg-gradient-to-br from-primary-500/20 to-blue-500/20 border border-primary-500/20' : 'bg-dark-700/50 border border-dark-700'}`}>
                      {user.role === 'admin' ? <Shield className="w-3.5 h-3.5 text-primary-400" /> : <UserIcon className="w-3.5 h-3.5 text-dark-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-200">{user.full_name}</p>
                      <p className="text-[10px] text-dark-500">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-xs text-dark-400 hidden md:table-cell">{user.email}</td>
                <td className="px-5 py-3.5"><span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${user.role === 'admin' ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'bg-dark-700/50 text-dark-300'}`}>{user.role.replace('_', ' ')}</span></td>
                <td className="px-5 py-3.5"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${user.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => { setEditUser(user); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-500 inline-block"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteMutation.mutate(user.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-500 hover:text-red-400 inline-block ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <UserModal user={editUser} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function UserModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [form, setForm] = useState({ username: user?.username || '', email: user?.email || '', full_name: user?.full_name || '', role: user?.role || 'qa_engineer' as string, password: '', is_active: user?.is_active ?? true });
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => user ? api.put(`/users/${user.id}`, data) : api.post('/users', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success(user ? 'Updated' : 'Created'); onClose(); },
    onError: (err: { response?: { data?: { error?: string } } }) => toast.error(err.response?.data?.error || 'Failed'),
  });
  return (
    <Modal title={user ? 'Edit User' : 'Add User'} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Username</label><input className="input-field" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required disabled={!!user} /></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Full Name</label><input className="input-field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
        </div>
        <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Email</label><input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Role</label><select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="admin">Admin</option><option value="qa_engineer">QA Engineer</option></select></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Password</label><input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!user} placeholder={user ? 'Leave blank' : ''} /></div>
        </div>
        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button><button type="submit" className="btn-primary text-sm" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : user ? 'Update' : 'Create'}</button></div>
      </form>
    </Modal>
  );
}
