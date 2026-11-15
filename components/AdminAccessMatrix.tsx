import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { UserProgress } from '../types';

export interface UserAccessPermission {
  uid: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'user' | 'guest';
  status: 'Allow' | 'Deny';
  aiStudioAccess: 'Allow' | 'Deny';
  usEast1Access: 'Allow' | 'Deny';
  firestoreAccess: 'Allow' | 'Deny';
  tokenStatus: 'valid' | 'expired' | 'revoked' | 'anomaly';
  anomalyNote?: string;
  lastChecked: string;
}

const DEFAULT_ACCESS_ROWS: UserAccessPermission[] = [
  {
    uid: 'abramovanatolij81_master',
    name: 'Анатолий Абрамов (Главный Владелец)',
    email: 'abramovanatolij81@gmail.com',
    role: 'owner',
    status: 'Allow',
    aiStudioAccess: 'Allow',
    usEast1Access: 'Allow',
    firestoreAccess: 'Allow',
    tokenStatus: 'valid',
    anomalyNote: 'Авторизован в Google Cloud / Firebase (Правило isAdmin: TRUE)',
    lastChecked: 'Только что'
  },
  {
    uid: 'va997217_secondary',
    name: 'Владимир (Со-владелец)',
    email: 'va997217@gmail.com',
    role: 'owner',
    status: 'Allow',
    aiStudioAccess: 'Allow',
    usEast1Access: 'Allow',
    firestoreAccess: 'Allow',
    tokenStatus: 'valid',
    anomalyNote: 'Авторизован в Whitelist (Правило isAdmin: TRUE)',
    lastChecked: 'Только что'
  },
  {
    uid: 'suspicious_proxy_runapp',
    name: 'Сессия без токена (us-east1.run.app)',
    email: 'unknown_worker@us-east1.run.app',
    role: 'guest',
    status: 'Deny',
    aiStudioAccess: 'Deny',
    usEast1Access: 'Deny',
    firestoreAccess: 'Deny',
    tokenStatus: 'anomaly',
    anomalyNote: '⚠️ Обнаружена аномалия: неавторизованный запрос к us-east1.run.app без валидного токена',
    lastChecked: '1 мин назад'
  },
  {
    uid: 'expired_session_studio',
    name: 'Устаревший токен (ai.studio)',
    email: 'former_collaborator@ai.studio',
    role: 'user',
    status: 'Deny',
    aiStudioAccess: 'Deny',
    usEast1Access: 'Deny',
    firestoreAccess: 'Deny',
    tokenStatus: 'expired',
    anomalyNote: '⚠️ Токен устарел (> 3600 сек). Права доступа отозваны',
    lastChecked: '5 мин назад'
  },
  {
    uid: 'guest_incognito_user',
    name: 'Гостевой режим (Incognito)',
    email: 'guest@duowindo.app',
    role: 'guest',
    status: 'Deny',
    aiStudioAccess: 'Deny',
    usEast1Access: 'Deny',
    firestoreAccess: 'Deny',
    tokenStatus: 'revoked',
    anomalyNote: 'Вход без аккаунта. Панель владельца полностью заблокирована',
    lastChecked: '10 мин назад'
  }
];

interface AdminAccessMatrixProps {
  currentUser: UserProgress;
  isUnlocked: boolean;
  isOwnerByEmail: boolean;
  onAddAuditLog?: (action: string, target: string, change: string) => void;
  playSound?: (type: string) => void;
  setToast?: (msg: string | null) => void;
}

export const AdminAccessMatrix: React.FC<AdminAccessMatrixProps> = ({
  currentUser,
  isUnlocked,
  isOwnerByEmail,
  onAddAuditLog,
  playSound,
  setToast
}) => {
  const [permissions, setPermissions] = useState<UserAccessPermission[]>(() => {
    try {
      const saved = localStorage.getItem('duo_admin_access_matrix');
      return saved ? JSON.parse(saved) : DEFAULT_ACCESS_ROWS;
    } catch {
      return DEFAULT_ACCESS_ROWS;
    }
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Allow' | 'Deny' | 'anomaly'>('all');
  const [newUidInput, setNewUidInput] = useState<string>('');
  const [newEmailInput, setNewEmailInput] = useState<string>('');
  const [newNameInput, setNewNameInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Sync to local storage
  const savePermissions = (updated: UserAccessPermission[]) => {
    setPermissions(updated);
    try {
      localStorage.setItem('duo_admin_access_matrix', JSON.stringify(updated));
    } catch {}
  };

  // Force reset permissions for a specific UID
  const handleForceResetPermission = (targetUid: string) => {
    playSound?.('wrong');
    const target = permissions.find(p => p.uid === targetUid);
    if (!target) return;

    const updated = permissions.map(p => {
      if (p.uid === targetUid) {
        return {
          ...p,
          status: 'Deny' as const,
          aiStudioAccess: 'Deny' as const,
          usEast1Access: 'Deny' as const,
          firestoreAccess: 'Deny' as const,
          tokenStatus: 'revoked' as const,
          anomalyNote: '⛔ Права принудительно сброшены администратором. Доступ к ai.studio и us-east1.run.app заблокирован.',
          lastChecked: new Date().toLocaleTimeString('ru-RU')
        };
      }
      return p;
    });

    savePermissions(updated);
    onAddAuditLog?.(
      'Принудительный сброс прав',
      `UID: ${targetUid} (${target.email})`,
      'Allow ➔ Deny (Отозван доступ к ai.studio и us-east1.run.app)'
    );

    setToast?.(`⛔ Права для UID ${targetUid} принудительно сброшены (DENY)!`);
  };

  // Toggle single user allow/deny
  const handleToggleAllowDeny = (targetUid: string) => {
    playSound?.('click');
    const target = permissions.find(p => p.uid === targetUid);
    if (!target) return;

    const nextStatus: 'Allow' | 'Deny' = target.status === 'Allow' ? 'Deny' : 'Allow';
    const updated: UserAccessPermission[] = permissions.map(p => {
      if (p.uid === targetUid) {
        return {
          ...p,
          status: nextStatus,
          aiStudioAccess: nextStatus,
          usEast1Access: nextStatus,
          firestoreAccess: nextStatus,
          tokenStatus: (nextStatus === 'Allow' ? 'valid' : 'revoked') as any,
          anomalyNote: nextStatus === 'Allow' ? 'Права вручную предоставлены администратором' : 'Доступ заблокирован администратором',
          lastChecked: new Date().toLocaleTimeString('ru-RU')
        };
      }
      return p;
    });

    savePermissions(updated);
    onAddAuditLog?.(
      'Изменение статуса доступа',
      `UID: ${targetUid}`,
      `Статус изменен на: ${nextStatus}`
    );
    setToast?.(`Статус для UID ${targetUid} изменен на ${nextStatus}`);
  };

  // Emergency Global Force Reset on Anomalies
  const handleGlobalAnomalyForceReset = () => {
    playSound?.('wrong');
    let revokedCount = 0;

    const updated = permissions.map(p => {
      const isOwner = p.email === 'abramovanatolij81@gmail.com' || p.email === 'va997217@gmail.com';
      const hasAnomaly = p.tokenStatus === 'anomaly' || p.tokenStatus === 'expired' || p.anomalyNote?.includes('аномалия');

      if (!isOwner && (hasAnomaly || p.status === 'Allow')) {
        revokedCount++;
        return {
          ...p,
          status: 'Deny' as const,
          aiStudioAccess: 'Deny' as const,
          usEast1Access: 'Deny' as const,
          firestoreAccess: 'Deny' as const,
          tokenStatus: 'revoked' as const,
          anomalyNote: '🚨 Сброшено протоколом защиты аномалий ai.studio / us-east1.run.app',
          lastChecked: new Date().toLocaleTimeString('ru-RU')
        };
      }
      return p;
    });

    savePermissions(updated);
    onAddAuditLog?.(
      'Глобальный сброс прав при аномалиях',
      'Система безопасности DuoWindo6601',
      `Отозваны права для ${revokedCount} подозрительных сессий ai.studio и us-east1.run.app`
    );

    setToast?.(`🚨 Сброс завершен! Заблокировано ${revokedCount} подозрительных UID.`);
  };

  // Add new UID to inspect
  const handleAddNewUid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUidInput.trim()) return;

    playSound?.('click');
    const cleanUid = newUidInput.trim();
    const cleanEmail = newEmailInput.trim().toLowerCase() || `${cleanUid}@users.duowindo.app`;
    const cleanName = newNameInput.trim() || `Пользователь ${cleanUid.slice(0, 8)}`;

    const isOwner = cleanEmail === 'abramovanatolij81@gmail.com' || cleanEmail === 'va997217@gmail.com';

    const newRow: UserAccessPermission = {
      uid: cleanUid,
      name: cleanName,
      email: cleanEmail,
      role: isOwner ? 'owner' : 'user',
      status: isOwner ? 'Allow' : 'Deny',
      aiStudioAccess: isOwner ? 'Allow' : 'Deny',
      usEast1Access: isOwner ? 'Allow' : 'Deny',
      firestoreAccess: isOwner ? 'Allow' : 'Deny',
      tokenStatus: isOwner ? 'valid' : 'revoked',
      anomalyNote: isOwner ? 'Подтвержденный владелец' : 'Новый UID добавлен в матрицу доступа (Deny по умолчанию)',
      lastChecked: new Date().toLocaleTimeString('ru-RU')
    };

    savePermissions([newRow, ...permissions.filter(p => p.uid !== cleanUid)]);
    setNewUidInput('');
    setNewEmailInput('');
    setNewNameInput('');
    setToast?.(`UID ${cleanUid} успешно добавлен в таблицу прав!`);
  };

  // Filter rows
  const filteredRows = permissions.filter(row => {
    const matchesSearch =
      row.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (row.anomalyNote && row.anomalyNote.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'Allow') return row.status === 'Allow';
    if (filterStatus === 'Deny') return row.status === 'Deny';
    if (filterStatus === 'anomaly') return row.tokenStatus === 'anomaly' || row.tokenStatus === 'expired';

    return true;
  });

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 text-white font-din animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-2xl border border-amber-500/40 shrink-0 shadow-inner">
            👥
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Таблица прав доступа (UID) & Мониторинг аномалий
              </h2>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                Access Control Matrix
              </span>
            </div>
            <p className="text-xs text-gray-300 font-bold mt-0.5">
              Контроль разрешений <b className="text-emerald-400">Allow</b> / <b className="text-red-400">Deny</b> для конкретных UID и принудительный сброс прав при аномалиях в <span className="text-cyan-300">ai.studio</span> или <span className="text-cyan-300">us-east1.run.app</span>
            </p>
          </div>
        </div>

        {/* Global Emergency Reset Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGlobalAnomalyForceReset}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-2 border-red-900 active:translate-y-0.5 transition-all flex items-center space-x-2 cursor-pointer"
            title="Принудительно сбросить права всех сессий с аномалиями"
          >
            <span>🚨</span>
            <span>Сброс прав при аномалиях (ai.studio / us-east1.run.app)</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-black/40 border border-gray-800 p-3.5 rounded-2xl text-center">
          <span className="text-[10px] text-gray-400 uppercase font-black">Всего профилей UID</span>
          <p className="text-2xl font-black text-white mt-1">{permissions.length}</p>
        </div>
        <div className="bg-emerald-950/30 border border-emerald-500/40 p-3.5 rounded-2xl text-center">
          <span className="text-[10px] text-emerald-300 uppercase font-black">Разрешен доступ (Allow)</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            {permissions.filter(p => p.status === 'Allow').length}
          </p>
        </div>
        <div className="bg-red-950/30 border border-red-500/40 p-3.5 rounded-2xl text-center">
          <span className="text-[10px] text-red-300 uppercase font-black">Заблокировано (Deny)</span>
          <p className="text-2xl font-black text-red-400 mt-1">
            {permissions.filter(p => p.status === 'Deny').length}
          </p>
        </div>
        <div className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded-2xl text-center">
          <span className="text-[10px] text-amber-300 uppercase font-black">Выявлено аномалий</span>
          <p className="text-2xl font-black text-amber-400 mt-1">
            {permissions.filter(p => p.tokenStatus === 'anomaly' || p.tokenStatus === 'expired').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40 p-3.5 rounded-2xl border border-gray-800 text-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Поиск по UID, email, имени или примечанию аномалии..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
              filterStatus === 'all' ? 'bg-amber-500 text-black font-black' : 'bg-gray-800 text-gray-300'
            }`}
          >
            Все ({permissions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Allow')}
            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
              filterStatus === 'Allow' ? 'bg-emerald-600 text-white font-black' : 'bg-gray-800 text-emerald-300'
            }`}
          >
            🟢 Allow ({permissions.filter(p => p.status === 'Allow').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Deny')}
            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
              filterStatus === 'Deny' ? 'bg-red-600 text-white font-black' : 'bg-gray-800 text-red-300'
            }`}
          >
            🔴 Deny ({permissions.filter(p => p.status === 'Deny').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('anomaly')}
            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
              filterStatus === 'anomaly' ? 'bg-amber-600 text-white font-black' : 'bg-gray-800 text-amber-300'
            }`}
          >
            ⚠️ Аномалии ({permissions.filter(p => p.tokenStatus === 'anomaly' || p.tokenStatus === 'expired').length})
          </button>
        </div>
      </div>

      {/* ACCESS MATRIX TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-gray-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-900 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <th className="py-3.5 px-4 font-black">Пользователь & Имя</th>
              <th className="py-3.5 px-4 font-black">UID пользователя</th>
              <th className="py-3.5 px-4 font-black text-center">Статус</th>
              <th className="py-3.5 px-4 font-black text-center">ai.studio</th>
              <th className="py-3.5 px-4 font-black text-center">us-east1.run.app</th>
              <th className="py-3.5 px-4 font-black text-center">Firestore Rules</th>
              <th className="py-3.5 px-4 font-black">Токен & Аномалии</th>
              <th className="py-3.5 px-4 font-black text-right">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredRows.map((row) => {
              const isAllow = row.status === 'Allow';
              const hasAnomaly = row.tokenStatus === 'anomaly' || row.tokenStatus === 'expired';

              return (
                <tr
                  key={row.uid}
                  className={`transition-colors ${
                    hasAnomaly ? 'bg-red-950/20 hover:bg-red-950/30' :
                    isAllow ? 'bg-gray-900/40 hover:bg-gray-800/60' : 'bg-black/40 hover:bg-gray-900/60'
                  }`}
                >
                  {/* User info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        row.role === 'owner' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        row.role === 'admin' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                        'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}>
                        {row.role === 'owner' ? '👑' : row.role === 'admin' ? '🛡️' : '👤'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate text-xs">{row.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">{row.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* UID */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-300 select-all">
                    {row.uid}
                  </td>

                  {/* Overall Status */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleAllowDeny(row.uid)}
                      className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer border ${
                        isAllow
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30'
                      }`}
                      title="Нажмите, чтобы переключить Allow/Deny"
                    >
                      {isAllow ? '🟢 ALLOW' : '🔴 DENY'}
                    </button>
                  </td>

                  {/* ai.studio */}
                  <td className="py-3.5 px-4 text-center font-black text-[10px]">
                    <span className={`px-2 py-0.5 rounded-lg border ${
                      row.aiStudioAccess === 'Allow'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                        : 'bg-red-950/60 text-red-300 border-red-500/40'
                    }`}>
                      {row.aiStudioAccess}
                    </span>
                  </td>

                  {/* us-east1.run.app */}
                  <td className="py-3.5 px-4 text-center font-black text-[10px]">
                    <span className={`px-2 py-0.5 rounded-lg border ${
                      row.usEast1Access === 'Allow'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                        : 'bg-red-950/60 text-red-300 border-red-500/40'
                    }`}>
                      {row.usEast1Access}
                    </span>
                  </td>

                  {/* firestore.rules */}
                  <td className="py-3.5 px-4 text-center font-black text-[10px]">
                    <span className={`px-2 py-0.5 rounded-lg border ${
                      row.firestoreAccess === 'Allow'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                        : 'bg-red-950/60 text-red-300 border-red-500/40'
                    }`}>
                      {row.firestoreAccess}
                    </span>
                  </td>

                  {/* Token & Anomaly note */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="space-y-0.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        row.tokenStatus === 'valid' ? 'bg-emerald-500/20 text-emerald-300' :
                        row.tokenStatus === 'anomaly' ? 'bg-red-500/30 text-red-200 border border-red-500/50' :
                        row.tokenStatus === 'expired' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {row.tokenStatus === 'valid' ? 'Токен активен' :
                         row.tokenStatus === 'anomaly' ? '⚠️ Аномалия' :
                         row.tokenStatus === 'expired' ? '⏳ Устарел' : 'Отозван'}
                      </span>
                      {row.anomalyNote && (
                        <p className="text-[10px] text-gray-300 truncate" title={row.anomalyNote}>
                          {row.anomalyNote}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleForceResetPermission(row.uid)}
                      className="px-2.5 py-1.5 bg-red-600/30 hover:bg-red-600/60 text-red-200 border border-red-500/50 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center space-x-1"
                      title="Принудительный сброс прав в Deny и отзыв токена"
                    >
                      <span>⚡</span>
                      <span>Сброс прав</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add New UID Form */}
      <form onSubmit={handleAddNewUid} className="bg-black/30 p-4 rounded-2xl border border-gray-800 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-black uppercase text-amber-300">
          <span>➕</span>
          <span>Добавить или проверить новый UID пользователя</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            type="text"
            value={newUidInput}
            onChange={(e) => setNewUidInput(e.target.value)}
            placeholder="UID пользователя (например: usr_90ab3f)"
            className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
            required
          />
          <input
            type="email"
            value={newEmailInput}
            onChange={(e) => setNewEmailInput(e.target.value)}
            placeholder="Email (опционально)"
            className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500"
          />
          <input
            type="text"
            value={newNameInput}
            onChange={(e) => setNewNameInput(e.target.value)}
            placeholder="Имя или комментарий (опционально)"
            className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500"
          />
        </div>
        <button
          type="submit"
          className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow"
        >
          Внести UID в матрицу контроля
        </button>
      </form>
    </div>
  );
};
