import React from 'react';
import { Trophy, Crown, Medal, ExternalLink, Sparkles, Award } from 'lucide-react';
import { ShowroomRankingItem } from '../types';

interface FinalPodiumProps {
  topItems: ShowroomRankingItem[];
}

export const FinalPodium: React.FC<FinalPodiumProps> = ({ topItems }) => {
  const first = topItems.find((i) => i.rank === 1);
  const second = topItems.find((i) => i.rank === 2);
  const third = topItems.find((i) => i.rank === 3);

  if (!first) return null;

  const diff1to2 = second ? first.score - second.score : null;
  const diff2to3 = second && third ? second.score - third.score : null;

  return (
    <section
      id="final-podium"
      aria-label="最終結果 表彰台"
      className="bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white rounded-2xl p-5 sm:p-8 shadow-xl border border-indigo-500/30 overflow-hidden relative"
    >
      {/* Background ambient decorative glows */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header title */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold tracking-wide uppercase shadow-inner mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>イベント終了 ・ 最終確定結果 (FINAL RESULTS)</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-100 tracking-tight">
          TOP 3 表彰台
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg mx-auto">
          2026年9月24日 22:00 終了（22:01 確定）。激戦を戦い抜いた上位メンバーの栄誉を称えます！
        </p>
      </div>

      {/* Podium Cards Grid (Desktop: 2nd -> 1st -> 3rd) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-end relative z-10 max-w-4xl mx-auto">
        {/* 2nd Place (Left on desktop) */}
        {second && (
          <div className="order-2 md:order-1 flex flex-col items-center">
            <div className="w-full bg-slate-800/90 backdrop-blur-md rounded-2xl p-5 border border-slate-600/50 shadow-lg text-center flex flex-col items-center hover:border-slate-400 transition-all">
              <div className="relative mb-3">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-slate-400/80 shadow-md bg-slate-700">
                  <img
                    src={second.room.image_url}
                    alt={second.room.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-300 text-slate-900 flex items-center justify-center font-black text-sm shadow-md border-2 border-slate-800">
                  2
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-700/80 text-slate-200 border border-slate-500/50 mb-2">
                <Medal className="w-3.5 h-3.5 text-slate-300" />
                第2位 (準優勝)
              </span>

              <h3 className="font-bold text-sm sm:text-base text-slate-100 line-clamp-1 hover:text-white">
                <a
                  href={`https://www.showroom-live.com/r/${second.room.url_key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline inline-flex items-center gap-1"
                >
                  {second.room.name}
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </h3>

              <div className="mt-3 w-full bg-slate-900/70 rounded-xl p-2.5 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">最終確定ポイント</span>
                <div className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                  {second.score.toLocaleString()}
                  <span className="text-xs font-normal text-slate-400 ml-1">pt</span>
                </div>
                {diff1to2 !== null && (
                  <div className="text-[11px] text-slate-400 mt-1 font-medium">
                    1位との差: -{diff1to2.toLocaleString()} pt
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 1st Place (Center, Elevated & Shining) */}
        {first && (
          <div className="order-1 md:order-2 flex flex-col items-center md:-mt-6">
            <div className="w-full bg-gradient-to-b from-amber-500/20 via-slate-800/95 to-slate-900 rounded-2xl p-6 sm:p-7 border-2 border-amber-400 shadow-2xl text-center flex flex-col items-center relative overflow-hidden ring-4 ring-amber-400/20">
              {/* Crown Icon floating above */}
              <div className="w-12 h-12 -mt-2 mb-2 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center text-amber-950 shadow-lg animate-bounce">
                <Crown className="w-7 h-7 fill-amber-900 text-amber-950" />
              </div>

              <div className="relative mb-3">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-amber-400 shadow-xl bg-amber-950/40">
                  <img
                    src={first.room.image_url}
                    alt={first.room.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-950 flex items-center justify-center font-black text-base shadow-lg border-2 border-slate-900">
                  1
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-amber-400 text-amber-950 shadow-md mb-2">
                <Trophy className="w-3.5 h-3.5 fill-amber-950" />
                第1位 (優勝)
              </span>

              <h3 className="font-extrabold text-base sm:text-lg text-white line-clamp-1">
                <a
                  href={`https://www.showroom-live.com/r/${first.room.url_key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-amber-200 inline-flex items-center gap-1"
                >
                  {first.room.name}
                  <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                </a>
              </h3>

              <div className="mt-3.5 w-full bg-amber-950/40 rounded-xl p-3 border border-amber-500/40 shadow-inner">
                <span className="text-[11px] text-amber-300 uppercase font-bold tracking-wider">
                  最終確定ポイント
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight mt-0.5">
                  {first.score.toLocaleString()}
                  <span className="text-sm font-semibold text-amber-200 ml-1">pt</span>
                </div>
                <div className="text-[11px] text-amber-200/90 mt-1 font-semibold">
                  👑 イベント勝者
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3rd Place (Right on desktop) */}
        {third && (
          <div className="order-3 flex flex-col items-center">
            <div className="w-full bg-slate-800/90 backdrop-blur-md rounded-2xl p-5 border border-amber-800/40 shadow-lg text-center flex flex-col items-center hover:border-amber-700/60 transition-all">
              <div className="relative mb-3">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-amber-700/80 shadow-md bg-slate-700">
                  <img
                    src={third.room.image_url}
                    alt={third.room.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center font-black text-sm shadow-md border-2 border-slate-800">
                  3
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60 mb-2">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                第3位 (入賞)
              </span>

              <h3 className="font-bold text-sm sm:text-base text-slate-100 line-clamp-1 hover:text-white">
                <a
                  href={`https://www.showroom-live.com/r/${third.room.url_key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline inline-flex items-center gap-1"
                >
                  {third.room.name}
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </h3>

              <div className="mt-3 w-full bg-slate-900/70 rounded-xl p-2.5 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">最終確定ポイント</span>
                <div className="text-xl sm:text-2xl font-black text-amber-200/90 tracking-tight">
                  {third.score.toLocaleString()}
                  <span className="text-xs font-normal text-slate-400 ml-1">pt</span>
                </div>
                {diff2to3 !== null && (
                  <div className="text-[11px] text-slate-400 mt-1 font-medium">
                    2位との差: -{diff2to3.toLocaleString()} pt
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
