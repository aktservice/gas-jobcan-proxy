// backend/@types/global.d.ts

/** GAS実行環境のグローバルオブジェクト。main.tsでトリガー関数を生やすために使用 */
declare var global: {
  [key: string]: any;
};

/** アプリ内で扱うエラー情報 */
interface AppError {
  message: string;
  stack?: string;
}
