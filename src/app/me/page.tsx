"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { AvailabilityGrid } from '@/components/AvailabilityGrid';
import { useUsersStore } from '@/store/users';

export default function MyAvailabilityPage() {
  const users = useUsersStore((state) => state.users);
  const addUser = useUsersStore((state) => state.addUser);
  const isLoading = useUsersStore((state) => state.isLoading);
  const error = useUsersStore((state) => state.error);
  // Fixed week - always show the week of November 2, 2025
  const weekStartISO = '2025-11-02';
  const defaultUserId = users[0]?.id ?? null;
  const [selectedUserId, setSelectedUserId] = useState<string | null>(defaultUserId);
  const [newUserName, setNewUserName] = useState<string>('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const previousUsersCountRef = useRef(users.length);
  const addedUserNameRef = useRef<string | null>(null);

  const handleUserChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedUserId(value ? value : null);
  };

  const handleAddUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = newUserName.trim();
    if (!trimmedName || isAddingUser) {
      return;
    }

    setIsAddingUser(true);
    addedUserNameRef.current = trimmedName;
    try {
      await addUser(trimmedName);
      setNewUserName('');
    } finally {
      setIsAddingUser(false);
    }
  };

  // Auto-select newly added user
  useEffect(() => {
    if (users.length > previousUsersCountRef.current && addedUserNameRef.current) {
      const newUser = users.find((user) => user.name === addedUserNameRef.current);
      if (newUser) {
        setSelectedUserId(newUser.id);
      }
      addedUserNameRef.current = null;
    }
    previousUsersCountRef.current = users.length;
  }, [users]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) {
      return null;
    }
    return users.find((user) => user.id === selectedUserId) ?? null;
  }, [selectedUserId, users]);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white/70 p-6 shadow-md backdrop-blur">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-slate-800">Meine Verfügbarkeit</h2>
          <p className="text-sm text-slate-500">
            Wähle dich aus der Liste aus und markiere alle Zeitblöcke, in denen du Lehrbereitschaft
            übernehmen kannst.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          )}
          {isLoading && (
            <div className="text-sm text-slate-500">Lade Benutzer...</div>
          )}
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Person
            <select
              value={selectedUserId ?? ''}
              onChange={handleUserChange}
              disabled={isLoading}
              className="w-full rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 text-base font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>

          <form onSubmit={handleAddUser} className="flex flex-col gap-2">
            <label htmlFor="new-user" className="text-sm font-medium text-slate-600">
              Neue Person hinzufügen
            </label>
            <div className="flex gap-2">
              <input
                id="new-user"
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Name eingeben..."
                disabled={isAddingUser}
                className="flex-1 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 text-base text-slate-700 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!newUserName.trim() || isAddingUser}
                className="rounded-2xl border border-indigo-200 bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-500"
              >
                {isAddingUser ? 'Hinzufügen...' : 'Hinzufügen'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <AvailabilityGrid
        weekStartISO={weekStartISO}
        currentUserId={selectedUser ? selectedUser.id : null}
      />
    </div>
  );
}
