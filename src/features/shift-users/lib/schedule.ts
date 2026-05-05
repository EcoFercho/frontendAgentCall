import { ShiftUser } from "@/shared/types";

export function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

export function formatShiftDate(shiftDate: string) {
  const parsed = new Date(`${shiftDate}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return shiftDate;
  }

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(parsed);
}

export function getTodayDateValue(now = new Date()) {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isShiftUserAvailable(user: ShiftUser, now = new Date()) {
  const today = getTodayDateValue(now);

  if (user.shiftDate !== today) {
    return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = toMinutes(user.shiftStart);
  const endMinutes = toMinutes(user.shiftEnd);

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function schedulesOverlap(startA: string, endA: string, startB: string, endB: string) {
  const startAMinutes = toMinutes(startA);
  const endAMinutes = toMinutes(endA);
  const startBMinutes = toMinutes(startB);
  const endBMinutes = toMinutes(endB);

  return startAMinutes < endBMinutes && startBMinutes < endAMinutes;
}

export function normalizeShiftUsers(users: ShiftUser[]) {
  return [...users]
    .sort((left, right) => {
      const dateCompare = left.shiftDate.localeCompare(right.shiftDate);
      if (dateCompare !== 0) {
        return dateCompare;
      }

      const startCompare = toMinutes(left.shiftStart) - toMinutes(right.shiftStart);
      if (startCompare !== 0) {
        return startCompare;
      }

      return left.priority - right.priority;
    })
    .map((user, index) => ({
      ...user,
      priority: index + 1
    }));
}
