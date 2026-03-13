import { getUserProfile, UserProfile, UserRank, calculateUserGamification } from './user-profile';
import { sendNotificationAction } from '@/app/actions/notifications';
import { db } from './firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export type NotificationType = 'welcome' | 'purchase_success' | 'rank_up' | 'reminder' | 'market_opportunity' | 'gold_alert';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: any; // Timestamp or date string
  data?: any;
}

// Simple translation maps for notifications (client-safe)
const NOTIFICATION_TITLES: Record<string, Record<NotificationType, string>> = {
  en: {
    welcome: 'Welcome to AlbionKit!',
    purchase_success: 'Subscription Active',
    rank_up: 'Rank Up!',
    reminder: 'Reminder',
    market_opportunity: 'Market Alert 🔔',
    gold_alert: 'Gold Price Alert 💰'
  },
  tr: {
    welcome: 'AlbionKit\'e Hoşgeldiniz!',
    purchase_success: 'Abonelik Aktif',
    rank_up: 'Rütbe Atladın!',
    reminder: 'Hatırlatıcı',
    market_opportunity: 'Piyasa Uyarısı 🔔',
    gold_alert: 'Altın Fiyat Uyarısı 💰'
  },
  de: {
    welcome: 'Willkommen bei AlbionKit!',
    purchase_success: 'Abonnement Aktiv',
    rank_up: 'Rang Aufgestiegen!',
    reminder: 'Erinnerung',
    market_opportunity: 'Marktalarm 🔔',
    gold_alert: 'Goldpreis-Alarm 💰'
  },
  es: {
    welcome: '¡Bienvenido a AlbionKit!',
    purchase_success: 'Suscripción Activa',
    rank_up: '¡Rango Ascendido!',
    reminder: 'Recordatorio',
    market_opportunity: 'Alerta de Mercado 🔔',
    gold_alert: 'Alerta de Precio del Oro 💰'
  },
  fr: {
    welcome: 'Bienvenue sur AlbionKit !',
    purchase_success: 'Abonnement Actif',
    rank_up: 'Rang Supérieur !',
    reminder: 'Rappel',
    market_opportunity: 'Alerte Marché 🔔',
    gold_alert: 'Alerte Prix Or 💰'
  },
  ko: {
    welcome: 'AlbionKit 에 오신 것을 환영합니다!',
    purchase_success: '구독 활성화됨',
    rank_up: '랭크 업!',
    reminder: '알림',
    market_opportunity: '시장 알림 🔔',
    gold_alert: '골드 가격 알림 💰'
  },
  pl: {
    welcome: 'Witaj w AlbionKit!',
    purchase_success: 'Subskrypcja Aktywna',
    rank_up: 'Awans Rangi!',
    reminder: 'Przypomnienie',
    market_opportunity: 'Alert Rynkowy 🔔',
    gold_alert: 'Alert Ceny Złota 💰'
  },
  pt: {
    welcome: 'Bem-vindo ao AlbionKit!',
    purchase_success: 'Assinatura Ativa',
    rank_up: 'Rank Elevado!',
    reminder: 'Lembrete',
    market_opportunity: 'Alerta de Mercado 🔔',
    gold_alert: 'Alerta de Preço do Ouro 💰'
  },
  ru: {
    welcome: 'Добро пожаловать в AlbionKit!',
    purchase_success: 'Подписка Активна',
    rank_up: 'Повышение Ранга!',
    reminder: 'Напоминание',
    market_opportunity: 'Рыночное Оповещение 🔔',
    gold_alert: 'Оповещение о Цене Золота 💰'
  },
  zh: {
    welcome: '欢迎使用 AlbionKit！',
    purchase_success: '订阅已激活',
    rank_up: '等级提升！',
    reminder: '提醒',
    market_opportunity: '市场警报 🔔',
    gold_alert: '金币价格警报 💰'
  }
};

const NOTIFICATION_MESSAGES: Record<string, Record<NotificationType, string | ((data?: any) => string)>> = {
  en: {
    welcome: 'Thanks for joining! Explore our tools to get started.',
    purchase_success: 'Thank you for your support! You now have access to premium features.',
    rank_up: (data?: any) => `Congratulations! You have reached ${data?.newRank || 'a new'} rank.`,
    reminder: (data?: any) => data?.message || 'Here is your reminder.',
    market_opportunity: (data?: any) => data?.isWatchlist
      ? `Profitable flips detected for ${data.items[0].name}${data.items.length > 1 ? ` and ${data.items.length - 1} more` : ''} on your watchlist!`
      : 'A high-profit market flip opportunity has been detected!',
    gold_alert: (data?: any) => `The Gold price is ${data?.change > 0 ? 'rising' : 'dropping'}! Current: ${data?.currentPrice.toLocaleString()} Silver.`
  },
  tr: {
    welcome: 'Katıldığınız için teşekkürler! Başlamak için araçlarımızı keşfedin.',
    purchase_success: 'Desteğiniz için teşekkürler! Artık premium özelliklere erişiminiz var.',
    rank_up: (data?: any) => `Tebrikler! ${data?.newRank || 'yeni'} rütbesine ulaştınız.`,
    reminder: (data?: any) => data?.message || 'İşte hatırlatıcınız.',
    market_opportunity: (data?: any) => data?.isWatchlist
      ? `İzleme listenizde ${data.items[0].name}${data.items.length > 1 ? ` ve ${data.items.length - 1} daha fazla` : ''} için karlı al-sat fırsatları tespit edildi!`
      : 'Yüksek karlı bir piyasa al-sat fırsatı tespit edildi!',
    gold_alert: (data?: any) => `Altın fiyatı ${data?.change > 0 ? 'yükseliyor' : 'düşüyor'}! Güncel: ${data?.currentPrice.toLocaleString()} Gümüş.`
  },
  de: {
    welcome: 'Danke fürs Beitreten! Entdecke unsere Tools, um loszulegen.',
    purchase_success: 'Danke für deine Unterstützung! Du hast jetzt Zugang zu Premium-Funktionen.',
    rank_up: (data?: any) => `Glückwunsch! Du hast den Rang ${data?.newRank || 'einen neuen'} erreicht.`,
    reminder: (data?: any) => data?.message || 'Hier ist deine Erinnerung.',
    market_opportunity: (data?: any) => data?.isWatchlist
      ? `Profitable Flips erkannt für ${data.items[0].name}${data.items.length > 1 ? ` und ${data.items.length - 1} weitere` : ''} auf deiner Watchlist!`
      : 'Eine hochprofitable Markt-Flip-Möglichkeit wurde erkannt!',
    gold_alert: (data?: any) => `Der Goldpreis ${data?.change > 0 ? 'steigt' : 'fällt'}! Aktuell: ${data?.currentPrice.toLocaleString()} Silber.`
  },
  es: {
    welcome: '¡Gracias por unirte! Explora nuestras herramientas para comenzar.',
    purchase_success: '¡Gracias por tu apoyo! Ahora tienes acceso a funciones premium.',
    rank_up: (data?: any) => `¡Felicitaciones! Has alcanzado el rango ${data?.newRank || 'nuevo'}.`,
    reminder: (data?: any) => data?.message || 'Aquí está tu recordatorio.',
    market_opportunity: (data?: any) => data?.isWatchlist
      ? `¡Oportunidades rentables detectadas para ${data.items[0].name}${data.items.length > 1 ? ` y ${data.items.length - 1} más` : ''} en tu lista!`
      : '¡Se detectó una oportunidad de flip de mercado muy rentable!',
    gold_alert: (data?: any) => `¡El precio del oro está ${data?.change > 0 ? 'subiendo' : 'bajando'}! Actual: ${data?.currentPrice.toLocaleString()} de plata.`
  },
  fr: {
    welcome: 'Merci de vous être joint ! Explorez nos outils pour commencer.',
    purchase_success: 'Merci pour votre soutien ! Vous avez maintenant accès aux fonctionnalités premium.',
    rank_up: (data?: any) => `Félicitations ! Vous avez atteint le rang ${data?.newRank || 'nouveau'}.`,
    reminder: (data?: any) => data?.message || 'Voici votre rappel.',
    market_opportunity: (data?: any) => data?.isWatchlist
      ? `Opportunités rentables détectées pour ${data.items[0].name}${data.items.length > 1 ? ` et ${data.items.length - 1} autres` : ''} dans votre liste !`
      : 'Une opportunité de flip de marché très rentable a été détectée !',
    gold_alert: (data?: any) => `Le prix de l'or ${data?.change > 0 ? 'monte' : 'descend'} ! Actuel : ${data?.currentPrice.toLocaleString()} d\'argent.`
  },
  ko: {
    welcome: '가입해 주셔서 감사합니다! 도구를 탐색하여 시작하세요.',
    purchase_success: '지원해 주셔서 감사합니다! 이제 프리미엄 기능에 액세스할 수 있습니다.',
    rank_up: (data?: any) => `축하합니다! ${data?.newRank || '새로운'} 랭크에 도달했습니다.`,
    reminder: (data?: any) => data?.message || '알림입니다.',
    market_opportunity: (data?: any) => data?.isWatchlist
      ? `감시 목록에서 ${data.items[0].name}${data.items.length > 1 ? ` 외 ${data.items.length - 1} 개 항목` : ''} 에 대한 수익성 있는 플립이 감지되었습니다!`
      : '수익성 높은 시장 플립 기회가 감지되었습니다!',
    gold_alert: (data?: any) => `골드 가격이 ${data?.change > 0 ? '상승' : '하락'} 중입니다! 현재: ${data?.currentPrice.toLocaleString()} 실버.`
  },
  pl: {
    welcome: 'Dzięki za dołączenie! Poznaj nasze narzędzia, aby zacząć.',
    purchase_success: 'Dzięki za wsparcie! Masz teraz dostęp do funkcji premium.',
    rank_up: (data?: any) => `Gratulacje! Osiągnąłeś rangę ${data?.newRank || 'nową'}.`,
    reminder: (data?: any) => data?.message || 'Oto twoje przypomnienie.',
    market_opportunity: (data?: any) => data?.isWatchlist
      ? `Wykryto dochodowe flipy dla ${data.items[0].name}${data.items.length > 1 ? ` i ${data.items.length - 1} innych` : ''} na twojej liście!`
      : 'Wykryto bardzo dochodową okazję rynkową!',
    gold_alert: (data?: any) => `Cena złota ${data?.change > 0 ? 'rośnie' : 'spada'}! Obecnie: ${data?.currentPrice.toLocaleString()} srebra.`
  },
  pt: {
    welcome: 'Obrigado por se juntar! Explore nossas ferramentas para começar.',
    purchase_success: 'Obrigado pelo seu apoio! Agora você tem acesso a recursos premium.',
    rank_up: (data?: any) => `Parabéns! Você alcançou o rank ${data?.newRank || 'novo'}.`,
    reminder: (data?: any) => data?.message || 'Aqui está o seu lembrete.',
    market_opportunity: (data?: any) => data?.isWatchlist
      ? `Oportunidades rentáveis detectadas para ${data.items[0].name}${data.items.length > 1 ? ` e mais ${data.items.length - 1}` : ''} na sua lista!`
      : 'Uma oportunidade de flip de mercado muito rentável foi detectada!',
    gold_alert: (data?: any) => `O preço do ouro está ${data?.change > 0 ? 'subindo' : 'caindo'}! Atual: ${data?.currentPrice.toLocaleString()} de prata.`
  },
  ru: {
    welcome: 'Спасибо за присоединение! Изучите наши инструменты, чтобы начать.',
    purchase_success: 'Спасибо за вашу поддержку! Теперь у вас есть доступ к премиум-функциям.',
    rank_up: (data?: any) => `Поздравляем! Вы достигли ранга ${data?.newRank || 'нового'}.`,
    reminder: (data?: any) => data?.message || 'Вот ваше напоминание.',
    market_opportunity: (data?: any) => data?.isWatchlist
      ? `Обнаружены прибыльные флипы для ${data.items[0].name}${data.items.length > 1 ? ` и ещё ${data.items.length - 1}` : ''} в вашем списке!`
      : 'Обнаружена очень прибыльная рыночная возможность!',
    gold_alert: (data?: any) => `Цена золота ${data?.change > 0 ? 'растёт' : 'падает'}! Текущая: ${data?.currentPrice.toLocaleString()} серебра.`
  },
  zh: {
    welcome: '感谢加入！探索我们的工具以开始使用。',
    purchase_success: '感谢您的支持！您现在可以访问高级功能。',
    rank_up: (data?: any) => `恭喜！您已达到 ${data?.newRank || '新'} 等级。`,
    reminder: (data?: any) => data?.message || '这是您的提醒。',
    market_opportunity: (data?: any) => data?.isWatchlist
      ? `在您的监视列表中检测到 ${data.items[0].name}${data.items.length > 1 ? ` 和其他 ${data.items.length - 1} 个物品` : ''} 的盈利机会！`
      : '检测到高利润的市场翻转机会！',
    gold_alert: (data?: any) => `金币价格正在${data?.change > 0 ? '上涨' : '下跌'}！当前：${data?.currentPrice.toLocaleString()} 银币。`
  }
};

export async function notifyUser(userId: string, type: NotificationType, data?: any, email?: string) {
  try {
    // 1. Send Email (via Server Action) - handles locale internally
    sendNotificationAction(userId, type, data, email).catch(err => console.error('Error sending email notification:', err));

    // 2. Create In-App Notification with locale-based translations
    // Fetch user's locale first
    const userDoc = await getDoc(doc(db, 'users', userId));
    const locale = userDoc.data()?.locale || 'en';
    
    // Get translations for user's locale (fallback to English)
    const titles = NOTIFICATION_TITLES[locale] || NOTIFICATION_TITLES.en;
    const messages = NOTIFICATION_MESSAGES[locale] || NOTIFICATION_MESSAGES.en;

    const title = titles[type];
    const messageRaw = messages[type];
    const message = typeof messageRaw === 'function' ? messageRaw(data) : messageRaw;

    await addDoc(collection(db, 'users', userId, 'notifications'), {
      type,
      title,
      message,
      isRead: false,
      createdAt: serverTimestamp(),
      data: data || {}
    });

  } catch (error) {
    console.error('Error notifying user:', error);
  }
}

export async function checkAndNotifyRankUp(userId: string, builds: any[]) {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return;

    const { rank: currentRank } = calculateUserGamification(profile, builds);
    const lastRank = profile.preferences?.lastNotifiedRank as UserRank | undefined;

    // Rank hierarchy
    const ranks: UserRank[] = ['Wanderer', 'Novice', 'Journeyman', 'Adept', 'Expert', 'Master', 'Grandmaster'];
    const currentRankIndex = ranks.indexOf(currentRank);
    const lastRankIndex = lastRank ? ranks.indexOf(lastRank) : -1;

    // Only notify if rank has INCREASED and we haven't notified for this rank yet
    if (currentRankIndex > lastRankIndex) {
      console.log(`User ${userId} ranked up to ${currentRank}`);
      
      // Update lastNotifiedRank FIRST to prevent duplicate notifications
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'preferences.lastNotifiedRank': currentRank
      });

      // Notify
      await notifyUser(userId, 'rank_up', { newRank: currentRank });
    }
  } catch (error) {
    console.error('Error checking rank up:', error);
  }
}
