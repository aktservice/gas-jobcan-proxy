// backend/@types/global.d.ts

declare var global: {
  [key: string]: any;
};
interface AppError {
  message: string;
  stack?: string;
}
