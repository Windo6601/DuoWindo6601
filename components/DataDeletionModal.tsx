import React, { useState } from 'react';
import { UserProgress } from '../types';

interface DataDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  firebaseUser: any | null;
  onConfirmWipe: () => void;
  language: string;
  playSound: (name: string) => void;
  setToast: (msg: string | null) => void;
}

export const ADMIN_EMAIL_PROTECTED = 'abramovanatolij81@gmail.com';

export function isUserAdminAccount(user: UserProgress, firebaseUser: any = null): boolean {
  if (!user) return false;
  if (user.isAdmin || user.role === 'admin' || user.role === 'owner') return true;
  if (user.email && (user.email.toLowerCase() === ADMIN_EMAIL_PROTECTED.toLowerCase() || user.email.toLowerCase().includes('abramovanatolij81') || user.email.toLowerCase().includes('abramov'))) return true;
  if (firebaseUser?.email && (firebaseUser.email.toLowerCase() === ADMIN_EMAIL_PROTECTED.toLowerCase() || firebaseUser.email.toLowerCase().includes('abramovanatolij81') || firebaseUser.email.toLowerCase().includes('abramov'))) return true;
  if (user.username && (user.username.toLowerCase() === 'admin' || user.username.toLowerCase().includes('abramov') || user.username.toLowerCase() === 'owner')) return true;
  return false;
}

export const DataDeletionModal: React.FC<DataDeletionModalProps> = ({
  isOpen,
  onClose,
  user,
  firebaseUser,
  onConfirmWipe,
  language,
  playSound,
  setToast,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [acceptedCheckbox, setAcceptedCheckbox] = useState(false);

  if (!isOpen) return null;

  const isRu = language === 'ru';
  const isAdmin = isUserAdminAccount(user, firebaseUser);
  const isProtected = Boolean(user.preventAccountDeletion);

  const targetPhrase = isRu ? 'УДАЛИТЬ' : 'DELETE';
  const phraseMatches = confirmPhrase.trim().toUpperCase() === targetPhrase;

  const handleNextStep = () => {
    playSound('click');
    setStep(2);
  };

  const handleFinalDelete = () => {
    if (isAdmin) {
      playSound('wrong');
      setToast(
        isRu 
          ? '⛔ Запрещено: аккаунт и данные администрации защищены от удаления!' 
          : '⛔ Prohibited: Administration account and data are protected from deletion!'
      );
      return;
    }

    if (isProtected) {
      playSound('wrong');
      setToast(
        isRu 
          ? '🔒 Удаление заблокировано защитой! Отключите защиту в Профиле или Настройках.' 
          : '🔒 Deletion blocked by protection! Disable protection in Profile or Settings.'
      );
      return;
    }

    if (!phraseMatches || !acceptedCheckbox) {
      playSound('wrong');
      return;
    }

    playSound('wrong');
    onConfirmWipe();
  };

  return (
    <div className="fixed inset-0 z-[290] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="fixed inset-0" onClick={() => { playSound('click'); onClose(); }} />

      <div className="relative z-10 bg-gray-950 border-2 border-red-600/80 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-[0_0_50px_rgba(239,68,68,0.35)] text-white space-y-4 text-left">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border-2 border-red-500/60 flex items-center justify-center text-2xl shadow-lg shrink-0">
              ⚠️
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>{isRu ? 'Безвозвратное удаление данных' : 'Permanent Data Deletion'}</span>
              </h3>
              <p className="text-xs text-red-400 font-bold">
                {isRu ? 'Очистка всех локальных данных приложения' : 'Purge all local application data'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { playSound('click'); onClose(); }}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ADMIN SECURITY LOCK NOTICE */}
        {isAdmin && (
          <div className="p-4 bg-red-950/80 border-2 border-red-500 rounded-2xl space-y-2 text-left shadow-lg">
            <div className="flex items-center space-x-2 text-red-300 font-black uppercase text-xs tracking-wider">
              <span className="text-lg">⛔</span>
              <span>{isRu ? 'АККАУНТ АДМИНИСТРАЦИИ ЗАЩИЩЁН' : 'ADMIN ACCOUNT PROTECTED'}</span>
            </div>
            <p className="text-xs text-red-200 font-bold leading-relaxed">
              {isRu
                ? 'Запретить удаление аккаунта администрации и запретить удалять все данные администрации о локальном приложении. По правилам безопасности DuoWindo6601 учетная запись и локальные данные администратора неприкасаемы.'
                : 'Deletion of the administration account and all administration local application data is strictly prohibited by DuoWindo6601 security policies.'}
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-red-300 bg-black/40 px-2.5 py-1 rounded-lg border border-red-500/30">
              <span>👑 UID / Email:</span>
              <span className="font-bold truncate">{user.email || user.username || ADMIN_EMAIL_PROTECTED}</span>
            </div>
          </div>
        )}

        {/* REGULAR USER DELETION PROTECTION LOCK NOTICE */}
        {!isAdmin && isProtected && (
          <div className="p-4 bg-amber-950/60 border-2 border-amber-500 rounded-2xl space-y-2 text-left">
            <div className="flex items-center space-x-2 text-amber-300 font-black uppercase text-xs tracking-wider">
              <span className="text-lg">🔒</span>
              <span>{isRu ? 'ЗАЩИТА ОТ УДАЛЕНИЯ ВКЛЮЧЕНА' : 'DELETION PROTECTION ENABLED'}</span>
            </div>
            <p className="text-xs text-amber-200 font-bold leading-relaxed">
              {isRu
                ? 'В настройках или профиле активирован запрет на удаление аккаунта и локальных данных приложения. Удаление заблокировано.'
                : 'Account and local application data deletion protection is enabled in Settings or Profile. Deletion is currently locked.'}
            </p>
            <p className="text-[11px] text-gray-300">
              {isRu
                ? 'Чтобы разблокировать удаление, сначала отключите тумблер «Запретить удаление аккаунта и данных» в Настройках.'
                : 'To unlock deletion, first disable the "Prevent Account & Data Deletion" toggle in Settings.'}
            </p>
          </div>
        )}

        {/* STEP 1: WARNING AND SUMMARY */}
        {!isAdmin && !isProtected && step === 1 && (
          <div className="space-y-4 text-left">
            <div className="p-3.5 bg-red-950/40 border border-red-500/40 rounded-2xl text-xs space-y-2">
              <div className="flex items-center space-x-2 text-red-300 font-black uppercase text-[11px]">
                <span>🚨</span>
                <span>{isRu ? 'Подтверждение Шаг 1 из 2' : 'Double Confirmation: Step 1 of 2'}</span>
              </div>
              <p className="text-gray-200 font-bold leading-relaxed">
                {isRu
                  ? 'Вы собираетесь безвозвратно стереть все локальные данные приложения DuoWindo6601 на этом устройстве. Это действие нельзя отменить.'
                  : 'You are about to permanently wipe all local DuoWindo6601 application data on this device. This action cannot be undone.'}
              </p>
            </div>

            {/* WHAT WILL BE DELETED LIST */}
            <div className="bg-black/50 border border-gray-800 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="font-black text-gray-300 uppercase text-[11px] tracking-wider">
                {isRu ? 'Будет полностью стёрто:' : 'The following will be purged:'}
              </div>
              <ul className="space-y-1.5 text-gray-300">
                <li className="flex items-center space-x-2">
                  <span className="text-red-400">✗</span>
                  <span>{isRu ? `Весь опыт XP (${user.xp || 0} XP) и алмазы (${user.gems || 0})` : `All XP (${user.xp || 0}) and gems (${user.gems || 0})`}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-red-400">✗</span>
                  <span>{isRu ? `Ударный режим стрика (${user.streak || 0} дн.)` : `Current streak (${user.streak || 0} days)`}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-red-400">✗</span>
                  <span>{isRu ? `Пройденные уроки (${user.completedLessons?.length || 0}) и выученные слова (${user.learnedWords?.length || 0})` : `Completed lessons (${user.completedLessons?.length || 0}) and words (${user.learnedWords?.length || 0})`}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-red-400">✗</span>
                  <span>{isRu ? 'Локальные настройки, кэш голосов и статистика шахмат' : 'Local preferences, voice cache and chess statistics'}</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => { playSound('click'); onClose(); }}
                className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase cursor-pointer"
              >
                {isRu ? 'Отмена' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider border-b-2 border-red-800 active:translate-y-0.5 transition-all shadow-md cursor-pointer"
              >
                {isRu ? 'Я понимаю, Шаг 2 →' : 'I Understand, Step 2 →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TYPED PHRASE & CHECKBOX CONFIRMATION */}
        {!isAdmin && !isProtected && step === 2 && (
          <div className="space-y-4 text-left">
            <div className="p-3 bg-red-950/60 border border-red-600 rounded-2xl text-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-red-300 font-black uppercase text-[11px]">
                <span>🔥</span>
                <span>{isRu ? 'Финальное подтверждение Шаг 2 из 2' : 'Final Step 2 of 2'}</span>
              </div>
              <p className="text-gray-200 font-medium">
                {isRu
                  ? `Для подтверждения введите слово «${targetPhrase}» заглавными буквами:`
                  : `To confirm, please type the word "${targetPhrase}" in all caps:`}
              </p>
            </div>

            <div>
              <input
                type="text"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder={targetPhrase}
                className="w-full bg-black/60 border-2 border-red-500/60 focus:border-red-400 rounded-xl py-3 px-4 text-center font-mono font-black text-lg tracking-widest text-white uppercase placeholder-gray-600 outline-none transition-all"
              />
            </div>

            <label className="flex items-start space-x-3 p-3 bg-black/40 border border-gray-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedCheckbox}
                onChange={(e) => setAcceptedCheckbox(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <span className="text-xs text-gray-300 font-bold leading-snug">
                {isRu
                  ? 'Я подтверждаю, что хочу навсегда удалить весь локальный прогресс, уроки и настройки без возможности восстановления.'
                  : 'I confirm that I want to permanently delete all local progress, lessons, and settings with no restore option.'}
              </span>
            </label>

            <div className="pt-2 flex items-center justify-between space-x-2">
              <button
                type="button"
                onClick={() => { playSound('click'); setStep(1); }}
                className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase cursor-pointer"
              >
                ← {isRu ? 'Назад' : 'Back'}
              </button>
              <button
                type="button"
                disabled={!phraseMatches || !acceptedCheckbox}
                onClick={handleFinalDelete}
                className={`py-3 px-6 rounded-xl font-black text-xs uppercase tracking-wider border-b-4 active:border-b-0 active:translate-y-1 transition-all shadow-lg ${
                  phraseMatches && acceptedCheckbox
                    ? 'bg-red-600 hover:bg-red-500 text-white border-red-900 cursor-pointer'
                    : 'bg-gray-800 text-gray-500 border-gray-900 cursor-not-allowed opacity-60'
                }`}
              >
                💣 {isRu ? 'Безвозвратно стереть всё' : 'Permanently Wipe Everything'}
              </button>
            </div>
          </div>
        )}

        {/* FOOTER CLOSE FOR ADMIN / PROTECTED */}
        {(isAdmin || isProtected) && (
          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={() => { playSound('click'); onClose(); }}
              className="py-2.5 px-6 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs uppercase cursor-pointer"
            >
              {isRu ? 'Закрыть' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
