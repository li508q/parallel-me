"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  loadProfile,
  loadTaste,
  type MeProfile,
  type Taste,
} from "@/lib/profile";
import { aggregateVoiceOverview } from "@/lib/voices";
import { db, recentMeetings } from "@/lib/db";

export default function MePage() {
  const [profile, setProfile] = useState<MeProfile>({});
  const [taste, setTaste] = useState<Taste>({ books: [], films: [], music: [] });

  useEffect(() => {
    setProfile(loadProfile());
    setTaste(loadTaste());
  }, []);

  const overview = useLiveQuery(() => aggregateVoiceOverview(), []);
  const recent = useLiveQuery(() => recentMeetings(1), []);
  const latest = recent?.[0];

  const profileFilled = !!(profile.nickname || profile.season);
  const tasteFilled =
    (taste.books?.length || 0) +
      (taste.films?.length || 0) +
      (taste.music?.length || 0) >
    0;
  const totalRecords = overview?.totalRecords || 0;
  const hasRecords = totalRecords > 0;

  async function clearLocalData() {
    if (
      !window.confirm(
        "确定要清空这台浏览器里的 ParallelMe 数据吗？\n画像、品味、纸页都会被清掉。这个动作不可撤销。"
      )
    ) {
      return;
    }
    await db.meetings.clear();
    window.localStorage.removeItem("parallelme:profile:v1");
    window.localStorage.removeItem("parallelme:taste:v1");
    window.location.reload();
  }

  return (
    <main className="min-h-screen px-5 sm:px-10 py-12 sm:py-16 max-w-4xl mx-auto font-body">
      <div className="flex items-center justify-between mb-12 gap-3 flex-wrap">
        <Link
          href="/"
          className="font-display text-xs tracking-[0.18em] text-ink3 hover:text-ink uppercase"
        >
          ← 我的声音工作台
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/voices"
            className="font-display text-xs tracking-[0.18em] text-ink3 hover:text-ink uppercase underline-offset-4 hover:underline"
          >
            我的声音 →
          </Link>
          <span className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">
            底片 · ParallelMe
          </span>
        </div>
      </div>

      <section className="mb-16 animate-ink-in">
        <p className="font-display text-base sm:text-lg text-ink3 italic mb-3 leading-relaxed">
          — 像照片之前的样子。被冲洗之前的你。
        </p>
        <h1 className="font-display text-display text-ink mb-6 leading-[1.02]">
          底<span className="scribble">片</span>
        </h1>
        <p className="font-display text-xl sm:text-2xl text-ink2 leading-relaxed max-w-2xl">
          这一页是你自己的。
          <br className="hidden sm:block" />
          五声从这里读你——你越具体，它们越像你。
        </p>
        {profile.nickname && (
          <p className="mt-6 font-display text-lg text-ink2 italic">
            — 你好，{profile.nickname}
            {profile.season ? `，${profile.season}里的你。` : "。"}
          </p>
        )}
      </section>

      <div className="grid sm:grid-cols-2 gap-5 mb-16">
        <Link
          href="/me/taste"
          className="group block bg-paper border-2 border-ink/10 hover:border-ink/30 rounded-2xl p-6 lift"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">
              染色
            </div>
            <span className={`text-xs ${tasteFilled ? "text-money" : "text-ink3"}`}>
              {tasteFilled
                ? `已染色 · ${
                    taste.books.length + taste.films.length + taste.music.length
                  } 件`
                : "未染色"}
            </span>
          </div>
          <div className="font-display text-2xl sm:text-3xl text-ink mb-2 leading-snug">
            你喜欢的，把你
            <br />
            染成你的颜色
          </div>
          {taste.profile?.identity_hint && (
            <div className="mt-4 pt-4 border-t rule">
              <div className="text-xs text-ink3 mb-1">你看起来像——</div>
              <div className="font-display text-lg text-roam italic">
                「{taste.profile.identity_hint}」
              </div>
            </div>
          )}
          {!tasteFilled && (
            <p className="mt-3 text-sm text-ink3 leading-relaxed">
              把 3 本书 / 3 部电影 / 3 首歌写下来，五声就开始懂你 →
            </p>
          )}
        </Link>

        <Link
          href="/me/edit"
          className="group block bg-paper border-2 border-ink/10 hover:border-ink/30 rounded-2xl p-6 lift"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">
              我是
            </div>
            <span className={`text-xs ${profileFilled ? "text-money" : "text-ink3"}`}>
              {profileFilled ? "已填" : "未填"}
            </span>
          </div>
          <div className="font-display text-2xl sm:text-3xl text-ink mb-2 leading-snug">
            三句话
            <br />
            告诉它们你是谁
          </div>
          {profile.season && (
            <p className="mt-3 text-sm text-ink2 italic">— {profile.season}</p>
          )}
          {!profileFilled && (
            <p className="mt-3 text-sm text-ink3 leading-relaxed">
              不上传服务器，只在这里。越具体，五声回应越精准 →
            </p>
          )}
        </Link>

        <Link
          href="/me/pages"
          className="group block bg-paper border-2 border-ink/10 hover:border-ink/30 rounded-2xl p-6 lift"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">
              纸页
            </div>
            <span className={`text-xs ${hasRecords ? "text-money" : "text-ink3"}`}>
              {hasRecords ? `${totalRecords} 次` : "0 次"}
            </span>
          </div>
          <div className="font-display text-2xl sm:text-3xl text-ink mb-2 leading-snug">
            你和五声
            <br />
            聊清楚的事
          </div>
          {latest && (
            <div className="mt-4 pt-4 border-t rule">
              <div className="text-xs text-ink3 mb-1">最近一次</div>
              <div className="font-display text-lg text-ink2 italic">
                「{latest.clarity?.clarity_sentence || latest.task_frame?.visible.problem_definition || latest.raw_input}」
              </div>
            </div>
          )}
          {!hasRecords && (
            <p className="mt-3 text-sm text-ink3 leading-relaxed">
              每次五声圆桌结束后，清明句和 24h 承诺会留成一页 →
            </p>
          )}
        </Link>

        <Link
          href="/me/insights"
          className="group block bg-paper border-2 border-ink/10 hover:border-ink/30 rounded-2xl p-6 lift"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-xs tracking-[0.18em] text-ink3 uppercase">
              自照
            </div>
            <span className="text-xs text-ink3">
              {totalRecords >= 3 ? "可看" : `还差 ${Math.max(0, 3 - totalRecords)} 次`}
            </span>
          </div>
          <div className="font-display text-2xl sm:text-3xl text-ink mb-2 leading-snug">
            看看你
            <br />
            这段时间的声音
          </div>
          <p className="mt-3 text-sm text-ink3 leading-relaxed">
            五声圆桌 3 次以上，这里会整理最常出现、最少被主动叫出的声音 →
          </p>
        </Link>
      </div>

      <div className="border-t rule pt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-ink3">
        <div>
          <div>所有数据存在你的浏览器本地，不上传任何服务器。</div>
          <div className="mt-1">不发推送，不要账号，不打扰。</div>
        </div>
        <button
          onClick={clearLocalData}
          className="text-xs text-ink3 hover:text-filial underline-offset-4 hover:underline"
        >
          忘掉我（清空本地数据）
        </button>
      </div>
    </main>
  );
}
