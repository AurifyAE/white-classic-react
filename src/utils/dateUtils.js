export const getGSTTime = () => {
  return new Date().toLocaleString("en-US", {
    weekday: "short",    // Sat
    year: "numeric",     // 2025
    month: "short",      // Aug
    day: "2-digit",      // 09
    hour: "2-digit",     // 09
    minute: "2-digit",   // 30
    second: "2-digit",   // 15
    hour12: true,
    timeZone: "Asia/Dubai"
  }) + " GST";
};
