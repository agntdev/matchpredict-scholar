import type { StorageAdapter } from "grammy";
import { defaultRedisStorage } from "./toolkit/index.js";

export type SportType = "football" | "basketball" | "tennis" | "ice_hockey";

export interface MatchRecord {
  id: string;
  teams_players: string;
  datetime: string;
  competition: string;
  venue: string;
  sport_type: SportType;
}

export interface PredictionRecord {
  match_id: string;
  outcome_probabilities: string;
  total_probabilities: string;
  scorer_probabilities: string;
  confidence_score: number;
  timestamp: string;
  model_version: string;
  features?: string[];
}

export interface HistoricalRecord {
  match_id: string;
  final_scores: string;
  events: string;
  datetime: string;
}

export interface UserRecord {
  telegram_id: number;
  subscription_status: boolean;
  digest_time: string;
  request_logs: string[];
}

export interface Settings {
  digestTime: string;
  digestLimit: number;
  adminNotifications: boolean;
}

/** One injectable clock seam for all research timestamps and day calculations. */
export let now: () => Date = () => new Date();
export function setNowForTests(clock: () => Date): void {
  now = clock;
}

let adapter: StorageAdapter<unknown> | undefined;

function storage(): StorageAdapter<unknown> | undefined {
  if (adapter) return adapter;
  const url = typeof process === "undefined" ? undefined : process.env.REDIS_URL;
  if (!url) return undefined;
  adapter = defaultRedisStorage<unknown>(url);
  return adapter;
}

async function read<T>(key: string): Promise<T | undefined> {
  return storage()?.read(key) as Promise<T | undefined> | undefined;
}

async function write<T>(key: string, value: T): Promise<boolean> {
  const store = storage();
  if (!store) return false;
  await store.write(key, value);
  return true;
}

export function persistenceReady(): boolean {
  return storage() !== undefined;
}

export async function getSettings(): Promise<Settings | undefined> {
  return read<Settings>("research:settings");
}

export async function saveSettings(settings: Settings): Promise<boolean> {
  return write("research:settings", settings);
}

export async function getUser(userId: number): Promise<UserRecord | undefined> {
  return read<UserRecord>(`research:user:${userId}`);
}

export async function updateSubscription(userId: number, subscribed: boolean): Promise<boolean> {
  const settings = (await getSettings()) ?? {
    digestTime: "09:00",
    digestLimit: 5,
    adminNotifications: false,
  };
  const existing = await getUser(userId);
  const user: UserRecord = {
    telegram_id: userId,
    subscription_status: subscribed,
    digest_time: existing?.digest_time ?? settings.digestTime,
    request_logs: existing?.request_logs ?? [],
  };
  if (!(await write(`research:user:${userId}`, user))) return false;
  const index = (await read<number[]>("research:subscribers")) ?? [];
  const next = subscribed
    ? [...new Set([...index, userId])]
    : index.filter((id) => id !== userId);
  return write("research:subscribers", next);
}

export async function logRequest(userId: number, action: string): Promise<void> {
  const user = await getUser(userId);
  if (!user) return;
  user.request_logs = [...user.request_logs, `${now().toISOString()} ${action}`].slice(-100);
  await write(`research:user:${userId}`, user);
}

export async function matchWithPrediction(matchId: string): Promise<{
  match: MatchRecord;
  prediction: PredictionRecord;
} | undefined> {
  const [match, prediction] = await Promise.all([
    read<MatchRecord>(`research:match:${matchId}`),
    read<PredictionRecord>(`research:prediction:${matchId}`),
  ]);
  return match && prediction ? { match, prediction } : undefined;
}

export async function historyFor(kind: "team" | "player" | "match", query: string): Promise<HistoricalRecord[]> {
  const ids =
    kind === "match"
      ? [query]
      : (await read<string[]>(`research:history-index:${kind}:${query.toLowerCase()}`)) ?? [];
  const records = await Promise.all(ids.slice(0, 30).map((id) => read<HistoricalRecord>(`research:history:${id}`)));
  return records.filter((record): record is HistoricalRecord => record !== undefined);
}

export async function dailyPredictions(day: string, limit: number): Promise<Array<{ match: MatchRecord; prediction: PredictionRecord }>> {
  const ids = (await read<string[]>(`research:day-index:${day}`)) ?? [];
  const values = await Promise.all(ids.slice(0, Math.max(1, limit)).map(matchWithPrediction));
  return values.filter((value): value is { match: MatchRecord; prediction: PredictionRecord } => value !== undefined);
}

export async function subscriberIds(): Promise<number[]> {
  return (await read<number[]>("research:subscribers")) ?? [];
}

export async function logDigestDelivery(day: string, delivered: number, failed: number): Promise<void> {
  await write(`research:digest-delivery:${day}`, { timestamp: now().toISOString(), delivered, failed });
}

export function utcDay(): string {
  return now().toISOString().slice(0, 10);
}

export function formatPrediction(item: { match: MatchRecord; prediction: PredictionRecord }): string {
  const { match, prediction } = item;
  return `${match.teams_players}\n${match.competition} · ${match.datetime}\n\nOutcome probabilities: ${prediction.outcome_probabilities}\nTotals: ${prediction.total_probabilities}\nScorers: ${prediction.scorer_probabilities}\nConfidence: ${prediction.confidence_score}%\nModel version: ${prediction.model_version}`;
}
