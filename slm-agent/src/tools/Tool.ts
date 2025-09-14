export interface Tool<TArgs extends Record<string, any> = any, TResult = any> {
  name: string;
  normalizeArgs(args: TArgs): TArgs;     // tool-specific defaults/aliases
  execute(args: TArgs): Promise<TResult>;
}
