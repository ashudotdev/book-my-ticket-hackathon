let io = null;

export function setRealtimeServer(server) {
  io = server;
}

export function getSeatRoom(movie, time) {
  return `seats:${String(movie || "").toLowerCase()}:${String(time || "").toLowerCase()}`;
}

export function emitSeatMapUpdate(movie, time, payload = {}) {
  if (!io) return;
  io.to(getSeatRoom(movie, time)).emit("seat-map-updated", {
    movie: String(movie || "").toLowerCase(),
    time: String(time || "").toLowerCase(),
    ...payload,
  });
}
