export function getEasternDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getEasternDateTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export function getPregameCheckTimes(gameTimeUtc: string | null | undefined) {
  if (!gameTimeUtc) return [];

  const firstPitch = new Date(gameTimeUtc);
  if (Number.isNaN(firstPitch.getTime())) return [];

  const offsets = [180, 90, 25];
  const now = new Date().getTime();

  return offsets
    .map((minutes) => new Date(firstPitch.getTime() - minutes * 60_000))
    .filter((time) => time.getTime() > now);
}
