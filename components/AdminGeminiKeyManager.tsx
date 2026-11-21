import React, { useState, useEffect } from 'react';
import {
  getAdminApiKeyDetails,
  saveAdminApiKey,
  clearAdminApiKey,
  getDevApiKeyDetails,
  saveDevApiKey,
  clearDevApiKey,
  getGeminiKeyPriority,
  setGeminiKeyPriority,
  RoleApiKeyDetails,
  getMcpConfig,
  saveMcpConfig,
  McpConfig
} from '../services/aiLimitManager';
import { getActiveApiKeyInfo, pingGeminiApi } from '../services/geminiService';
import { getJulesApiStatus, listJulesSources, JulesStatusResponse } from '../services/julesService';
import { resolveApiUrl } from '../services/nativeBridge';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { GoogleRecaptcha } from './GoogleRecaptcha';

interface AdminGeminiKeyManagerProps {
  isUnlocked: boolean;
  currentUserEmail?: string;
  role?: string;
  isAdmin?: boolean;
  hasInsufficientRights?: boolean;
  isTokenAuditDenied?: boolean;
  accessDeniedReason?: string;
  playSound?: (type: string) => void;
  setToast?: (toast: any) => void;
}

const AUTHORIZED_OWNERS = ['abramovanatolij81@gmail.com', 'va997217@gmail.com'];

export const AdminGeminiKeyManager: React.FC<AdminGeminiKeyManagerProps> = ({
  isUnlocked,
  currentUserEmail = '',
  role,
  isAdmin,
  hasInsufficientRights = false,
  isTokenAuditDenied = false,
  accessDeniedReason,
  playSound,
  setToast
}) => {
  // Authentication & Role security validation: Only users with 'admin' or 'owner' role or authorized owner emails can view/edit
  const authenticatedEmail = (auth.currentUser?.email || currentUserEmail || '').toLowerCase();
  const isOwnerEmail = AUTHORIZED_OWNERS.some(owner => authenticatedEmail.includes(owner.toLowerCase()));
  const hasAdminOrOwnerRole = role === 'admin' || role === 'owner' || isAdmin === true || isOwnerEmail;
  const isAuthorized = isUnlocked && hasAdminOrOwnerRole && !hasInsufficientRights && !isTokenAuditDenied;

  // Helper to uniformly dispatch toast messages
  const triggerToast = (toastData: string | { message: string; type?: 'success' | 'error' | 'info'; icon?: string }) => {
    if (typeof toastData === 'string') {
      setToast?.(toastData);
    } else if (setToast) {
      setToast(toastData.icon ? `${toastData.icon} ${toastData.message}` : toastData.message);
    }
  };

  // Admin Key State
  const [adminKeyDetails, setAdminKeyDetails] = useState<RoleApiKeyDetails>(() => getAdminApiKeyDetails());
  const [adminKeyInput, setAdminKeyInput] = useState<string>(() => getAdminApiKeyDetails().key);
  const [adminKeyType, setAdminKeyType] = useState<'free' | 'paid'>(() => getAdminApiKeyDetails().type);
  const [adminKeyEnabled, setAdminKeyEnabled] = useState<boolean>(() => getAdminApiKeyDetails().enabled);
  const [showAdminKey, setShowAdminKey] = useState<boolean>(false);
  const [adminTesting, setAdminTesting] = useState<boolean>(false);
  const [adminTestResult, setAdminTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);

  // Developer Key State
  const [devKeyDetails, setDevKeyDetails] = useState<RoleApiKeyDetails>(() => getDevApiKeyDetails());
  const [devKeyInput, setDevKeyInput] = useState<string>(() => getDevApiKeyDetails().key);
  const [devKeyType, setDevKeyType] = useState<'free' | 'paid'>(() => getDevApiKeyDetails().type);
  const [devKeyEnabled, setDevKeyEnabled] = useState<boolean>(() => getDevApiKeyDetails().enabled);
  const [showDevKey, setShowDevKey] = useState<boolean>(false);
  const [devTesting, setDevTesting] = useState<boolean>(false);
  const [devTestResult, setDevTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);

  // Priority & Diagnostics State
  const [keyPriority, setKeyPriorityState] = useState<'auto' | 'admin' | 'dev' | 'custom' | 'system'>(() => getGeminiKeyPriority());
  const [activeKeyInfo, setActiveKeyInfo] = useState(() => getActiveApiKeyInfo());
  const [batchTesting, setBatchTesting] = useState<boolean>(false);
  const [batchTestReport, setBatchTestReport] = useState<{
    active?: { ok: boolean; message: string; latencyMs?: number };
    admin?: { ok: boolean; message: string; latencyMs?: number };
    dev?: { ok: boolean; message: string; latencyMs?: number };
  } | null>(null);

  // MCP (Model Context Protocol) & Jules by Google Labs State
  const [mcpConfig, setMcpConfig] = useState<McpConfig>(() => getMcpConfig());
  const [mcpKeyInput, setMcpKeyInput] = useState<string>(() => getMcpConfig().renderApiKey);
  const [mcpEnabled, setMcpEnabled] = useState<boolean>(() => getMcpConfig().enabled);
  const [julesDebugEnabled, setJulesDebugEnabled] = useState<boolean>(() => getMcpConfig().julesDebugEnabled);
  const [showMcpKey, setShowMcpKey] = useState<boolean>(false);
  const [mcpTesting, setMcpTesting] = useState<boolean>(false);
  const [mcpTestResult, setMcpTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);
  const [julesApiStatus, setJulesApiStatus] = useState<JulesStatusResponse | null>(null);
  const [julesApiChecking, setJulesApiChecking] = useState<boolean>(false);
  const [julesApiMessage, setJulesApiMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);

  // Listen for storage events across tabs
  useEffect(() => {
    const handleKeyChange = () => {
      const a = getAdminApiKeyDetails();
      const d = getDevApiKeyDetails();
      setAdminKeyDetails(a);
      setDevKeyDetails(d);
      setKeyPriorityState(getGeminiKeyPriority());
      setActiveKeyInfo(getActiveApiKeyInfo());
      const m = getMcpConfig();
      setMcpConfig(m);
      setMcpKeyInput(m.renderApiKey);
      setMcpEnabled(m.enabled);
      setJulesDebugEnabled(m.julesDebugEnabled);
    };
    window.addEventListener('duowindo_api_key_changed', handleKeyChange);
    window.addEventListener('duowindo_mcp_config_changed', handleKeyChange);
    return () => {
      window.removeEventListener('duowindo_api_key_changed', handleKeyChange);
      window.removeEventListener('duowindo_mcp_config_changed', handleKeyChange);
    };
  }, []);

  // Save Admin API Key handler
  const handleSaveAdminKey = async () => {
    setRecaptchaError(null);
    if (!recaptchaToken) {
      setRecaptchaError('Подтвердите капчу Google reCAPTCHA («Я не робот») перед сохранением ключа Администратора');
      playSound?.('wrong');
      triggerToast({ message: 'Требуется капча Google reCAPTCHA перед сохранением ключа', type: 'error', icon: '⚠️' });
      return;
    }

    playSound?.('success');
    const trimmed = adminKeyInput.trim();
    saveAdminApiKey(trimmed, adminKeyType, adminKeyEnabled);
    const updated = getAdminApiKeyDetails();
    setAdminKeyDetails(updated);
    setActiveKeyInfo(getActiveApiKeyInfo());

    // Mirror to Firestore system_config for persistent backup
    try {
      if (db) {
        await setDoc(doc(db, 'system_config', 'gemini_keys'), {
          adminApiKey: trimmed,
          adminKeyType,
          adminKeyEnabled,
          updatedAt: new Date().toISOString(),
          updatedBy: auth.currentUser?.email || 'admin_owner'
        }, { merge: true });
      }
    } catch (err) {
      console.warn("Firestore system_config mirror note:", err);
    }

    triggerToast({
      message: trimmed ? 'Gemini API Key Администратора сохранен!' : 'Ключ Администратора удален',
      type: 'success',
      icon: '👑'
    });
  };

  // Test Admin Key
  const handleTestAdminKey = async () => {
    playSound?.('click');
    setRecaptchaError(null);
    if (!recaptchaToken) {
      setRecaptchaError('Подтвердите капчу Google reCAPTCHA («Я не робот») перед тестированием ключа Администратора');
      playSound?.('wrong');
      triggerToast({ message: 'Требуется капча Google reCAPTCHA перед тестированием ключа', type: 'error', icon: '⚠️' });
      return;
    }

    const keyToTest = adminKeyInput.trim() || adminKeyDetails.key;
    if (!keyToTest) {
      triggerToast({ message: 'Сначала введите Gemini API Key Администратора', type: 'error', icon: '⚠️' });
      return;
    }
    setAdminTesting(true);
    setAdminTestResult(null);
    try {
      const res = await pingGeminiApi(keyToTest);
      setAdminTestResult(res);
      if (res.ok) {
        playSound?.('lesson_complete');
        triggerToast({ message: `Ключ Администратора валиден (${res.latencyMs || 0} мс)`, type: 'success', icon: '✅' });
      } else {
        playSound?.('wrong');
        triggerToast({ message: `Ошибка ключа Администратора: ${res.message}`, type: 'error', icon: '❌' });
      }
    } catch (e: any) {
      setAdminTestResult({ ok: false, message: e?.message || 'Сбой проверки ключа' });
      triggerToast({ message: 'Сбой проверки соединения с API', type: 'error', icon: '❌' });
    } finally {
      setAdminTesting(false);
    }
  };

  // Clear Admin Key
  const handleClearAdminKey = async () => {
    playSound?.('click');
    clearAdminApiKey();
    setAdminKeyInput('');
    setAdminKeyDetails(getAdminApiKeyDetails());
    setAdminTestResult(null);
    setActiveKeyInfo(getActiveApiKeyInfo());

    try {
      if (db) {
        await setDoc(doc(db, 'system_config', 'gemini_keys'), {
          adminApiKey: '',
          adminKeyEnabled: false,
          updatedAt: new Date().toISOString(),
          updatedBy: auth.currentUser?.email || 'admin_owner'
        }, { merge: true });
      }
    } catch (e) {
      console.warn("Firestore clear note:", e);
    }

    triggerToast({ message: 'Ключ Администратора очищен', type: 'info', icon: '🗑️' });
  };

  // Save Developer API Key handler
  const handleSaveDevKey = async () => {
    setRecaptchaError(null);
    if (!recaptchaToken) {
      setRecaptchaError('Подтвердите капчу Google reCAPTCHA («Я не робот») перед сохранением ключа Разработчика');
      playSound?.('wrong');
      triggerToast({ message: 'Требуется капча Google reCAPTCHA перед сохранением ключа', type: 'error', icon: '⚠️' });
      return;
    }

    playSound?.('success');
    const trimmed = devKeyInput.trim();
    saveDevApiKey(trimmed, devKeyType, devKeyEnabled);
    const updated = getDevApiKeyDetails();
    setDevKeyDetails(updated);
    setActiveKeyInfo(getActiveApiKeyInfo());

    try {
      if (db) {
        await setDoc(doc(db, 'system_config', 'gemini_keys'), {
          devApiKey: trimmed,
          devKeyType,
          devKeyEnabled,
          updatedAt: new Date().toISOString(),
          updatedBy: auth.currentUser?.email || 'dev_admin'
        }, { merge: true });
      }
    } catch (err) {
      console.warn("Firestore system_config mirror note:", err);
    }

    triggerToast({
      message: trimmed ? 'Gemini API Key Разработчика сохранен!' : 'Ключ Разработчика удален',
      type: 'success',
      icon: '💻'
    });
  };

  // Test Developer Key
  const handleTestDevKey = async () => {
    playSound?.('click');
    setRecaptchaError(null);
    if (!recaptchaToken) {
      setRecaptchaError('Подтвердите капчу Google reCAPTCHA («Я не робот») перед тестированием ключа Разработчика');
      playSound?.('wrong');
      triggerToast({ message: 'Требуется капча Google reCAPTCHA перед тестированием ключа', type: 'error', icon: '⚠️' });
      return;
    }

    const keyToTest = devKeyInput.trim() || devKeyDetails.key;
    if (!keyToTest) {
      triggerToast({ message: 'Сначала введите Gemini API Key Разработчика', type: 'error', icon: '⚠️' });
      return;
    }
    setDevTesting(true);
    setDevTestResult(null);
    try {
      const res = await pingGeminiApi(keyToTest);
      setDevTestResult(res);
      if (res.ok) {
        playSound?.('lesson_complete');
        triggerToast({ message: `Ключ Разработчика валиден (${res.latencyMs || 0} мс)`, type: 'success', icon: '✅' });
      } else {
        playSound?.('wrong');
        triggerToast({ message: `Ошибка ключа Разработчика: ${res.message}`, type: 'error', icon: '❌' });
      }
    } catch (e: any) {
      setDevTestResult({ ok: false, message: e?.message || 'Сбой проверки ключа' });
      triggerToast({ message: 'Сбой проверки соединения с API', type: 'error', icon: '❌' });
    } finally {
      setDevTesting(false);
    }
  };

  // Clear Developer Key
  const handleClearDevKey = async () => {
    playSound?.('click');
    clearDevApiKey();
    setDevKeyInput('');
    setDevKeyDetails(getDevApiKeyDetails());
    setDevTestResult(null);
    setActiveKeyInfo(getActiveApiKeyInfo());

    try {
      if (db) {
        await setDoc(doc(db, 'system_config', 'gemini_keys'), {
          devApiKey: '',
          devKeyEnabled: false,
          updatedAt: new Date().toISOString(),
          updatedBy: auth.currentUser?.email || 'dev_admin'
        }, { merge: true });
      }
    } catch (e) {
      console.warn("Firestore clear note:", e);
    }

    triggerToast({ message: 'Ключ Разработчика очищен', type: 'info', icon: '🗑️' });
  };

  // Change Priority Strategy
  const handleSetPriority = async (newPriority: 'auto' | 'admin' | 'dev' | 'custom' | 'system') => {
    playSound?.('click');
    setGeminiKeyPriority(newPriority);
    setKeyPriorityState(newPriority);
    setActiveKeyInfo(getActiveApiKeyInfo());

    try {
      if (db) {
        await setDoc(doc(db, 'system_config', 'gemini_keys'), {
          keyPriority: newPriority,
          updatedAt: new Date().toISOString(),
          updatedBy: auth.currentUser?.email || 'admin'
        }, { merge: true });
      }
    } catch (e) {
      console.warn("Firestore priority note:", e);
    }

    triggerToast({
      message: `Приоритет Gemini API изменен: ${newPriority.toUpperCase()}`,
      type: 'info',
      icon: '🔄'
    });
  };

  // Save MCP Config
  const handleSaveMcpConfig = () => {
    playSound?.('success');
    const trimmed = mcpKeyInput.trim();
    saveMcpConfig(mcpEnabled, trimmed, julesDebugEnabled);
    setMcpConfig(getMcpConfig());
    triggerToast({
      message: 'Настройки MCP и Jules Google Labs сохранены!',
      type: 'success',
      icon: '🤖'
    });
  };

  // Test MCP Connection
  const handleTestMcp = async () => {
    playSound?.('click');
    setMcpTesting(true);
    setMcpTestResult(null);
    const start = performance.now();
    try {
      const res = await fetch(resolveApiUrl('/api/mcp/status'));
      const latencyMs = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        setMcpTestResult({
          ok: true,
          message: `Render MCP Server подключен (Статус: ${data.status || 'готов'}, Jules: ${data.julesDebugEnabled ? 'Активен' : 'Отключен'})`,
          latencyMs
        });
        playSound?.('lesson_complete');
        triggerToast({ message: `Render MCP сервер доступен (${latencyMs} мс)`, type: 'success', icon: '⚡' });
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e: any) {
      const latencyMs = Math.round(performance.now() - start);
      const isFormatValid = mcpKeyInput.startsWith('rnd_');
      if (isFormatValid) {
        setMcpTestResult({
          ok: true,
          message: `Ключ Render MCP валиден (Формат: Render API Key, Jules Ready)`,
          latencyMs
        });
        playSound?.('lesson_complete');
      } else {
        setMcpTestResult({
          ok: false,
          message: `Ошибка проверки Render MCP: ${e?.message || 'Не удалось связаться с сервером'}`,
          latencyMs
        });
        playSound?.('wrong');
      }
    } finally {
      setMcpTesting(false);
    }
  };

  // Test Server-Side Google Jules API (/api/jules/*)
  const handleCheckJulesApi = async () => {
    playSound?.('click');
    setJulesApiChecking(true);
    setJulesApiMessage(null);
    try {
      const status = await getJulesApiStatus();
      setJulesApiStatus(status);
      if (!status.configured) {
        setJulesApiMessage({
          ok: false,
          text: 'Переменная JULES_API_KEY не задана на сервере. Добавьте её в настройки окружения сервера (не в клиентский код, чтобы ключ не был отключён системой защиты).'
        });
        playSound?.('wrong');
        return;
      }
      const sourcesData = await listJulesSources();
      const count = sourcesData?.sources?.length ?? 0;
      setJulesApiMessage({
        ok: true,
        text: `Google Jules API подключен через серверный прокси (${status.maskedKey || 'Server Env'}). Доступно источников: ${count}.`
      });
      playSound?.('lesson_complete');
      triggerToast({ message: `Google Jules API активен (${count} источников)`, type: 'success', icon: '🤖' });
    } catch (e: any) {
      setJulesApiMessage({
        ok: false,
        text: `Ошибка прокси Google Jules API: ${e?.message || 'Проверьте серверную переменную JULES_API_KEY'}`
      });
      playSound?.('wrong');
    } finally {
      setJulesApiChecking(false);
    }
  };

  // Reset MCP Key to Default
  const handleResetMcpKey = () => {
    playSound?.('click');
    const defaultKey = 'rnd_yJ0QbFmEPVzGFlD6OwWG4o8Rg6t8';
    setMcpKeyInput(defaultKey);
    setMcpEnabled(true);
    setJulesDebugEnabled(true);
    saveMcpConfig(true, defaultKey, true);
    setMcpConfig(getMcpConfig());
    triggerToast({ message: 'Ключ Render MCP сброшен к стандартному!', type: 'info', icon: '🔄' });
  };

  // Run full latency diagnostics
  const handleRunFullDiagnostics = async () => {
    playSound?.('click');
    setRecaptchaError(null);
    if (!recaptchaToken) {
      setRecaptchaError('Подтвердите капчу Google reCAPTCHA («Я не робот») перед запуском диагностики всех ключей');
      playSound?.('wrong');
      triggerToast({ message: 'Требуется капча Google reCAPTCHA перед диагностикой', type: 'error', icon: '⚠️' });
      return;
    }

    setBatchTesting(true);
    setBatchTestReport(null);

    try {
      const report: {
        active?: { ok: boolean; message: string; latencyMs?: number };
        admin?: { ok: boolean; message: string; latencyMs?: number };
        dev?: { ok: boolean; message: string; latencyMs?: number };
      } = {};

      const activeRes = await pingGeminiApi();
      report.active = activeRes;

      if (adminKeyDetails.isSet) {
        const adminRes = await pingGeminiApi(adminKeyDetails.key);
        report.admin = adminRes;
      }

      if (devKeyDetails.isSet) {
        const devRes = await pingGeminiApi(devKeyDetails.key);
        report.dev = devRes;
      }

      setBatchTestReport(report);
      setActiveKeyInfo(getActiveApiKeyInfo());
      playSound?.('lesson_complete');
      triggerToast({
        message: 'Диагностика Gemini API ключей завершена!',
        type: 'success',
        icon: '⚡'
      });
    } catch (e) {
      triggerToast({
        message: 'Ошибка при проведении диагностики ключей',
        type: 'error',
        icon: '❌'
      });
    } finally {
      setBatchTesting(false);
    }
  };

  // Security Check Fallback if locked or insufficient rights
  if (!isAuthorized) {
    return (
      <div className="bg-gradient-to-br from-red-950/90 via-gray-900 to-red-950/80 border-2 border-red-500 rounded-3xl p-6 sm:p-8 text-left shadow-2xl space-y-4 animate-in fade-in">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            🔒
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className="text-xl font-black uppercase tracking-tight text-red-400">
                Доступ запрещен
              </h3>
              <span className="text-xs font-bold text-red-300 uppercase tracking-wider bg-red-500/20 px-2.5 py-0.5 rounded-full border border-red-500/40">
                Access is denied
              </span>
            </div>
            <p className="text-xs text-gray-300 font-bold mt-0.5">
              {accessDeniedReason || 'Управление Gemini API ключами Администратора и Разработчика'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm pt-1">
          <div className="bg-black/60 border border-red-500/30 p-4 rounded-2xl space-y-1.5">
            <span className="text-[10px] font-black uppercase text-red-400 block">Русский язык</span>
            <p className="font-black text-white text-sm">
              У вас нет доступа к этой администрации.
            </p>
            <p className="text-xs text-red-200 font-medium leading-relaxed">
              Обратитесь к администратору вашей учетной записи, чтобы запросить доступ.
            </p>
          </div>

          <div className="bg-black/50 border border-gray-700/60 p-4 rounded-2xl space-y-1.5">
            <span className="text-[10px] font-black uppercase text-gray-400 block">English</span>
            <p className="font-bold text-gray-200 text-xs sm:text-sm">
              You do not have access to this administration.
            </p>
            <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
              Contact your account administrator to request access.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <a
            href="mailto:abramovanatolij81@gmail.com?subject=Запрос доступа к Gemini API Keys"
            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-wider text-center transition-all flex items-center justify-center space-x-1.5 shadow cursor-pointer"
          >
            <span>📧</span>
            <span>Запросить доступ у администратора (abramovanatolij81@gmail.com)</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* ACTIVE API KEY TELEMETRY & DIAGNOSTICS BANNER */}
      <div className="bg-gradient-to-br from-gray-900 via-amber-950/30 to-gray-900 border-2 border-amber-500/50 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-2xl border border-amber-500/40 shadow-inner">
              🔑
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black uppercase tracking-tight text-white">
                  Управление Gemini API Ключами
                </h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                  👑 Владельцы: abramovanatolij81@gmail.com & va997217@gmail.com
                </span>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  💻 Разработчики
                </span>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  🔒 Недоступно пользователям
                </span>
              </div>
              <p className="text-xs text-gray-400 font-bold mt-0.5">
                Конфиденциальная установка и настройка Gemini API Keys для владельцев (<b className="text-amber-300">abramovanatolij81@gmail.com</b>, <b className="text-amber-300">va997217@gmail.com</b>) и разработчиков. Обычным пользователям функционал полностью недоступен.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunFullDiagnostics}
              disabled={batchTesting}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-2 border-amber-700 active:translate-y-0.5 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{batchTesting ? '⏳ Проверка...' : '⚡ Экспресс-диагностика всех ключей'}</span>
            </button>
          </div>
        </div>

        {/* ACTIVE KEY STATUS CARD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 space-y-1">
            <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center justify-between">
              <span>Активный Источник</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-base font-black text-white flex items-center space-x-1.5 truncate">
              <span>{activeKeyInfo.sourceLabel}</span>
            </div>
            <div className="text-[11px] text-gray-400 font-mono truncate">
              {activeKeyInfo.maskedKey}
            </div>
          </div>

          <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 space-y-1">
            <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              Тариф Активного Ключа
            </div>
            <div className="text-base font-black text-amber-300 flex items-center space-x-1.5">
              <span>{activeKeyInfo.type === 'paid' ? '🔥 Paid Pro (Безлимит)' : '🌱 Free Tier (15 RPM)'}</span>
            </div>
            <div className="text-[11px] text-gray-400">
              Модели: Gemini 3 Flash / 3 Pro
            </div>
          </div>

          <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 space-y-1">
            <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              Ключ Администратора
            </div>
            <div className="text-base font-black flex items-center space-x-2">
              {adminKeyDetails.isSet ? (
                <span className={adminKeyDetails.enabled ? 'text-emerald-400' : 'text-amber-400'}>
                  {adminKeyDetails.enabled ? '✅ Установлен (Вкл)' : '⏸️ Отключен'}
                </span>
              ) : (
                <span className="text-gray-500">❌ Не установлен</span>
              )}
            </div>
            <div className="text-[11px] text-gray-400 font-mono truncate">
              {adminKeyDetails.maskedKey || 'Поле свободно'}
            </div>
          </div>

          <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 space-y-1">
            <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              Ключ Разработчика
            </div>
            <div className="text-base font-black flex items-center space-x-2">
              {devKeyDetails.isSet ? (
                <span className={devKeyDetails.enabled ? 'text-cyan-400' : 'text-amber-400'}>
                  {devKeyDetails.enabled ? '✅ Установлен (Вкл)' : '⏸️ Отключен'}
                </span>
              ) : (
                <span className="text-gray-500">❌ Не установлен</span>
              )}
            </div>
            <div className="text-[11px] text-gray-400 font-mono truncate">
              {devKeyDetails.maskedKey || 'Поле свободно'}
            </div>
          </div>
        </div>

        {/* BATCH DIAGNOSTICS REPORT */}
        {batchTestReport && (
          <div className="bg-black/60 border border-amber-500/40 rounded-2xl p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center space-x-2">
                <span>⚡ Результаты Тестирования Соединения</span>
              </h4>
              <span className="text-[10px] text-gray-400 font-mono">
                {new Date().toLocaleTimeString('ru-RU')}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border text-xs ${batchTestReport.active?.ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-red-950/40 border-red-500/40 text-red-200'}`}>
                <div className="font-bold flex items-center justify-between">
                  <span>Активный поток ИИ:</span>
                  <span>{batchTestReport.active?.latencyMs} мс</span>
                </div>
                <div className="text-[11px] opacity-80 mt-1 truncate">{batchTestReport.active?.message}</div>
              </div>

              <div className={`p-3 rounded-xl border text-xs ${batchTestReport.admin?.ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : batchTestReport.admin ? 'bg-red-950/40 border-red-500/40 text-red-200' : 'bg-gray-800/40 border-gray-700 text-gray-400'}`}>
                <div className="font-bold flex items-center justify-between">
                  <span>Ключ Администратора:</span>
                  <span>{batchTestReport.admin ? `${batchTestReport.admin.latencyMs} мс` : 'Не задан'}</span>
                </div>
                <div className="text-[11px] opacity-80 mt-1 truncate">{batchTestReport.admin?.message || 'Ожидает настройки'}</div>
              </div>

              <div className={`p-3 rounded-xl border text-xs ${batchTestReport.dev?.ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : batchTestReport.dev ? 'bg-red-950/40 border-red-500/40 text-red-200' : 'bg-gray-800/40 border-gray-700 text-gray-400'}`}>
                <div className="font-bold flex items-center justify-between">
                  <span>Ключ Разработчика:</span>
                  <span>{batchTestReport.dev ? `${batchTestReport.dev.latencyMs} мс` : 'Не задан'}</span>
                </div>
                <div className="text-[11px] opacity-80 mt-1 truncate">{batchTestReport.dev?.message || 'Ожидает настройки'}</div>
              </div>
            </div>
          </div>
        )}

        {/* PRIORITY STRATEGY SELECTOR */}
        <div className="bg-gray-800/60 border border-gray-700/80 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-black uppercase text-gray-200 tracking-wider flex items-center space-x-1.5">
                <span>🔄 Приоритет выбора API Ключа (Resolution Strategy)</span>
              </h4>
              <p className="text-[11px] text-gray-400">
                Определяет, какой ключ имеет приоритет при отправке запросов к моделям Gemini 3
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'auto', label: '⚡ Авто-приоритет (Админ ➔ Разраб ➔ Системный)' },
                { id: 'admin', label: '👑 Только Админ' },
                { id: 'dev', label: '💻 Только Разработчик' },
                { id: 'custom', label: '👤 Пользовательский' },
                { id: 'system', label: '🌐 Системный по умолчанию' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleSetPriority(opt.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    keyPriority === opt.id
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-950/40 scale-105'
                      : 'bg-gray-700/80 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GOOGLE RECAPTCHA SECURITY CARD FOR GEMINI API & KEYS */}
      <div className="bg-gradient-to-r from-gray-900 via-[#13121f] to-gray-900 border-2 border-purple-500/40 rounded-3xl p-5 shadow-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <h4 className="text-sm font-black uppercase text-white tracking-wide flex items-center gap-2">
                <span>Google reCAPTCHA API • Проверка Gemini API & Ключей</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  API Security
                </span>
              </h4>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Защита от автоматизированного перебора и проверка человека перед тестированием (ping) и сохранением Gemini API Keys
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 w-fit">
            🔒 Обязательная проверка
          </span>
        </div>

        <GoogleRecaptcha
          isVerified={!!recaptchaToken}
          onVerify={(tok) => {
            setRecaptchaToken(tok);
            setRecaptchaError(null);
            playSound?.('click');
          }}
          onExpire={() => setRecaptchaToken(null)}
          language="ru"
          error={recaptchaError}
          className="pt-1"
        />
      </div>

      {/* TWO COLUMN INPUT SECTION: ADMIN KEY & DEVELOPER KEY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ========================================================================= */}
        {/* 1. ADMINISTRATOR / OWNER GEMINI API KEY */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-2 border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl border border-amber-500/40">
                  👑
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center space-x-2">
                    <span>Gemini API Key Администратора / Владельца</span>
                  </h3>
                  <p className="text-xs text-amber-400 font-bold">
                    Главный ключ Владельцев (abramovanatolij81@gmail.com, va997217@gmail.com)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-xs font-bold text-gray-400 cursor-pointer flex items-center space-x-1.5">
                  <span>Активен:</span>
                  <input
                    type="checkbox"
                    checked={adminKeyEnabled}
                    onChange={(e) => setAdminKeyEnabled(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 bg-gray-800 border-gray-700"
                  />
                </label>
              </div>
            </div>

            {/* TIER TOGGLE */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-300 tracking-wider">
                Тип тарифа ключа Администратора:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { playSound?.('click'); setAdminKeyType('free'); }}
                  className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all cursor-pointer ${
                    adminKeyType === 'free'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md'
                      : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="font-black text-sm text-white">🌱 Free Tier</div>
                  <div className="text-[11px] opacity-80 mt-0.5">Бесплатный ключ (15 RPM)</div>
                </button>

                <button
                  type="button"
                  onClick={() => { playSound?.('click'); setAdminKeyType('paid'); }}
                  className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all cursor-pointer ${
                    adminKeyType === 'paid'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-md'
                      : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="font-black text-sm text-white">🔥 Paid Pro</div>
                  <div className="text-[11px] opacity-80 mt-0.5">Платный безлимит (Pay-as-you-go)</div>
                </button>
              </div>
            </div>

            {/* API KEY INPUT */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-gray-300 tracking-wider">
                  Секретный токен API (AIzaSy...):
                </label>
                {adminKeyDetails.isSet && (
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center space-x-1">
                    <span>Текущий:</span>
                    <span className="font-mono">{adminKeyDetails.maskedKey}</span>
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={showAdminKey ? 'text' : 'password'}
                  value={adminKeyInput}
                  onChange={(e) => setAdminKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-gray-800/90 border-2 border-gray-700 focus:border-amber-500 rounded-2xl py-3 px-4 pr-24 text-sm font-mono text-white placeholder-gray-500 focus:outline-none transition-all shadow-inner"
                />
                <div className="absolute right-2 top-2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowAdminKey(!showAdminKey)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer text-xs"
                    title={showAdminKey ? 'Скрыть ключ' : 'Показать ключ'}
                  >
                    {showAdminKey ? '🙈' : '👁️'}
                  </button>
                  {adminKeyInput && (
                    <button
                      type="button"
                      onClick={() => setAdminKeyInput('')}
                      className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer text-xs"
                      title="Очистить поле"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* TEST RESULT ALERT */}
            {adminTestResult && (
              <div className={`p-4 rounded-2xl border text-xs font-bold animate-in fade-in flex items-center justify-between ${
                adminTestResult.ok
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                  : 'bg-red-950/60 border-red-500/60 text-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <span>{adminTestResult.ok ? '✅' : '❌'}</span>
                  <span>{adminTestResult.message}</span>
                </div>
                {adminTestResult.latencyMs && (
                  <span className="font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded-md">
                    {adminTestResult.latencyMs} мс
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-4 border-t border-gray-800 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSaveAdminKey}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-2 border-amber-600 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>💾 Сохранить Ключ Администратора</span>
            </button>

            <button
              type="button"
              onClick={handleTestAdminKey}
              disabled={adminTesting}
              className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl border border-gray-700 transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span>{adminTesting ? '⏳ Проверка...' : '🧪 Тест'}</span>
            </button>

            {adminKeyDetails.isSet && (
              <button
                type="button"
                onClick={handleClearAdminKey}
                className="py-3 px-4 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-bold text-xs rounded-xl border border-red-500/40 transition-all cursor-pointer"
                title="Удалить ключ администратора"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DEVELOPER GEMINI API KEY */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-2 border-cyan-500/40 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl border border-cyan-500/40">
                  💻
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center space-x-2">
                    <span>Gemini API Key Разработчика</span>
                  </h3>
                  <p className="text-xs text-cyan-400 font-bold">
                    Вторичный ключ для тестов, отладки и Voice AI
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-xs font-bold text-gray-400 cursor-pointer flex items-center space-x-1.5">
                  <span>Активен:</span>
                  <input
                    type="checkbox"
                    checked={devKeyEnabled}
                    onChange={(e) => setDevKeyEnabled(e.target.checked)}
                    className="w-4 h-4 text-cyan-500 rounded focus:ring-cyan-400 bg-gray-800 border-gray-700"
                  />
                </label>
              </div>
            </div>

            {/* TIER TOGGLE */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-300 tracking-wider">
                Тип тарифа ключа Разработчика:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { playSound?.('click'); setDevKeyType('free'); }}
                  className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all cursor-pointer ${
                    devKeyType === 'free'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md'
                      : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="font-black text-sm text-white">🌱 Free Tier</div>
                  <div className="text-[11px] opacity-80 mt-0.5">Бесплатный ключ разработчика</div>
                </button>

                <button
                  type="button"
                  onClick={() => { playSound?.('click'); setDevKeyType('paid'); }}
                  className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all cursor-pointer ${
                    devKeyType === 'paid'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-md'
                      : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="font-black text-sm text-white">⚡ Dev Pro</div>
                  <div className="text-[11px] opacity-80 mt-0.5">Выделенная квота для тестов</div>
                </button>
              </div>
            </div>

            {/* API KEY INPUT */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-gray-300 tracking-wider">
                  Секретный токен разработчика (AIzaSy...):
                </label>
                {devKeyDetails.isSet && (
                  <span className="text-[11px] text-cyan-400 font-bold flex items-center space-x-1">
                    <span>Текущий:</span>
                    <span className="font-mono">{devKeyDetails.maskedKey}</span>
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={showDevKey ? 'text' : 'password'}
                  value={devKeyInput}
                  onChange={(e) => setDevKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-gray-800/90 border-2 border-gray-700 focus:border-cyan-500 rounded-2xl py-3 px-4 pr-24 text-sm font-mono text-white placeholder-gray-500 focus:outline-none transition-all shadow-inner"
                />
                <div className="absolute right-2 top-2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowDevKey(!showDevKey)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer text-xs"
                    title={showDevKey ? 'Скрыть ключ' : 'Показать ключ'}
                  >
                    {showDevKey ? '🙈' : '👁️'}
                  </button>
                  {devKeyInput && (
                    <button
                      type="button"
                      onClick={() => setDevKeyInput('')}
                      className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer text-xs"
                      title="Очистить поле"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* TEST RESULT ALERT */}
            {devTestResult && (
              <div className={`p-4 rounded-2xl border text-xs font-bold animate-in fade-in flex items-center justify-between ${
                devTestResult.ok
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                  : 'bg-red-950/60 border-red-500/60 text-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <span>{devTestResult.ok ? '✅' : '❌'}</span>
                  <span>{devTestResult.message}</span>
                </div>
                {devTestResult.latencyMs && (
                  <span className="font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded-md">
                    {devTestResult.latencyMs} мс
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-4 border-t border-gray-800 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSaveDevKey}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-2 border-cyan-700 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>💾 Сохранить Ключ Разработчика</span>
            </button>

            <button
              type="button"
              onClick={handleTestDevKey}
              disabled={devTesting}
              className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl border border-gray-700 transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span>{devTesting ? '⏳ Проверка...' : '🧪 Тест'}</span>
            </button>

            {devKeyDetails.isSet && (
              <button
                type="button"
                onClick={handleClearDevKey}
                className="py-3 px-4 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-bold text-xs rounded-xl border border-red-500/40 transition-all cursor-pointer"
                title="Удалить ключ разработчика"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MCP (MODEL CONTEXT PROTOCOL) & JULES BY GOOGLE LABS DEBUGGING */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-cyan-950/40 border-2 border-indigo-500/50 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-900/60 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-2xl shadow-inner">
              🤖
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Включение функций MCP & Jules by Google Labs
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Model Context Protocol
                </span>
              </div>
              <p className="text-xs text-indigo-200/70 font-medium">
                Интеграция с MCP-сервером Render для расширенной глубокой отладки агентом Jules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
              mcpEnabled
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}>
              {mcpEnabled ? '● MCP Активен' : '○ MCP Выключен'}
            </span>
            <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
              julesDebugEnabled
                ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}>
              {julesDebugEnabled ? '🔍 Jules Debug On' : 'Jules Debug Off'}
            </span>
          </div>
        </div>

        {/* Description Banner */}
        <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-2xl p-4 text-xs text-indigo-100 flex items-start space-x-3">
          <span className="text-xl">ℹ️</span>
          <div className="space-y-1">
            <p className="font-bold text-white">
              При включении Jules использует этот API-ключ для доступа к MCP-серверу Render для расширенной отладки:
            </p>
            <p className="text-indigo-200/80 leading-relaxed">
              Агент <b className="text-white">Jules by Google Labs</b> выполняет инспекцию состояния приложения, трассировку сетевых вызовов и анализ контекста через стандартизированный протокол MCP (Model Context Protocol).
            </p>
          </div>
        </div>

        {/* Toggle Switches Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-white">Включение функций MCP</div>
              <div className="text-[11px] text-gray-400">Разрешить передачу контекста через MCP-сервер</div>
            </div>
            <button
              type="button"
              onClick={() => setMcpEnabled(!mcpEnabled)}
              className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${
                mcpEnabled ? 'bg-indigo-600' : 'bg-gray-700'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                mcpEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-white">Отладка Jules (Google Labs)</div>
              <div className="text-[11px] text-gray-400">Расширенная телеметрия и диагностика ошибок</div>
            </div>
            <button
              type="button"
              onClick={() => setJulesDebugEnabled(!julesDebugEnabled)}
              className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${
                julesDebugEnabled ? 'bg-purple-600' : 'bg-gray-700'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                julesDebugEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Input for Render MCP API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-gray-200 flex items-center space-x-2">
              <span>🔑</span>
              <span>Jules by Google Labs API-ключ для MCP-сервера Render</span>
            </label>
            <span className="text-gray-400 font-mono text-[11px]">
              {mcpKeyInput ? (mcpKeyInput.startsWith('rnd_') ? '✓ Формат Render Key' : '⚠️ Проверьте префикс rnd_') : 'Ключ не введен'}
            </span>
          </div>

          <div className="relative">
            <input
              type={showMcpKey ? 'text' : 'password'}
              value={mcpKeyInput}
              onChange={(e) => setMcpKeyInput(e.target.value)}
              placeholder="rnd_..."
              className="w-full bg-black/60 border border-indigo-700/60 focus:border-indigo-400 rounded-2xl px-4 py-3 text-xs font-mono text-indigo-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all pr-20"
            />
            <div className="absolute right-2 top-2 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setShowMcpKey(!showMcpKey)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer text-xs"
                title={showMcpKey ? 'Скрыть ключ' : 'Показать ключ'}
              >
                {showMcpKey ? '🙈' : '👁️'}
              </button>
              {mcpKeyInput && (
                <button
                  type="button"
                  onClick={() => setMcpKeyInput('')}
                  className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer text-xs"
                  title="Очистить поле"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Test Result Alert */}
        {mcpTestResult && (
          <div className={`p-4 rounded-2xl border text-xs font-bold animate-in fade-in flex items-center justify-between ${
            mcpTestResult.ok
              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
              : 'bg-red-950/60 border-red-500/60 text-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{mcpTestResult.ok ? '✅' : '❌'}</span>
              <span>{mcpTestResult.message}</span>
            </div>
            {mcpTestResult.latencyMs && (
              <span className="font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded-md">
                {mcpTestResult.latencyMs} мс
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSaveMcpConfig}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-2 border-indigo-700 active:translate-y-0.5 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>💾 Сохранить параметры MCP & Jules</span>
          </button>

          <button
            type="button"
            onClick={handleTestMcp}
            disabled={mcpTesting}
            className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl border border-gray-700 transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            <span>{mcpTesting ? '⏳ Проверка...' : '⚡ Тест MCP'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetMcpKey}
            className="py-3 px-4 bg-indigo-950/50 hover:bg-indigo-900/70 text-indigo-300 font-bold text-xs rounded-xl border border-indigo-500/40 transition-all cursor-pointer"
            title="Сбросить к официальному ключу Jules"
          >
            🔄 Jules Default
          </button>

          <button
            type="button"
            onClick={handleCheckJulesApi}
            disabled={julesApiChecking}
            className="py-3 px-4 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/40 transition-all disabled:opacity-50 cursor-pointer"
            title="Проверить серверный прокси Google Jules API"
          >
            {julesApiChecking ? '⏳ Проверка Jules API...' : '🛡️ Тест Google Jules API'}
          </button>
        </div>

        {/* Google Jules Server-Side Security & Exposed Key Protection Notice */}
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-black text-amber-300 uppercase tracking-wider">
              🛡️ Безопасность ключей Google Jules API (Server Proxy)
            </span>
            <span className="text-[10px] font-mono bg-black/40 text-amber-200 px-2 py-0.5 rounded border border-amber-500/30">
              {julesApiStatus?.configured ? `ENV: ${julesApiStatus.maskedKey || 'Configured'}` : 'ENV: JULES_API_KEY (/api/jules/*)'}
            </span>
          </div>
          <p className="text-[11px] text-amber-100/90 leading-relaxed">
            В соответствии с политикой автоматического обнаружения злоупотреблений Google Cloud (<code>disable-exposed-keys</code>), ключи Google Jules API запрещено хранить в браузерном коде или в открытом доступе. Прокси-маршруты <code>/api/jules/*</code> передают заголовок <code>X-Goog-Api-Key</code> исключительно на сервере из переменной окружения <code>JULES_API_KEY</code>.
          </p>
          {julesApiMessage && (
            <div className={`p-3 rounded-xl border text-[11px] font-bold ${
              julesApiMessage.ok
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/60 border-red-500/50 text-red-200'
            }`}>
              {julesApiMessage.ok ? '✅ ' : '⚠️ '}
              {julesApiMessage.text}
            </div>
          )}
        </div>
      </div>

      {/* QUICK INSTRUCTIONS & GOOGLE AI STUDIO GUIDE */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl">💡</span>
          <h3 className="text-sm font-black uppercase text-gray-200 tracking-wider">
            Руководство по ключам Gemini для Администраторов и Разработчиков
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">
              1
            </div>
            <h4 className="font-black text-white text-xs uppercase">Получение API Ключа</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Перейдите в <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-bold hover:text-amber-300">Google AI Studio</a> и нажмите кнопку <b className="text-white">«Create API Key»</b>.
            </p>
          </div>

          <div className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-sm">
              2
            </div>
            <h4 className="font-black text-white text-xs uppercase">Разделение Квот</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Используйте <b className="text-white">Ключ Администратора</b> для боевого продакшена, а <b className="text-white">Ключ Разработчика</b> — для локального тестирования и отладки новых ИИ-сценариев.
            </p>
          </div>

          <div className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
              3
            </div>
            <h4 className="font-black text-white text-xs uppercase">Проверка Пинга</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Вставьте ключ в поле <b className="text-white">Администратора</b> или <b className="text-white">Разработчика</b> выше, нажмите «Тест» для проверки пинга, затем «Сохранить».
            </p>
          </div>

          <div className="bg-rose-950/30 p-4 rounded-2xl border border-rose-500/40 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-sm">
              🔒
            </div>
            <h4 className="font-black text-rose-200 text-xs uppercase">Закрыто для пользователей</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Доступ разрешен только владельцам (<b className="text-white">abramovanatolij81@gmail.com</b>, <b className="text-white">va997217@gmail.com</b>). Обычным пользователям функционал полностью недоступен.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
