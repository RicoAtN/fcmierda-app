export type NotificationType = 'next_game' | 'match_result' | 'drone_video' | 'custom';

export interface NextGameNotificationData {
  opponent?: string;
  date?: string;
  kickoff?: string;
  location?: string;
  note?: string;
  competition?: string;
}

export interface MatchResultNotificationData {
  opponent?: string;
  date?: string;
  gameResult?: string;
  goalsFCMierda?: number | string;
  goalsOpponent?: number | string;
  manOfTheMatch?: string;
}

export interface DroneVideoNotificationData {
  opponent?: string;
  date?: string;
  youtubeUrl?: string;
  title?: string;
}

export interface PushNotificationRequest {
  type: NotificationType;
  title?: string;
  body?: string;
  url?: string;
  nextGameData?: NextGameNotificationData;
  matchResultData?: MatchResultNotificationData;
  droneVideoData?: DroneVideoNotificationData;
}

export interface StoredPushSubscription {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}
