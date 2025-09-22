export const logger = {
  info:  (o?: any, m?: string) => console.log(m ?? "", o ?? ""),
  warn:  (o?: any, m?: string) => console.warn(m ?? "", o ?? ""),
  error: (o?: any, m?: string) => console.error(m ?? "", o ?? ""),
  child: () => ({
    info:  (o?: any, m?: string) => console.log(m ?? "", o ?? ""),
    warn:  (o?: any, m?: string) => console.warn(m ?? "", o ?? ""),
    error: (o?: any, m?: string) => console.error(m ?? "", o ?? "")
  })
}
