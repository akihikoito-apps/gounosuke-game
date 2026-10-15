// 「あたらしく なったよ」：アプリを更新したあと、増えた物を1回だけ知らせる（通信はしない。中身はアプリに同梱）。
// 新しい版を出すときは、CONTENT_VERSION を1つ上げ、NEWS の先頭に足す。
export const CONTENT_VERSION = 4;

export interface News {
  version: number;
  /** 子ども向けの短い文（ひらがな中心） */
  lines: string[];
}

export const NEWS: News[] = [
  { version: 4, lines: ['「ほたるの かわべ」の パックが できたよ', 'あたらしい ともだち「ひか」と ほたるの えんがわが ふえたよ'] },
  { version: 3, lines: ['おうちの ひとと パックが えらべるよ', 'うみべに デッキの へやが ふえたよ', 'へやの ともだちを タップで おひっこし できるよ'] },
  { version: 2, lines: ['じぶんの へやで あそべるよ', 'コースに うごく ともだちが でるよ', 'あそびかた の ボタンが ふえたよ'] },
];

/** 前に見た版より新しい知らせ（はじめて入れた人には出さない：lastSeen が無いとき） */
export function newsSince(lastSeen: number | undefined): News[] {
  if (lastSeen === undefined) return [];
  return NEWS.filter((n) => n.version > lastSeen);
}
