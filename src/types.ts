export interface ShowroomRoom {
  id: number;
  name: string;
  url_key: string;
  image_url: string;
  description: string;
  follower_num: number;
  is_live: boolean;
  is_party: boolean;
  next_live_schedule: number;
}

export interface ShowroomRankingItem {
  room_id: number;
  rank: number;
  score: number;
  order_no: number;
  room: ShowroomRoom;
  unchangedMinutes?: number; // 何分間このスコアが継続しているか
  lastScoreChangedAt?: number; // 最終スコア変動時刻 (UNIX ms)
}

export interface ShowroomGiftRankingResponse {
  total_score: number;
  ranking_list: ShowroomRankingItem[];
}

export interface ScoreHistorySnapshot {
  timestamp: number; // スコアがこの値になった時刻 (JST)
  lastCheckedTimestamp: number; // 最後に同一スコアを確認した時刻
  timeLabel: string; // 開始JST時刻 "14:26"
  lastTimeLabel: string; // 最新JST時刻 "14:35"
  unchangedMinutes: number; // 同一スコアの継続分数 (例: 10)
  scores: Record<number, number>; // roomId -> score
  names: Record<number, string>;  // roomId -> name
  ranks: Record<number, number>;  // roomId -> rank
}

export interface RoomDurationInfo {
  roomId: number;
  lastChangedTimestamp: number;
  unchangedMinutes: number;
}

export interface EventStatusInfo {
  isEventEnded: boolean;
  isEventFrozen: boolean;
  isFinalResult: boolean;
  eventEndTime: number;
  eventFreezeTime: number;
}
