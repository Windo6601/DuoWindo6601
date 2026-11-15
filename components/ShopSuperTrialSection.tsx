import React, { useState, useEffect } from 'react';
import { UserProgress, SubscriptionTier, STRIPE_BUY_BUTTON_MAX, STRIPE_BUY_BUTTON_SUPER } from '../types';
import { UNLOCK_DEADLINE_ISO } from '../services/languageLockService';
import { createStripeCheckout, cancelStripeSubscription, openStripePortal, navigateToStripeUrl } from '../services/stripeService';
import { StripeBuyButton } from './StripeBuyButton';
import { StripeTestCardsModal } from './StripeTestCardsModal';

interface ShopSuperTrialSectionProps {
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  playSound: (sound: any) => void;
  setToast: (msg: string) => void;
  upgradeSubscription: (tier: SubscriptionTier) => void;
  cancelSubscription?: () => void;
  onOpenSubscriptionScreen?: () => void;
  isIncognitoUser: boolean;
  STORAGE_KEY: string;
}

interface TrialLocaleStrings {
  titleFree: string;
  titleSubscribed: string;
  titleExpired: string;
  titleActive: string;
  titleSkipped: string;
  titleDeadline: string;
  badgeActive: string;
  badgeCannotClaim: string;
  badgeOnce: string;
  badgeTerm: string;
  badgeUntil: string;
  btnClaim: string;
  btnSkip: string;
  btnReopen: string;
  btnSubscribeSuper: string;
  btnSubscribeMax: string;
  btnSubscribed: string;
  btnAlreadySubscribed: string;
  btnTrialExpired: string;
  remainingLabel: string;
  descFree: string;
  descSuper: string;
  descMax: string;
  subTitle: string;
  unlimitedAccess: string;
  toastExpired: string;
  toastAlreadySubscribed: string;
  toastDeadlinePassed: string;
  toastTrialExpired: string;
  toastIncognito: string;
  toastClaimSuccess: string;
  toastSkipped: string;
  dayUnit: string;
  hourUnit: string;
  minUnit: string;
  secUnit: string;
}

const TRIAL_LOCALES: Record<string, TrialLocaleStrings> = {
  ru: {
    titleFree: 'Бесплатный DuoWindo6601 Super (3 дня)',
    titleSubscribed: 'Уже оформлена подписка DuoWindo6601 {tier}',
    titleExpired: 'Срок действия DuoWindo6601 Super закончился (3 дня)',
    titleActive: 'DuoWindo6601 Super: Пробный период активен',
    titleSkipped: 'Бесплатный DuoWindo6601 Super (3 дня) пропущен',
    titleDeadline: 'Предложение закончилось 1 ноября 2026 г.',
    badgeActive: 'Подписка активна',
    badgeCannotClaim: 'Нельзя получить Super 3 дня',
    badgeOnce: 'Доступно один раз',
    badgeTerm: 'Срок: 3 дня',
    badgeUntil: 'До 1 ноября 2026 г.',
    btnClaim: 'Получить Super (3 дня)',
    btnSkip: 'Пропустить предложение',
    btnReopen: 'Вернуть предложение (3 дня)',
    btnSubscribeSuper: 'Оформить Super',
    btnSubscribeMax: 'Оформить Max',
    btnSubscribed: 'Оформлено',
    btnAlreadySubscribed: 'Подписка уже оформлена',
    btnTrialExpired: 'Срок закончился (3 дня)',
    remainingLabel: 'Осталось',
    descFree: 'Активируйте 3-дневный бесплатный доступ к Super режимам: без рекламы, бесконечные сердца и энергия! Предложение доступно только один раз и действует до 1 ноября 2026 года.',
    descSuper: 'Без рекламы, бесконечные сердца, энергия и режим повторения ошибок',
    descMax: 'Все функции Super + живые AI видео-звонки с совенком и разбор ответов',
    subTitle: 'Подписка DuoWindo6601 Super или Max:',
    unlimitedAccess: 'Безлимитный доступ',
    toastExpired: '⌛ Срок бесплатного DuoWindo6601 Super (3 дня) закончился! Предложение доступно 1 раз (до 1 ноября 2026 г.).',
    toastAlreadySubscribed: '🔒 Уже оформлена подписка DuoWindo6601 Super или DuoWindo6601 Max! Нельзя получить бесплатный DuoWindo6601 Super на 3 дня.',
    toastDeadlinePassed: '🛑 Предложение закончилось до 1 ноября 2026 года!',
    toastTrialExpired: '🛑 Срок закончился (3 дня). Предложение доступно только один раз до 1 ноября 2026 года!',
    toastIncognito: '🔒 Режим Инкогнито: Для получения бесплатного Super на 3 дня требуется постоянный аккаунт!',
    toastClaimSuccess: '🎉 Поздравляем! Бесплатный DuoWindo6601 Super на 3 дня активирован! Доступно 1 раз (до 1 ноября 2026 г.).',
    toastSkipped: '⏭️ Предложение бесплатного Super на 3 дня пропущено. Доступно 1 раз до 1 ноября 2026 г.',
    dayUnit: 'дн.', hourUnit: 'ч.', minUnit: 'мин.', secUnit: 'сек.'
  },
  en: {
    titleFree: 'Free 3-Day DuoWindo6601 Super',
    titleSubscribed: 'Already Subscribed to DuoWindo6601 {tier}',
    titleExpired: 'DuoWindo6601 Super Trial Expired (3 Days)',
    titleActive: 'DuoWindo6601 Super: Trial Active',
    titleSkipped: 'Free 3-Day Super Trial Skipped',
    titleDeadline: 'Offer Ended on Nov 1, 2026',
    badgeActive: 'Active Subscription',
    badgeCannotClaim: 'Cannot claim 3-day trial',
    badgeOnce: 'Available once',
    badgeTerm: 'Term: 3 Days',
    badgeUntil: 'Until Nov 1, 2026',
    btnClaim: 'Claim Super (3 Days)',
    btnSkip: 'Skip Offer',
    btnReopen: 'Re-open Offer (3 Days)',
    btnSubscribeSuper: 'Subscribe Super',
    btnSubscribeMax: 'Subscribe Max',
    btnSubscribed: 'Subscribed',
    btnAlreadySubscribed: 'Already Subscribed',
    btnTrialExpired: 'Trial Expired (3 Days)',
    remainingLabel: 'Remaining',
    descFree: 'Claim your free 3-day Super access with zero ads, infinite hearts, and maximum learning velocity! Available once until Nov 1, 2026.',
    descSuper: 'Zero ads, infinite hearts & energy, dedicated mistake practice',
    descMax: 'All Super perks + real-time AI Video Calls and deep answer analysis',
    subTitle: 'DuoWindo6601 Super or Max Subscription:',
    unlimitedAccess: 'Unlimited Access',
    toastExpired: '⌛ Free 3-Day DuoWindo6601 Super trial has expired! Available once (offer ended Nov 1, 2026).',
    toastAlreadySubscribed: '🔒 Already subscribed to DuoWindo6601 Super or DuoWindo6601 Max! Cannot claim free 3-day Super trial.',
    toastDeadlinePassed: '🛑 The offer ended by November 1, 2026!',
    toastTrialExpired: '🛑 Trial expired (3 days). Offer is available only once until November 1, 2026!',
    toastIncognito: '🔒 Incognito Mode: Registered account required to claim free 3-day Super!',
    toastClaimSuccess: '🎉 Congratulations! Free 3-Day DuoWindo6601 Super trial activated! Available once (until Nov 1, 2026).',
    toastSkipped: '⏭️ Free 3-Day Super trial offer skipped. Available once until Nov 1, 2026.',
    dayUnit: 'd', hourUnit: 'h', minUnit: 'm', secUnit: 's'
  },
  pt: {
    titleFree: 'DuoWindo6601 Super Grátis (3 dias)',
    titleSubscribed: 'Assinatura DuoWindo6601 {tier} já ativa',
    titleExpired: 'Período de teste do DuoWindo6601 Super expirado (3 dias)',
    titleActive: 'DuoWindo6601 Super: Teste Ativo',
    titleSkipped: 'DuoWindo6601 Super Grátis (3 dias) ignorado',
    titleDeadline: 'A oferta terminou em 1 de novembro de 2026',
    badgeActive: 'Assinatura Ativa',
    badgeCannotClaim: 'Não pode resgatar teste de 3 dias',
    badgeOnce: 'Disponível apenas uma vez',
    badgeTerm: 'Duração: 3 dias',
    badgeUntil: 'Até 1 de nov. de 2026',
    btnClaim: 'Resgatar Super (3 Dias)',
    btnSkip: 'Pular Oferta',
    btnReopen: 'Reabrir Oferta (3 Dias)',
    btnSubscribeSuper: 'Assinar Super',
    btnSubscribeMax: 'Assinar Max',
    btnSubscribed: 'Assinado',
    btnAlreadySubscribed: 'Já Assinado',
    btnTrialExpired: 'Teste Expirado (3 Dias)',
    remainingLabel: 'Restante',
    descFree: 'Ative 3 dias grátis de Super: sem anúncios, vidas e energia infinitas! Oferta válida uma vez até 1 de novembro de 2026.',
    descSuper: 'Sem anúncios, corações e energia infinitos, revisão de erros',
    descMax: 'Tudo do Super + chamadas de vídeo com IA em tempo real',
    subTitle: 'Assinatura DuoWindo6601 Super ou Max:',
    unlimitedAccess: 'Acesso Ilimitado',
    toastExpired: '⌛ O teste gratuito de 3 dias do DuoWindo6601 Super expirou!',
    toastAlreadySubscribed: '🔒 Assinatura DuoWindo6601 Super ou Max já ativa!',
    toastDeadlinePassed: '🛑 A oferta terminou em 1 de novembro de 2026!',
    toastTrialExpired: '🛑 O período de teste expirou (3 dias). Disponível uma única vez!',
    toastIncognito: '🔒 Modo Anônimo: Crie uma conta para resgatar o teste de 3 dias!',
    toastClaimSuccess: '🎉 Parabéns! DuoWindo6601 Super de 3 dias ativado!',
    toastSkipped: '⏭️ Oferta de 3 dias do Super ignorada.',
    dayUnit: 'd', hourUnit: 'h', minUnit: 'min', secUnit: 's'
  },
  it: {
    titleFree: 'DuoWindo6601 Super Gratis (3 Giorni)',
    titleSubscribed: 'Abbonamento DuoWindo6601 {tier} già attivo',
    titleExpired: 'Prova DuoWindo6601 Super scaduta (3 Giorni)',
    titleActive: 'DuoWindo6601 Super: Prova Attiva',
    titleSkipped: 'Super Gratis di 3 Giorni ignorato',
    titleDeadline: 'Offerta terminata il 1 novembre 2026',
    badgeActive: 'Abbonamento Attivo',
    badgeCannotClaim: 'Impossibile riscattare prova di 3 giorni',
    badgeOnce: 'Disponibile solo una volta',
    badgeTerm: 'Durata: 3 Giorni',
    badgeUntil: 'Fino al 1 nov 2026',
    btnClaim: 'Ottieni Super (3 Giorni)',
    btnSkip: 'Salta Offerta',
    btnReopen: 'Riapri Offerta (3 Giorni)',
    btnSubscribeSuper: 'Abbonati a Super',
    btnSubscribeMax: 'Abbonati a Max',
    btnSubscribed: 'Abbonato',
    btnAlreadySubscribed: 'Già Abbonato',
    btnTrialExpired: 'Prova Scaduta (3 Giorni)',
    remainingLabel: 'Rimanente',
    descFree: 'Attiva 3 giorni gratis di Super: zero pubblicità, vite ed energia infinite! Disponibile una volta fino al 1 novembre 2026.',
    descSuper: 'Zero pubblicità, cuori ed energia infiniti, revisione errori',
    descMax: 'Tutto di Super + videochiamate AI in tempo realtime',
    subTitle: 'Abbonamento DuoWindo6601 Super o Max:',
    unlimitedAccess: 'Accesso Illimitato',
    toastExpired: '⌛ La prova gratuita di 3 giorni di DuoWindo6601 Super è scaduta!',
    toastAlreadySubscribed: '🔒 Abbonamento Super o Max già attivo!',
    toastDeadlinePassed: '🛑 L\'offerta è terminata il 1 novembre 2026!',
    toastTrialExpired: '🛑 Periodo di prova terminato (3 giorni). Offerta disponibile una sola volta!',
    toastIncognito: '🔒 Modalità Anonima: Registrati per richiedere i 3 giorni gratuiti!',
    toastClaimSuccess: '🎉 Congratulazioni! DuoWindo6601 Super di 3 giorni attivato!',
    toastSkipped: '⏭️ Offerta di prova Super di 3 giorni ignorata.',
    dayUnit: 'g', hourUnit: 'h', minUnit: 'm', secUnit: 's'
  },
  tr: {
    titleFree: 'Ücretsiz 3 Günlük DuoWindo6601 Super',
    titleSubscribed: 'DuoWindo6601 {tier} Aboneliği Zaten Aktif',
    titleExpired: 'DuoWindo6601 Super Deneme Süresi Doldu (3 Gün)',
    titleActive: 'DuoWindo6601 Super: Deneme Aktif',
    titleSkipped: 'Ücretsiz 3 Günlük Super Atlandı',
    titleDeadline: 'Teklif 1 Kasım 2026\'da Sona Erdi',
    badgeActive: 'Abonelik Aktif',
    badgeCannotClaim: '3 günlük deneme alınamaz',
    badgeOnce: 'Yalnızca bir kez geçerli',
    badgeTerm: 'Süre: 3 Gün',
    badgeUntil: '1 Kasım 2026\'ya kadar',
    btnClaim: 'Super Al (3 Gün)',
    btnSkip: 'Teklifi Atla',
    btnReopen: 'Teklifi Aç (3 Gün)',
    btnSubscribeSuper: 'Super\'a Abone Ol',
    btnSubscribeMax: 'Max\'e Abone Ol',
    btnSubscribed: 'Abone Olundu',
    btnAlreadySubscribed: 'Zaten Abonesiniz',
    btnTrialExpired: 'Deneme Doldu (3 Gün)',
    remainingLabel: 'Kalan Süre',
    descFree: '3 günlük ücretsiz Super avantajlarını etkinleştirin: Reklamsız, sınırsız can ve enerji! 1 Kasım 2026\'ya kadar yalnızca bir kez geçerlidir.',
    descSuper: 'Sıfır reklam, sınırsız can & enerji, hata tekrarı modu',
    descMax: 'Tüm Super avantajları + gerçek zamanlı Yapay Zeka video görüşmeleri',
    subTitle: 'DuoWindo6601 Super veya Max Aboneliği:',
    unlimitedAccess: 'Sınırsız Erişim',
    toastExpired: '⌛ 3 Günlük ücretsiz DuoWindo6601 Super deneme süreniz doldu!',
    toastAlreadySubscribed: '🔒 Zaten DuoWindo6601 Super veya Max abonesisiniz!',
    toastDeadlinePassed: '🛑 Teklif 1 Kasım 2026\'da sona erdi!',
    toastTrialExpired: '🛑 Deneme süresi doldu (3 gün). Teklif sadece bir kez kullanılabilir!',
    toastIncognito: '🔒 Gizli Mod: 3 günlük Super denemesini almak için hesap gereklidir!',
    toastClaimSuccess: '🎉 Tebrikler! 3 Günlük DuoWindo6601 Super aktif edildi!',
    toastSkipped: '⏭️ 3 Günlük Super teklifi atlandı.',
    dayUnit: 'g', hourUnit: 'sa', minUnit: 'dk', secUnit: 'sn'
  },
  ko: {
    titleFree: 'DuoWindo6601 Super 3일 무료 체험',
    titleSubscribed: 'DuoWindo6601 {tier} 구독이 이미 활성화됨',
    titleExpired: 'DuoWindo6601 Super 체험 만료됨 (3일)',
    titleActive: 'DuoWindo6601 Super: 체험 활성 중',
    titleSkipped: 'Super 3일 무료 체험 건너뜀',
    titleDeadline: '혜택이 2026년 11월 1일 종료됨',
    badgeActive: '구독 활성화됨',
    badgeCannotClaim: '3일 체험 신청 불가',
    badgeOnce: '1회만 제공',
    badgeTerm: '기간: 3일',
    badgeUntil: '2026년 11월 1일까지',
    btnClaim: 'Super 받기 (3일)',
    btnSkip: '혜택 건너뛰기',
    btnReopen: '혜택 다시 열기 (3일)',
    btnSubscribeSuper: 'Super 구독하기',
    btnSubscribeMax: 'Max 구독하기',
    btnSubscribed: '구독 완료',
    btnAlreadySubscribed: '이미 구독 중',
    btnTrialExpired: '체험 종료 (3일)',
    remainingLabel: '남은 시간',
    descFree: '광고 없음, 무제한 하트 및 에너지로 3일간 무료 Super 혜택을 누리세요! 2026년 11월 1일까지 1회만 제공됩니다.',
    descSuper: '광고 제거, 무제한 하트와 에너지, 맞춤 오답 복습',
    descMax: 'Super의 모든 혜택 + 실시간 AI 화상 통화',
    subTitle: 'DuoWindo6601 Super 또는 Max 구독:',
    unlimitedAccess: '무제한 액세스',
    toastExpired: '⌛ DuoWindo6601 Super 3일 무료 체험이 종료되었습니다!',
    toastAlreadySubscribed: '🔒 이미 Super 또는 Max 구독 중입니다!',
    toastDeadlinePassed: '🛑 혜택이 2026년 11월 1일에 마감되었습니다!',
    toastTrialExpired: '🛑 3일 체험 기간이 만료되었습니다. 1인당 1회만 제공됩니다!',
    toastIncognito: '🔒 시크릿 모드: 3일 무료 체험을 받으려면 정식 로그인이 필요합니다!',
    toastClaimSuccess: '🎉 축하합니다! DuoWindo6601 Super 3일 체험이 시작되었습니다!',
    toastSkipped: '⏭️ Super 3일 체험 혜택을 건너뛰었습니다.',
    dayUnit: '일', hourUnit: '시간', minUnit: '분', secUnit: '초'
  },
  hi: {
    titleFree: 'मुफ़्त 3-दिवसीय DuoWindo6601 Super',
    titleSubscribed: 'DuoWindo6601 {tier} सदस्यता पहले से सक्रिय है',
    titleExpired: 'DuoWindo6601 Super परीक्षण समाप्त (3 दिन)',
    titleActive: 'DuoWindo6601 Super: परीक्षण सक्रिय',
    titleSkipped: 'मुफ़्त 3-दिवसीय Super छोड़ दिया गया',
    titleDeadline: 'ऑफ़र 1 नवंबर 2026 को समाप्त हो गया',
    badgeActive: 'सदस्यता सक्रिय',
    badgeCannotClaim: '3-दिन का परीक्षण उपलब्ध नहीं',
    badgeOnce: 'केवल एक बार उपलब्ध',
    badgeTerm: 'अवधि: 3 दिन',
    badgeUntil: '1 नवंबर 2026 तक',
    btnClaim: 'Super प्राप्त करें (3 दिन)',
    btnSkip: 'ऑफ़र छोड़ें',
    btnReopen: 'ऑफ़र पुनः खोलें (3 दिन)',
    btnSubscribeSuper: 'Super सदस्यता लें',
    btnSubscribeMax: 'Max सदस्यता लें',
    btnSubscribed: 'सदस्यता ली गई',
    btnAlreadySubscribed: 'पहले से सदस्य हैं',
    btnTrialExpired: 'परीक्षण समाप्त (3 दिन)',
    remainingLabel: 'शेष समय',
    descFree: 'बिना विज्ञापन, असीमित दिल और ऊर्जा के 3-दिन का मुफ़्त Super शुरू करें! 1 नवंबर 2026 तक केवल एक बार उपलब्ध।',
    descSuper: 'शून्य विज्ञापन, असीमित दिल और ऊर्जा, गलतियों का अभ्यास',
    descMax: 'Super के सभी लाभ + लाइव AI वीडियो कॉल',
    subTitle: 'DuoWindo6601 Super या Max सदस्यता:',
    unlimitedAccess: 'असीमित पहुंच',
    toastExpired: '⌛ DuoWindo6601 Super का 3-दिवसीय मुफ़्त परीक्षण समाप्त हो गया!',
    toastAlreadySubscribed: '🔒 Super या Max की सदस्यता पहले से सक्रिय है!',
    toastDeadlinePassed: '🛑 ऑफ़र 1 नवंबर 2026 को समाप्त हो गया!',
    toastTrialExpired: '🛑 3-दिन का परीक्षण समाप्त हो चुका है। यह केवल एक बार उपलब्ध है!',
    toastIncognito: '🔒 गुप्त मोड: मुफ़्त Super पाने के लिए स्थायी खाता आवश्यक है!',
    toastClaimSuccess: '🎉 बधाई! मुफ़्त DuoWindo6601 Super (3 दिन) सक्रिय हो गया!',
    toastSkipped: '⏭️ 3-दिवसीय Super ऑफ़र छोड़ दिया गया।',
    dayUnit: 'दिन', hourUnit: 'घंटे', minUnit: 'मिनट', secUnit: 'सेकंड'
  },
  pl: {
    titleFree: 'Darmowy 3-dniowy DuoWindo6601 Super',
    titleSubscribed: 'Subskrypcja DuoWindo6601 {tier} już aktywna',
    titleExpired: 'Okres próbny DuoWindo6601 Super wygasł (3 dni)',
    titleActive: 'DuoWindo6601 Super: Okres próbny aktywny',
    titleSkipped: 'Pominięto darmowy 3-dniowy Super',
    titleDeadline: 'Oferta zakończyła się 1 listopada 2026 r.',
    badgeActive: 'Subskrypcja aktywna',
    badgeCannotClaim: 'Nie można odebrać 3-dniowej wersji próbnej',
    badgeOnce: 'Dostępne tylko raz',
    badgeTerm: 'Okres: 3 dni',
    badgeUntil: 'Do 1 listopada 2026 r.',
    btnClaim: 'Odbierz Super (3 dni)',
    btnSkip: 'Pomiń ofertę',
    btnReopen: 'Przywróć ofertę (3 dni)',
    btnSubscribeSuper: 'Subskrybuj Super',
    btnSubscribeMax: 'Subskrybuj Max',
    btnSubscribed: 'Zasubskrybowano',
    btnAlreadySubscribed: 'Już subskrybujesz',
    btnTrialExpired: 'Wersja próbna wygasła (3 dni)',
    remainingLabel: 'Pozostało',
    descFree: 'Aktywuj 3-dniowy darmowy dostęp Super: bez reklam, nieskończone serca i energia! Oferta jednorazowa do 1 listopada 2026 r.',
    descSuper: 'Brak reklam, nielimitowane serca i energia, powtórka błędów',
    descMax: 'Wszystko z Super + rozmowy wideo AI w czasie rzeczywistym',
    subTitle: 'Subskrypcja DuoWindo6601 Super lub Max:',
    unlimitedAccess: 'Nielimitowany dostęp',
    toastExpired: '⌛ 3-dniowy darmowy okres próbny DuoWindo6601 Super wygasł!',
    toastAlreadySubscribed: '🔒 Subskrypcja Super lub Max jest już aktywna!',
    toastDeadlinePassed: '🛑 Oferta zakończyła się 1 listopada 2026 r.!',
    toastTrialExpired: '🛑 Okres próbny wygasł (3 dni). Oferta dostępna tylko raz!',
    toastIncognito: '🔒 Tryb incognito: Aby odebrać 3 dni Super, wymagane jest konto!',
    toastClaimSuccess: '🎉 Gratulacje! 3-dniowy DuoWindo6601 Super aktywowany!',
    toastSkipped: '⏭️ Pominięto ofertę 3-dniowego Super.',
    dayUnit: 'd', hourUnit: 'godz.', minUnit: 'min', secUnit: 's'
  },
  id: {
    titleFree: 'DuoWindo6601 Super Gratis 3 Hari',
    titleSubscribed: 'Langganan DuoWindo6601 {tier} sudah aktif',
    titleExpired: 'Uji Coba DuoWindo6601 Super Berakhir (3 Hari)',
    titleActive: 'DuoWindo6601 Super: Uji Coba Aktif',
    titleSkipped: 'Super Gratis 3 Hari Dilewati',
    titleDeadline: 'Penawaran berakhir pada 1 November 2026',
    badgeActive: 'Langganan Aktif',
    badgeCannotClaim: 'Tidak dapat mengklaim uji coba 3 hari',
    badgeOnce: 'Hanya tersedia sekali',
    badgeTerm: 'Durasi: 3 Hari',
    badgeUntil: 'Hingga 1 Nov 2026',
    btnClaim: 'Klaim Super (3 Hari)',
    btnSkip: 'Lewati Penawaran',
    btnReopen: 'Buka Kembali Penawaran (3 Hari)',
    btnSubscribeSuper: 'Langganan Super',
    btnSubscribeMax: 'Langganan Max',
    btnSubscribed: 'Berlangganan',
    btnAlreadySubscribed: 'Sudah Berlangganan',
    btnTrialExpired: 'Uji Coba Berakhir (3 Hari)',
    remainingLabel: 'Tersisa',
    descFree: 'Aktifkan akses gratis 3 hari ke Super: tanpa iklan, hati & energi tak terbatas! Tersedia sekali hingga 1 November 2026.',
    descSuper: 'Tanpa iklan, hati dan energi tak terbatas, latihan kesalahan',
    descMax: 'Semua fitur Super + panggilan video AI langsung',
    subTitle: 'Langganan DuoWindo6601 Super atau Max:',
    unlimitedAccess: 'Akses Tanpa Batas',
    toastExpired: '⌛ Masa uji coba 3 hari DuoWindo6601 Super telah berakhir!',
    toastAlreadySubscribed: '🔒 Langganan DuoWindo6601 Super atau Max sudah aktif!',
    toastDeadlinePassed: '🛑 Penawaran berakhir pada 1 November 2026!',
    toastTrialExpired: '🛑 Masa uji coba berakhir (3 hari). Hanya berlaku satu kali!',
    toastIncognito: '🔒 Mode Anonim: Perlu akun permanen untuk klaim Super 3 hari!',
    toastClaimSuccess: '🎉 Selamat! DuoWindo6601 Super 3 hari berhasil diaktifkan!',
    toastSkipped: '⏭️ Penawaran Super 3 hari dilewati.',
    dayUnit: 'h', hourUnit: 'j', minUnit: 'm', secUnit: 'd'
  },
  bn: {
    titleFree: 'বিনামূল্যে ৩ দিনের DuoWindo6601 Super',
    titleSubscribed: 'DuoWindo6601 {tier} সাবস্ক্রিপশন ইতিমধ্যে সক্রিয়',
    titleExpired: 'DuoWindo6601 Super ট্রায়াল শেষ হয়েছে (৩ দিন)',
    titleActive: 'DuoWindo6601 Super: ট্রায়াল সক্রিয়',
    titleSkipped: 'বিনামূল্যে ৩ দিনের Super ট্রায়াল এড়ানো হয়েছে',
    titleDeadline: 'অফারটি ১ নভেম্বর ২০২৬ তারিখে শেষ হয়েছে',
    badgeActive: 'সাবস্ক্রিপশন সক্রিয়',
    badgeCannotClaim: '৩ দিনের ট্রায়াল দাবি করা যাবে না',
    badgeOnce: 'শুধুমাত্র একবার উপলব্ধ',
    badgeTerm: 'মেয়াদ: ৩ দিন',
    badgeUntil: '১ নভেম্বর ২০২৬ পর্যন্ত',
    btnClaim: 'Super পান (৩ দিন)',
    btnSkip: 'অফার এড়িয়ে যান',
    btnReopen: 'অফার পুনরায় খুলুন (৩ দিন)',
    btnSubscribeSuper: 'Super সাবস্ক্রাইব করুন',
    btnSubscribeMax: 'Max সাবস্ক্রাইব করুন',
    btnSubscribed: 'সাবস্ক্রাইব করা হয়েছে',
    btnAlreadySubscribed: 'ইতিমধ্যে সাবস্ক্রাইব করা আছে',
    btnTrialExpired: 'ট্রায়াল শেষ (৩ দিন)',
    remainingLabel: 'অবশিষ্ট',
    descFree: 'বিজ্ঞাপনহীন, সীমাহীন হৃদয় এবং শক্তির সাথে ৩ দিনের বিনামূল্যে Super উপভোগ করুন! ১ নভেম্বর ২০২৬ পর্যন্ত শুধুমাত্র একবার উপলব্ধ।',
    descSuper: 'কোনো বিজ্ঞাপন নেই, সীমাহীন হৃদয় ও শক্তি, ভুলের পুনরাবৃত্তি',
    descMax: 'Super-এর সমস্ত সুবিধা + রিয়েল-টাইম AI ভিডিও কল',
    subTitle: 'DuoWindo6601 Super বা Max সাবস্ক্রিপশন:',
    unlimitedAccess: 'সীমাহীন অ্যাক্সেস',
    toastExpired: '⌛ DuoWindo6601 Super ৩ দিনের ট্রায়াল শেষ হয়েছে!',
    toastAlreadySubscribed: '🔒 Super বা Max সাবস্ক্রিপশন ইতিমধ্যে সক্রিয়!',
    toastDeadlinePassed: '🛑 অফারটি ১ নভেম্বর ২০২৬ তারিখে শেষ হয়েছে!',
    toastTrialExpired: '🛑 ট্রায়াল শেষ (৩ দিন)। অফারটি কেবল একবার উপলব্ধ!',
    toastIncognito: '🔒 ছদ্মনাম মোড: ৩ দিনের Super পেতে স্থায়ী অ্যাকাউন্ট প্রয়োজন!',
    toastClaimSuccess: '🎉 অভিনন্দন! বিনামূল্যে ৩ দিনের Super সক্রিয় হয়েছে!',
    toastSkipped: '⏭️ ৩ দিনের Super অফার এড়ানো হয়েছে।',
    dayUnit: 'দিন', hourUnit: 'ঘণ্টা', minUnit: 'মিনিট', secUnit: 'সেকেন্ড'
  },
  th: {
    titleFree: 'ทดลองใช้ DuoWindo6601 Super ฟรี 3 วัน',
    titleSubscribed: 'การสมัครสมาชิก DuoWindo6601 {tier} เปิดใช้งานอยู่แล้ว',
    titleExpired: 'การทดลองใช้ DuoWindo6601 Super สิ้นสุดลงแล้ว (3 วัน)',
    titleActive: 'DuoWindo6601 Super: กำลังทดลองใช้งาน',
    titleSkipped: 'ข้ามสิทธิ์ทดลองใช้ Super ฟรี 3 วัน',
    titleDeadline: 'ข้อเสนอสิ้นสุดลงในวันที่ 1 พฤศจิกายน 2026',
    badgeActive: 'การสมัครสมาชิกใช้งานอยู่',
    badgeCannotClaim: 'ไม่สามารถรับสิทธิ์ทดลอง 3 วันได้',
    badgeOnce: 'รับสิทธิ์ได้เพียงครั้งเดียว',
    badgeTerm: 'ระยะเวลา: 3 วัน',
    badgeUntil: 'จนถึง 1 พ.ย. 2026',
    btnClaim: 'รับสิทธิ์ Super (3 วัน)',
    btnSkip: 'ข้ามข้อเสนอ',
    btnReopen: 'เปิดข้อเสนออีกครั้ง (3 วัน)',
    btnSubscribeSuper: 'สมัคร Super',
    btnSubscribeMax: 'สมัคร Max',
    btnSubscribed: 'สมัครสมาชิกแล้ว',
    btnAlreadySubscribed: 'เป็นสมาชิกอยู่แล้ว',
    btnTrialExpired: 'หมดอายุการทดลอง (3 วัน)',
    remainingLabel: 'เวลาที่เหลือ',
    descFree: 'เปิดใช้งาน Super ฟรี 3 วัน ไร้โฆษณา หัวใจและพลังงานไม่จำกัด! รับสิทธิ์ได้ครั้งเดียวจนถึง 1 พ.ย. 2026',
    descSuper: 'ไม่มีโฆษณา หัวใจและพลังงานไม่จำกัด ฝึกทบทวนข้อผิดพลาด',
    descMax: 'สิทธิประโยชน์ทั้งหมดของ Super + วิดีโอคอล AI แบบเรียลไทม์',
    subTitle: 'การสมัครสมาชิก DuoWindo6601 Super หรือ Max:',
    unlimitedAccess: 'เข้าถึงได้ไม่จำกัด',
    toastExpired: '⌛ ระยะเวลาทดลองใช้ DuoWindo6601 Super ฟรี 3 วันสิ้นสุดลงแล้ว!',
    toastAlreadySubscribed: '🔒 มีการสมัครสมาชิก Super หรือ Max อยู่แล้ว!',
    toastDeadlinePassed: '🛑 ข้อเสนอสิ้นสุดลงเมื่อวันที่ 1 พฤศจิกายน 2026!',
    toastTrialExpired: '🛑 สิทธิ์ทดลองใช้หมดอายุ (3 วัน) รับได้เพียงครั้งเดียว!',
    toastIncognito: '🔒 โหมดไม่ระบุตัวตน: ต้องมีบัญชีเพื่อรับสิทธิ์ Super 3 วัน!',
    toastClaimSuccess: '🎉 ยินดีด้วย! เปิดใช้งาน DuoWindo6601 Super ฟรี 3 วันแล้ว!',
    toastSkipped: '⏭️ ข้ามข้อเสนอ Super 3 วันแล้ว',
    dayUnit: 'วัน', hourUnit: 'ชม.', minUnit: 'นาที', secUnit: 'วินาที'
  },
  vi: {
    titleFree: 'DuoWindo6601 Super Miễn phí 3 Ngày',
    titleSubscribed: 'Gói đăng ký DuoWindo6601 {tier} đang hoạt động',
    titleExpired: 'Dùng thử DuoWindo6601 Super đã hết hạn (3 Ngày)',
    titleActive: 'DuoWindo6601 Super: Đang dùng thử',
    titleSkipped: 'Đã bỏ qua Super miễn phí 3 ngày',
    titleDeadline: 'Ưu đãi đã kết thúc vào ngày 1 tháng 11 năm 2026',
    badgeActive: 'Đang hoạt động',
    badgeCannotClaim: 'Không thể nhận dùng thử 3 ngày',
    badgeOnce: 'Chỉ áp dụng một lần',
    badgeTerm: 'Thời hạn: 3 Ngày',
    badgeUntil: 'Đến ngày 1 tháng 11 năm 2026',
    btnClaim: 'Nhận Super (3 Ngày)',
    btnSkip: 'Bỏ qua ưu đãi',
    btnReopen: 'Mở lại ưu đãi (3 Ngày)',
    btnSubscribeSuper: 'Đăng ký Super',
    btnSubscribeMax: 'Đăng ký Max',
    btnSubscribed: 'Đã đăng ký',
    btnAlreadySubscribed: 'Đã đăng ký trước đó',
    btnTrialExpired: 'Hết hạn dùng thử (3 Ngày)',
    remainingLabel: 'Còn lại',
    descFree: 'Kích hoạt 3 ngày trải nghiệm Super miễn phí: không quảng cáo, trái tim và năng lượng vô hạn! Chỉ áp dụng một lần đến ngày 1/11/2026.',
    descSuper: 'Không quảng cáo, trái tim & năng lượng vô hạn, ôn tập lỗi sai',
    descMax: 'Mọi quyền lợi của Super + gọi video AI thời gian thực',
    subTitle: 'Đăng ký DuoWindo6601 Super hoặc Max:',
    unlimitedAccess: 'Truy cập không giới hạn',
    toastExpired: '⌛ Hết hạn dùng thử 3 ngày DuoWindo6601 Super!',
    toastAlreadySubscribed: '🔒 Bạn đã đăng ký Super hoặc Max từ trước!',
    toastDeadlinePassed: '🛑 Ưu đãi đã kết thúc vào ngày 1 tháng 11 năm 2026!',
    toastTrialExpired: '🛑 Đã hết hạn dùng thử (3 ngày). Chỉ áp dụng một lần!',
    toastIncognito: '🔒 Chế độ Ẩn danh: Cần có tài khoản để nhận 3 ngày Super!',
    toastClaimSuccess: '🎉 Chúc mừng! Đã kích hoạt 3 ngày DuoWindo6601 Super!',
    toastSkipped: '⏭️ Đã bỏ qua ưu đãi dùng thử Super 3 ngày.',
    dayUnit: 'ng', hourUnit: 'g', minUnit: 'p', secUnit: 'gi'
  },
  kk: {
    titleFree: 'DuoWindo6601 Super тегін 3 күн',
    titleSubscribed: 'DuoWindo6601 {tier} жазылымы белсенді',
    titleExpired: 'DuoWindo6601 Super мерзімі аяқталды (3 күн)',
    titleActive: 'DuoWindo6601 Super: Сынақ мерзімі белсенді',
    titleSkipped: 'Тегін 3 күндік Super өткізіп жіберілді',
    titleDeadline: 'Ұсыныс 2026 жылдың 1 қарашасында аяқталды',
    badgeActive: 'Жазылым белсенді',
    badgeCannotClaim: '3 күндік сынақты алуға болмайды',
    badgeOnce: 'Тек бір рет қолжетімді',
    badgeTerm: 'Мерзімі: 3 күн',
    badgeUntil: '2026 жылдың 1 қарашасына дейін',
    btnClaim: 'Super алу (3 күн)',
    btnSkip: 'Ұсынысты өткізіп жіберу',
    btnReopen: 'Ұсынысты қайтару (3 күн)',
    btnSubscribeSuper: 'Super жазылу',
    btnSubscribeMax: 'Max жазылу',
    btnSubscribed: 'Жазылған',
    btnAlreadySubscribed: 'Жазылым бар',
    btnTrialExpired: 'Мерзімі бітті (3 күн)',
    remainingLabel: 'Қалды',
    descFree: 'Жарнамасыз, шексіз жүректер мен қуат беретін 3 күндік тегін Super мүмкіндігін қосыңыз! 2026 жылғы 1 қарашаға дейін тек бір рет қолжетімді.',
    descSuper: 'Жарнамасыз, шексіз жүректер мен қуат, қателерді қайталау',
    descMax: 'Super артықшылықтары + AI нақты уақыттағы бейнеқоңыраулар',
    subTitle: 'DuoWindo6601 Super немесе Max жазылымы:',
    unlimitedAccess: 'Шексіз қолжетімділік',
    toastExpired: '⌛ DuoWindo6601 Super 3 күндік тегін сынақ мерзімі аяқталды!',
    toastAlreadySubscribed: '🔒 Super немесе Max жазылымы әлдеқашан белсенді!',
    toastDeadlinePassed: '🛑 Ұсыныс 2026 жылдың 1 қарашасында аяқталды!',
    toastTrialExpired: '🛑 Сынақ мерзімі аяқталды (3 күн). Тек бір рет беріледі!',
    toastIncognito: '🔒 Инкогнито режимі: 3 күндік Super алу үшін тіркелген есептік жазба қажет!',
    toastClaimSuccess: '🎉 Құттықтаймыз! 3 күндік DuoWindo6601 Super іске қосылды!',
    toastSkipped: '⏭️ 3 күндік Super ұсынысы өткізіп жіберілді.',
    dayUnit: 'күн', hourUnit: 'сағ.', minUnit: 'мин.', secUnit: 'сек.'
  },
  uz: {
    titleFree: 'Bepul 3 kunlik DuoWindo6601 Super',
    titleSubscribed: 'DuoWindo6601 {tier} obunasi allaqachon faol',
    titleExpired: 'DuoWindo6601 Super muddati tugadi (3 kun)',
    titleActive: 'DuoWindo6601 Super: Sinov muddati faol',
    titleSkipped: 'Bepul 3 kunlik Super o\'tkazib yuborildi',
    titleDeadline: 'Taklif 2026-yil 1-noyabrda yakunlandi',
    badgeActive: 'Obuna faol',
    badgeCannotClaim: '3 kunlik sinovni olish imkonsiz',
    badgeOnce: 'Faqat bir marta beriladi',
    badgeTerm: 'Muddat: 3 kun',
    badgeUntil: '2026-yil 1-noyabrgacha',
    btnClaim: 'Super olish (3 kun)',
    btnSkip: 'Taklifni o\'tkazib yuborish',
    btnReopen: 'Taklifni qaytarish (3 kun)',
    btnSubscribeSuper: 'Super obuna bo\'lish',
    btnSubscribeMax: 'Max obuna bo\'lish',
    btnSubscribed: 'Obuna bo\'lindi',
    btnAlreadySubscribed: 'Allaqachon obuna bo\'lgansiz',
    btnTrialExpired: 'Sinov muddati tugadi (3 kun)',
    remainingLabel: 'Qoldi',
    descFree: 'Reklamasiz, cheksiz yuraklar va energiya bilan 3 kunlik bepul Super-ni faollashtiring! 2026-yil 1-noyabrgacha bir marta amal qiladi.',
    descSuper: 'Reklamasiz, cheksiz yuraklar va energiya, xatolar ustida ishlash',
    descMax: 'Super imtiyozlari + jonli AI video qo\'ng\'iroqlari',
    subTitle: 'DuoWindo6601 Super yoki Max obunasi:',
    unlimitedAccess: 'Cheksiz kirish',
    toastExpired: '⌛ DuoWindo6601 Super 3 kunlik sinov muddati yakunlandi!',
    toastAlreadySubscribed: '🔒 DuoWindo6601 Super yoki Max obunasi allaqachon faol!',
    toastDeadlinePassed: '🛑 Taklif 2026-yil 1-noyabrda yakunlangan!',
    toastTrialExpired: '🛑 Sinov muddati tugadi (3 kun). Taklif faqat bir marta taqdim etiladi!',
    toastIncognito: '🔒 Inkognito rejimi: 3 kunlik Super olish uchun hisob kerak!',
    toastClaimSuccess: '🎉 Tabriklaymiz! 3 kunlik DuoWindo6601 Super faollashtirildi!',
    toastSkipped: '⏭️ 3 kunlik Super taklifi o\'tkazib yuborildi.',
    dayUnit: 'kun', hourUnit: 'soat', minUnit: 'daq.', secUnit: 'son.'
  },
  hy: {
    titleFree: 'Անվճար 3-օրյա DuoWindo6601 Super',
    titleSubscribed: 'DuoWindo6601 {tier} բաժանորդագրությունն արդեն ակտիվ է',
    titleExpired: 'DuoWindo6601 Super փորձաշրջանն ավարտվել է (3 օր)',
    titleActive: 'DuoWindo6601 Super: Փորձաշրջանն ակտիվ է',
    titleSkipped: 'Անվճար 3-օրյա Super-ը բաց է թողնվել',
    titleDeadline: 'Առաջարկն ավարտվել է 2026թ. նոյեմբերի 1-ին',
    badgeActive: 'Բաժանորդագրությունն ակտիվ է',
    badgeCannotClaim: '3-օրյա փորձաշրջանը հասանելի չէ',
    badgeOnce: 'Հասանելի է միայն մեկ անգամ',
    badgeTerm: 'Ժամկետ՝ 3 օր',
    badgeUntil: 'Մինչև 2026թ. նոյեմբերի 1-ը',
    btnClaim: 'Ստանալ Super (3 օր)',
    btnSkip: 'Բաց թողնել առաջարկը',
    btnReopen: 'Վերաբացել առաջարկը (3 օր)',
    btnSubscribeSuper: 'Բաժանորդագրվել Super-ին',
    btnSubscribeMax: 'Բաժանորդագրվել Max-ին',
    btnSubscribed: 'Բաժանորդագրված է',
    btnAlreadySubscribed: 'Արդեն բաժանորդագրված եք',
    btnTrialExpired: 'Փորձաշրջանն ավարտված է (3 օր)',
    remainingLabel: 'Մնացել է',
    descFree: 'Ակտիվացրեք 3-օրյա անվճար Super՝ առանց գովազդի, անսահմանափակ սրտեր և էներգիա: Հասանելի է մեկ անգամ մինչև 2026թ. նոյեմբերի 1-ը:',
    descSuper: 'Առանց գովազդի, անսահման սրտեր և էներգիա, սխալների վերանայում',
    descMax: 'Super-ի բոլոր առավելությունները + իրական ժամանակում AI տեսազանգեր',
    subTitle: 'DuoWindo6601 Super կամ Max բաժանորդագրություն:',
    unlimitedAccess: 'Անսահմանափակ մուտք',
    toastExpired: '⌛ DuoWindo6601 Super 3-օրյա փորձաշրջանն ավարտվել է:',
    toastAlreadySubscribed: '🔒 Super կամ Max բաժանորդագրությունն արդեն ակտիվ է:',
    toastDeadlinePassed: '🛑 Առաջարկն ավարտվել է 2026թ. նոյեմբերի 1-ին:',
    toastTrialExpired: '🛑 Փորձաշրջանն ավարտվել է (3 օր): Առաջարկը գործում է միայն մեկ անգամ:',
    toastIncognito: '🔒 Ինկոգնիտո ռեժիմ՝ Super ստանալու համար գրանցված հաշիվ է պահանջվում:',
    toastClaimSuccess: '🎉 Շնորհավորում ենք: 3-օրյա DuoWindo6601 Super-ն ակտիվացված է:',
    toastSkipped: '⏭️ 3-օրյա Super առաջարկը բաց է թողնվել:',
    dayUnit: 'օր', hourUnit: 'ժ', minUnit: 'ր', secUnit: 'վ'
  },
  ka: {
    titleFree: 'უფასო 3-დღიანი DuoWindo6601 Super',
    titleSubscribed: 'DuoWindo6601 {tier} გამოწერა უკვე აქტიურია',
    titleExpired: 'DuoWindo6601 Super საცდელი ვადა ამოიწურა (3 დღე)',
    titleActive: 'DuoWindo6601 Super: საცდელი პერიოდი აქტიურია',
    titleSkipped: 'უფასო 3-დღიანი Super გამოტოვებულია',
    titleDeadline: 'შეთავაზება დასრულდა 2026 წლის 1 ნოემბერს',
    badgeActive: 'გამოწერა აქტიურია',
    badgeCannotClaim: '3-დღიანი ვადის მიღება შეუძლებელია',
    badgeOnce: 'ხელმისაწვდომია მხოლოდ ერთხელ',
    badgeTerm: 'ვადა: 3 დღე',
    badgeUntil: '2026 წლის 1 ნოემბრამდე',
    btnClaim: 'მიიღეთ Super (3 დღე)',
    btnSkip: 'შეთავაზების გამოტოვება',
    btnReopen: 'შეთავაზების დაბრუნება (3 დღე)',
    btnSubscribeSuper: 'Super გამოწერა',
    btnSubscribeMax: 'Max გამოწერა',
    btnSubscribed: 'გამოწერილია',
    btnAlreadySubscribed: 'უკვე გამოწერილი გაქვთ',
    btnTrialExpired: 'ვადა ამოიწურა (3 დღე)',
    remainingLabel: 'დარჩენილია',
    descFree: 'გაააქტიურეთ 3-დღიანი უფასო Super: რეკლამის გარეშე, შეუზღუდავი გულები და ენერგია! ხელმისაწვდომია ერთხელ 2026 წლის 1 ნოემბრამდე.',
    descSuper: 'რეკლამის გარეშე, ულიმიტო გულები და ენერგია, შეცდომების პრაქტიკა',
    descMax: 'Super-ის ყველა უპირატესობა + პირდაპირი AI ვიდეოზარები',
    subTitle: 'DuoWindo6601 Super ან Max გამოწერა:',
    unlimitedAccess: 'შეუზღუდავი წვდომა',
    toastExpired: '⌛ DuoWindo6601 Super 3-დღიანი საცდელი ვადა ამოიწურა!',
    toastAlreadySubscribed: '🔒 Super ან Max გამოწერა უკვე აქტიურია!',
    toastDeadlinePassed: '🛑 შეთავაზება დასრულდა 2026 წლის 1 ნოემბერს!',
    toastTrialExpired: '🛑 საცდელი ვადა ამოიწურა (3 დღე). შეთავაზება ხელმისაწვდომია მხოლოდ ერთხელ!',
    toastIncognito: '🔒 ინკოგნიტო რეჟიმი: 3-დღიანი Super-ის მისაღებად საჭიროა ანგარიში!',
    toastClaimSuccess: '🎉 გილოცავთ! 3-დღიანი DuoWindo6601 Super გააქტიურდა!',
    toastSkipped: '⏭️ 3-დღიანი Super შეთავაზება გამოტოვებულია.',
    dayUnit: 'დღე', hourUnit: 'სთ', minUnit: 'წთ', secUnit: 'წმ'
  },
  az: {
    titleFree: 'Pulsuz 3 Günlük DuoWindo6601 Super',
    titleSubscribed: 'DuoWindo6601 {tier} abunəliyi artıq aktivdir',
    titleExpired: 'DuoWindo6601 Super sınaq müddəti bitdi (3 Gün)',
    titleActive: 'DuoWindo6601 Super: Sınaq Aktivdir',
    titleSkipped: 'Pulsuz 3 Günlük Super buraxıldı',
    titleDeadline: 'Təklif 1 noyabr 2026-cı ildə başa çatdı',
    badgeActive: 'Abunəlik Aktivdir',
    badgeCannotClaim: '3 günlük sınağı əldə etmək mümkün deyil',
    badgeOnce: 'Yalnız bir dəfə mövcuddur',
    badgeTerm: 'Müddət: 3 Gün',
    badgeUntil: '1 noyabr 2026-cı ilə qədər',
    btnClaim: 'Super Əldə Et (3 Gün)',
    btnSkip: 'Təklifi Keç',
    btnReopen: 'Təklifi Qaytar (3 Gün)',
    btnSubscribeSuper: 'Super-ə Abunə Ol',
    btnSubscribeMax: 'Max-a Abunə Ol',
    btnSubscribed: 'Abunə Olundu',
    btnAlreadySubscribed: 'Artıq Abunəsiniz',
    btnTrialExpired: 'Sınaq Bitdi (3 Gün)',
    remainingLabel: 'Qalan vaxt',
    descFree: 'Reklamsız, limitsiz ürək və enerji ilə 3 günlük pulsuz Super-i aktivləşdirin! 1 noyabr 2026-cı ilə qədər yalnız bir dəfə keçərlidir.',
    descSuper: 'Sıfır reklam, limitsiz ürək və enerji, səhvlərin təkrarlanması',
    descMax: 'Super-in bütün üstünlükləri + real vaxt rejimində AI video zəngləri',
    subTitle: 'DuoWindo6601 Super və ya Max Abunəliyi:',
    unlimitedAccess: 'Limitsiz Giriş',
    toastExpired: '⌛ DuoWindo6601 Super 3 günlük pulsuz sınaq müddəti başa çatdı!',
    toastAlreadySubscribed: '🔒 DuoWindo6601 Super və ya Max abunəliyi artıq aktivdir!',
    toastDeadlinePassed: '🛑 Təklif 1 noyabr 2026-cı ildə başa çatdı!',
    toastTrialExpired: '🛑 Sınaq müddəti bitdi (3 gün). Təklif yalnız bir dəfə mövcuddur!',
    toastIncognito: '🔒 Gizli Rejim: 3 günlük Super əldə etmək üçün daimi hesab tələb olunur!',
    toastClaimSuccess: '🎉 Təbriklər! 3 Günlük DuoWindo6601 Super aktiv edildi!',
    toastSkipped: '⏭️ 3 Günlük Super təklifi buraxıldı.',
    dayUnit: 'gün', hourUnit: 'saat', minUnit: 'dəq.', secUnit: 'san.'
  }
};

export const ShopSuperTrialSection: React.FC<ShopSuperTrialSectionProps> = ({
  user,
  setUser,
  playSound,
  setToast,
  upgradeSubscription,
  cancelSubscription,
  onOpenSubscriptionScreen,
  isIncognitoUser,
  STORAGE_KEY,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTestCardsModal, setShowTestCardsModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isProcessingStripe, setIsProcessingStripe] = useState<string | null>(null);

  const isRu = (user.language || 'ru') === 'ru';
  const cLoc = {
    btnCancel: isRu ? 'Отменить подписку' : 'Cancel Subscription',
    btnPortal: isRu ? 'Stripe Portal' : 'Stripe Portal',
    modalTitle: isRu ? 'Отмена подписки DuoWindo6601' : 'Cancel DuoWindo6601 Subscription',
    modalDesc: isRu
      ? 'Вы действительно хотите отменить подписку? После отмены вы перейдете на бесплатный тариф (Free): бесконечные сердца и энергия будут отключены.'
      : 'Are you sure you want to cancel your subscription? You will transition to the Free tier: unlimited hearts and energy will be disabled.',
    confirm: isRu ? 'Да, отменить подписку' : 'Yes, cancel subscription',
    keep: isRu ? 'Оставить подписку' : 'Keep subscription',
    successToast: isRu ? '✅ Подписка успешно отменена' : '✅ Subscription successfully canceled',
    stripeRedirect: isRu ? '💳 Перенаправление в Stripe Checkout...' : '💳 Redirecting to Stripe Checkout...',
    portalRedirect: isRu ? '💳 Открытие личного кабинета Stripe...' : '💳 Opening Stripe Customer Portal...',
  };
  const langKey = user.language || 'ru';
  const loc: TrialLocaleStrings = TRIAL_LOCALES[langKey] || TRIAL_LOCALES['en'] || TRIAL_LOCALES['ru'];

  const deadlineDate = new Date(UNLOCK_DEADLINE_ISO); // November 1, 2026
  const isDeadlinePassed = Date.now() >= deadlineDate.getTime();

  // Calculate if trial is active
  const isTrialActive = Boolean(
    user.hasClaimedSuperTrial &&
    user.superTrialExpiresAt &&
    Date.now() < new Date(user.superTrialExpiresAt).getTime() &&
    user.subscription === 'super'
  );

  // If user ALREADY has a permanent/active subscription to Super or Max (not temporary trial)
  const isAlreadySubscribed = (user.subscription === 'super' || user.subscription === 'max') && !isTrialActive;

  // Calculate if trial expired (either marked expired, or expiresAt in the past)
  const isTrialExpired = Boolean(
    !isAlreadySubscribed && (
      user.superTrialExpired ||
      (user.superTrialExpiresAt && Date.now() >= new Date(user.superTrialExpiresAt).getTime())
    )
  );

  // Calculate if skipped
  const isTrialSkipped = Boolean(!isAlreadySubscribed && user.superTrialSkipped && !user.hasClaimedSuperTrial);

  // Time remaining state for active trial
  const [remainingText, setRemainingText] = useState<string>('');

  useEffect(() => {
    if (!isTrialActive || !user.superTrialExpiresAt) return;

    const updateRemaining = () => {
      const diffMs = new Date(user.superTrialExpiresAt!).getTime() - Date.now();
      if (diffMs <= 0) {
        // Expired right now!
        setUser(prev => {
          const updated: UserProgress = {
            ...prev,
            subscription: prev.subscription === 'super' ? 'free' : prev.subscription,
            superTrialExpired: true,
            infiniteEnergy: false,
            infiniteHearts: false
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
        setToast(loc.toastExpired);
        return;
      }
      const totalSec = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      if (days > 0) {
        setRemainingText(`${days} ${loc.dayUnit} ${hours} ${loc.hourUnit} ${mins} ${loc.minUnit}`);
      } else {
        setRemainingText(`${hours} ${loc.hourUnit} ${mins} ${loc.minUnit} ${secs} ${loc.secUnit}`);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [isTrialActive, user.superTrialExpiresAt, loc, setUser, setToast, STORAGE_KEY]);

  // Handler: Claim Free 3-Day Super Trial
  const handleClaimTrial = () => {
    if (user.subscription === 'super' || user.subscription === 'max') {
      playSound('wrong');
      setToast(loc.toastAlreadySubscribed);
      return;
    }

    if (isDeadlinePassed) {
      playSound('wrong');
      setToast(loc.toastDeadlinePassed);
      return;
    }

    if (user.hasClaimedSuperTrial || isTrialExpired) {
      playSound('wrong');
      setToast(loc.toastTrialExpired);
      return;
    }

    if (isIncognitoUser) {
      playSound('wrong');
      setToast(loc.toastIncognito);
      return;
    }

    const now = new Date();
    const expiresDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

    playSound('fanfare');
    setUser(prev => {
      const updated: UserProgress = {
        ...prev,
        subscription: 'super',
        infiniteEnergy: true,
        infiniteHearts: true,
        hasClaimedSuperTrial: true,
        superTrialClaimedAt: now.toISOString(),
        superTrialExpiresAt: expiresDate.toISOString(),
        superTrialSkipped: false,
        superTrialExpired: false,
        lastFreeSuperClaimDate: now.toDateString(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setToast(loc.toastClaimSuccess);
  };

  // Handler: Skip Free 3-Day Super Trial
  const handleSkipTrial = () => {
    playSound('click');
    setUser(prev => {
      const updated: UserProgress = {
        ...prev,
        superTrialSkipped: true,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setToast(loc.toastSkipped);
  };

  // Handler: Restore/Reconsider if skipped
  const handleReconsiderTrial = () => {
    playSound('click');
    setUser(prev => {
      const updated: UserProgress = {
        ...prev,
        superTrialSkipped: false,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Handler: Confirm Subscription Cancellation (Stripe + local state)
  const handleConfirmCancel = async () => {
    setIsCanceling(true);
    try {
      if (user.stripeSubscriptionId || user.stripeCustomerId) {
        await cancelStripeSubscription({
          subscriptionId: user.stripeSubscriptionId,
          customerId: user.stripeCustomerId,
          email: user.email,
          reason: 'User requested cancellation in Shop section',
        });
      }
    } catch (err) {
      console.warn('Stripe cancellation failed:', err);
    } finally {
      setIsCanceling(false);
    }

    playSound('click');
    const nowIso = new Date().toISOString();
    setUser(prev => {
      const updated: UserProgress = {
        ...prev,
        subscription: 'free',
        infiniteHearts: false,
        infiniteEnergy: false,
        superTrialExpired: true,
        stripeSubscriptionStatus: 'canceled',
        subscriptionCanceledAt: nowIso,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (cancelSubscription) {
      cancelSubscription();
    }
    setToast(cLoc.successToast);
    setShowCancelModal(false);
  };

  const [stripeExternalUrl, setStripeExternalUrl] = useState<string | null>(null);

  // Handler: Initiate Stripe Checkout or instant upgrade fallback
  const handleSubscribeWithStripe = async (tier: SubscriptionTier) => {
    if (isIncognitoUser) {
      playSound('wrong');
      setToast(
        isRu
          ? '🔒 Режим Инкогнито: Подписки DuoWindo6601 Super и Max требуют зарегистрированный аккаунт!'
          : '🔒 Incognito Mode: DuoWindo6601 Super & Max subscriptions require an account registration!'
      );
      return;
    }

    setIsProcessingStripe(tier);
    try {
      const res = await createStripeCheckout({
        tier: tier as 'super' | 'max',
        email: user.email,
        username: user.username || user.name,
      });

      if (res.url) {
        const nav = navigateToStripeUrl(res.url);
        if (!nav.navigated && nav.fallbackUrl) {
          setStripeExternalUrl(nav.fallbackUrl);
        }
        setToast(cLoc.stripeRedirect);
        return;
      }
    } catch (err) {
      console.warn('Stripe checkout redirect failed:', err);
    } finally {
      setIsProcessingStripe(null);
    }

    // Fallback to instant local upgrade
    upgradeSubscription(tier);
  };

  // Handler: Open Stripe Customer Portal
  const handleOpenStripePortal = async () => {
    setToast(cLoc.portalRedirect);
    const res = await openStripePortal({
      customerId: user.stripeCustomerId,
      email: user.email,
    });
    if (res.url) {
      const nav = navigateToStripeUrl(res.url);
      if (!nav.navigated && nav.fallbackUrl) {
        setStripeExternalUrl(nav.fallbackUrl);
      }
    } else {
      setShowCancelModal(true);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-blue-950 border-2 border-purple-500/60 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-left relative overflow-hidden">
      {/* Decorative gradient blur backdrop */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER SECTION */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start space-x-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0 border-2 ${
            isAlreadySubscribed
              ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-amber-500/20'
              : isTrialExpired
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                : isTrialActive
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-400 text-white animate-pulse'
                  : isTrialSkipped
                    ? 'bg-gray-900 border-gray-700 text-gray-400'
                    : 'bg-gradient-to-tr from-purple-500 to-blue-500 border-purple-400 text-white'
          }`}>
            {isAlreadySubscribed ? '👑' : isTrialExpired ? '⌛' : isTrialActive ? '⚡' : isTrialSkipped ? '⏭️' : isDeadlinePassed ? '🛑' : '🎁'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide">
                {isAlreadySubscribed
                  ? loc.titleSubscribed.replace('{tier}', user.subscription === 'max' ? 'Max' : 'Super')
                  : isTrialExpired
                    ? loc.titleExpired
                    : isTrialActive
                      ? loc.titleActive
                      : isTrialSkipped
                        ? loc.titleSkipped
                        : isDeadlinePassed
                          ? loc.titleDeadline
                          : loc.titleFree}
              </h3>

              {/* Status Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {isAlreadySubscribed ? (
                  <>
                    <span className="bg-amber-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-sm">
                      👑 {loc.badgeActive}
                    </span>
                    <span className="bg-rose-950/80 text-rose-300 border border-rose-500/50 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      🔒 {loc.badgeCannotClaim}
                    </span>
                    <span className="bg-purple-500/30 text-purple-200 border border-purple-400/50 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      DuoWindo6601 {user.subscription.toUpperCase()}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="bg-amber-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-sm">
                      {loc.badgeOnce}
                    </span>

                    <span className="bg-purple-500/30 text-purple-200 border border-purple-400/50 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      {loc.badgeTerm}
                    </span>

                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                      isDeadlinePassed
                        ? 'bg-red-950/80 text-red-300 border-red-500/50'
                        : 'bg-blue-500/30 text-blue-200 border-blue-400/50'
                    }`}>
                      {loc.badgeUntil}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Subtitle / Explanation */}
            <p className="text-xs text-purple-200/90 font-medium leading-relaxed max-w-2xl">
              {loc.descFree}
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS (CLAIM / SKIP / STATUS / CANCEL) */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 w-full lg:w-auto">
          {/* User Already Subscribed Pill / Notice + Cancel Option */}
          {isAlreadySubscribed && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-4 py-2.5 rounded-2xl bg-amber-950/70 border-2 border-amber-400/80 text-amber-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg">
                <span>👑</span>
                <span>{loc.btnAlreadySubscribed}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-red-950/80 hover:bg-red-900 border-2 border-red-500/70 text-red-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer hover:border-red-400"
                title="Отменить действующую подписку"
              >
                <span>✕</span>
                <span>{cLoc.btnCancel}</span>
              </button>
              {user.stripeCustomerId && (
                <button
                  type="button"
                  onClick={handleOpenStripePortal}
                  className="px-3.5 py-2.5 rounded-2xl bg-blue-950/80 hover:bg-blue-900 border-2 border-blue-400/70 text-blue-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                  title="Управление в Stripe Portal"
                >
                  <span>💳</span>
                  <span>{cLoc.btnPortal}</span>
                </button>
              )}
            </div>
          )}

          {/* Active Trial Countdown Pill + Cancel Option */}
          {isTrialActive && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-4 py-2.5 rounded-2xl bg-emerald-950/70 border-2 border-emerald-400 text-emerald-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg">
                <span className="animate-spin text-sm">⏱️</span>
                <span>{`${loc.remainingLabel}: ${remainingText || loc.badgeTerm}`}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-red-950/80 hover:bg-red-900 border-2 border-red-500/70 text-red-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer hover:border-red-400"
                title="Отменить пробный период"
              >
                <span>✕</span>
                <span>{cLoc.btnCancel}</span>
              </button>
            </div>
          )}

          {/* Expired Status Pill */}
          {isTrialExpired && (
            <div className="px-5 py-3 rounded-2xl bg-rose-950/70 border-2 border-rose-500/80 text-rose-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg">
              <span>⌛</span>
              <span>{loc.btnTrialExpired}</span>
            </div>
          )}

          {/* Claim Button (only for free users who have not claimed yet and not deadline passed) */}
          {!isAlreadySubscribed && !user.hasClaimedSuperTrial && !isTrialExpired && !isDeadlinePassed && (
            <button
              type="button"
              onClick={handleClaimTrial}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all active:scale-95 border-b-4 border-amber-700 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🎁</span>
              <span>{loc.btnClaim}</span>
            </button>
          )}

          {/* Skip Button (if claimable and not skipped) */}
          {!isAlreadySubscribed && !user.hasClaimedSuperTrial && !isTrialSkipped && !isTrialExpired && !isDeadlinePassed && (
            <button
              type="button"
              onClick={handleSkipTrial}
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all border-b-2 border-gray-900 cursor-pointer text-center"
            >
              {loc.btnSkip}
            </button>
          )}

          {/* Re-activate if skipped */}
          {!isAlreadySubscribed && isTrialSkipped && !user.hasClaimedSuperTrial && !isTrialExpired && !isDeadlinePassed && (
            <button
              type="button"
              onClick={handleReconsiderTrial}
              className="px-5 py-2.5 bg-purple-800/80 hover:bg-purple-700 text-purple-200 font-black text-xs uppercase tracking-wider rounded-2xl transition-all border border-purple-500/50 cursor-pointer text-center"
            >
              {loc.btnReopen}
            </button>
          )}
        </div>
      </div>

      {/* QUICK SUBSCRIPTION SECTION: SUPER VS MAX */}
      <div className="pt-4 border-t border-purple-500/30">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <span className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>⭐</span> {loc.subTitle}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowTestCardsModal(true)}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-amber-400/40 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Открыть список тестовых карт Stripe"
            >
              <span>💳</span>
              <span>{isRu ? 'Тестовые карты Stripe 📋' : 'Stripe Test Cards 📋'}</span>
            </button>
            {onOpenSubscriptionScreen && (
              <button
                type="button"
                onClick={onOpenSubscriptionScreen}
                className="px-3.5 py-1.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl border border-purple-400/50 shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <span>👑</span>
                <span>{isRu ? 'Раздел Тарифы DUOWINDO ↗' : 'Tariffs & Plans ↗'}</span>
              </button>
            )}
            <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
              <span>💳 Stripe</span>
              <span>•</span>
              <span>{loc.unlimitedAccess}</span>
            </span>
          </div>
        </div>

        {stripeExternalUrl && (
          <div className="mb-4 p-4 bg-blue-950/75 border-2 border-blue-400/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-bold text-blue-100">
              {isRu
                ? '💳 Ссылка на оплату Stripe Checkout готова:'
                : '💳 Stripe Checkout link ready:'}
            </span>
            <a
              href={stripeExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-duo-green hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg whitespace-nowrap"
            >
              {isRu ? 'Открыть Stripe Checkout ↗' : 'Open Stripe Checkout ↗'}
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Super Subscription Card */}
          <div className={`bg-black/50 border-2 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all shadow-md ${
            user.subscription === 'super' ? 'border-blue-400 ring-2 ring-blue-500/40' : 'border-blue-500/40 hover:border-blue-500/80'
          }`}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⭐</span>
                  <h4 className="font-extrabold text-sm text-blue-300 uppercase tracking-wide">
                    DuoWindo6601 Super
                  </h4>
                </div>
                {user.subscription === 'super' ? (
                  <span className="bg-blue-500/30 text-blue-200 border border-blue-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    {loc.badgeActive}
                  </span>
                ) : (
                  <span className="text-xs font-black text-white">$9.99/мес</span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-1">
                {loc.descSuper}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
                  🐋 Fish Audio: drama-3, s2.1-pro, s2-pro
                </span>
              </div>
            </div>

            {user.subscription === 'super' ? (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-800/80">
                <div className="px-3 py-2 bg-blue-950/80 text-blue-300 font-black text-xs uppercase tracking-wider rounded-xl border border-blue-500/50 text-center">
                  ✓ {loc.btnSubscribed}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 py-2 bg-red-950/80 hover:bg-red-900 border border-red-500/70 text-red-200 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Отменить подписку"
                >
                  ✕ {cLoc.btnCancel}
                </button>
                {user.stripeCustomerId && (
                  <button
                    type="button"
                    onClick={handleOpenStripePortal}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    title="Stripe Customer Portal"
                  >
                    💳
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-gray-800/80">
                <div className="flex justify-center">
                  <StripeBuyButton
                    buyButtonId={STRIPE_BUY_BUTTON_SUPER}
                    customerEmail={user.email}
                    className="w-full flex justify-center"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSubscribeWithStripe('super')}
                  disabled={isProcessingStripe === 'super'}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer border-b-2 border-blue-800 flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <span>{isProcessingStripe === 'super' ? '⏳' : '💳'}</span>
                  <span>{loc.btnSubscribeSuper} ($9.99)</span>
                </button>
              </div>
            )}
          </div>

          {/* Max Subscription Card */}
          <div className={`bg-black/50 border-2 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all shadow-md ${
            user.subscription === 'max' ? 'border-purple-400 ring-2 ring-purple-500/40' : 'border-purple-500/40 hover:border-purple-500/80'
          }`}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💎</span>
                  <h4 className="font-extrabold text-sm text-purple-300 uppercase tracking-wide">
                    DuoWindo6601 Max
                  </h4>
                </div>
                {user.subscription === 'max' ? (
                  <span className="bg-purple-500/30 text-purple-200 border border-purple-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    {loc.badgeActive}
                  </span>
                ) : (
                  <span className="text-xs font-black text-white">$29.99/мес</span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-1">
                {loc.descMax}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/70 text-purple-200 border border-purple-500/30">
                  🐋 Fish Audio: drama-3, s2.1-pro, s2-pro + s2.1-pro-free
                </span>
              </div>
            </div>

            {user.subscription === 'max' ? (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-800/80">
                <div className="px-3 py-2 bg-purple-950/80 text-purple-300 font-black text-xs uppercase tracking-wider rounded-xl border border-purple-500/50 text-center">
                  ✓ {loc.btnSubscribed}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 py-2 bg-red-950/80 hover:bg-red-900 border border-red-500/70 text-red-200 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Отменить подписку"
                >
                  ✕ {cLoc.btnCancel}
                </button>
                {user.stripeCustomerId && (
                  <button
                    type="button"
                    onClick={handleOpenStripePortal}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    title="Stripe Customer Portal"
                  >
                    💳
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-gray-800/80">
                <div className="flex justify-center">
                  <StripeBuyButton
                    buyButtonId={STRIPE_BUY_BUTTON_MAX}
                    customerEmail={user.email}
                    className="w-full flex justify-center"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSubscribeWithStripe('max')}
                  disabled={isProcessingStripe === 'max'}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer border-b-2 border-purple-800 flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <span>{isProcessingStripe === 'max' ? '⏳' : '💳'}</span>
                  <span>{loc.btnSubscribeMax} ($29.99)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CANCEL SUBSCRIPTION CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border-2 border-red-500/70 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left relative">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/60 flex items-center justify-center text-2xl text-red-400 shrink-0">
                ⚠️
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  {cLoc.modalTitle}
                </h3>
                <p className="text-xs text-red-300 font-medium">
                  {user.subscription === 'max' ? 'DuoWindo6601 Max' : 'DuoWindo6601 Super'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              {cLoc.modalDesc}
            </p>

            <div className="bg-black/50 border border-gray-800 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-gray-400">
                <span>Тариф:</span>
                <span className="font-bold text-white uppercase px-2 py-0.5 bg-purple-900/50 rounded-lg border border-purple-500/40">
                  {user.subscription}
                </span>
              </div>
              {user.stripeSubscriptionId && (
                <div className="flex justify-between items-center text-gray-400">
                  <span>Stripe Sub ID:</span>
                  <span className="font-mono text-[10px] text-blue-300">{user.stripeSubscriptionId}</span>
                </div>
              )}
              <div className="text-[11px] text-amber-300/90 pt-1 border-t border-gray-800/80">
                ⚡ Доступ вернется к обычному бесплатному режиму DuoWindo6601.
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCanceling}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                {cLoc.keep}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCanceling}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer text-center border-b-4 border-red-800 active:border-b-0 active:translate-y-1 shadow-lg disabled:opacity-50"
              >
                {isCanceling ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin text-xs">⏳</span>
                    <span>Отмена...</span>
                  </span>
                ) : (
                  cLoc.confirm
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test cards cheatsheet modal */}
      <StripeTestCardsModal
        isOpen={showTestCardsModal}
        onClose={() => setShowTestCardsModal(false)}
        language={user.language}
        onToast={setToast}
      />
    </div>
  );
};
