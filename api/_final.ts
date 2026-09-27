// 最終結果 API のレスポンス本体。Vercel Functions (api/*.ts) とローカルの server.ts で共有する。
import { FINAL_CONFIRMED_DATA, FINAL_HISTORY_DATA } from '../src/data/finalArchive';

export function healthBody() {
  return {
    status: 'ok',
    mode: 'archived_final',
    isEventEnded: true,
    isEventFrozen: true,
    isFinalResult: true,
    timestamp: Date.now(),
  };
}

export function rankingBody() {
  return {
    ...FINAL_CONFIRMED_DATA,
    isEventEnded: true,
    isEventFrozen: true,
    isFinalResult: true,
    apiStopped: true,
    dbDeleted: true,
    message: 'イベント終了・最終結果確定済み（外部API停止・データベース削除完了）',
  };
}

export function historyBody() {
  return {
    history: FINAL_HISTORY_DATA,
    count: FINAL_HISTORY_DATA.length,
    isFinalResult: true,
  };
}
