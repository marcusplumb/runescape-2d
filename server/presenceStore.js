'use strict';

const GAME_NS = process.env.GAME_NAMESPACE || 'runeworld';
const PRESENCE_TTL_SEC = Number(process.env.PRESENCE_TTL_SEC || 60);

function keyPlayers() {
  return `${GAME_NS}:players`;
}

function keyPlayer(username) {
  return `${GAME_NS}:player:${username}`;
}

function keySocket(socketId) {
  return `${GAME_NS}:socket:${socketId}`;
}

function keyUserSocket(username) {
  return `${GAME_NS}:user-socket:${username}`;
}

function keyWorldOverrides() {
  return `${GAME_NS}:world-overrides`;
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function upsertPlayer(redis, snapshot) {
  const payload = JSON.stringify(snapshot);

  const multi = redis.multi();
  multi.sAdd(keyPlayers(), snapshot.username);
  multi.set(keyPlayer(snapshot.username), payload, { EX: PRESENCE_TTL_SEC });
  multi.set(keySocket(snapshot.id), snapshot.username, { EX: PRESENCE_TTL_SEC });
  multi.set(keyUserSocket(snapshot.username), snapshot.id, { EX: PRESENCE_TTL_SEC });
  await multi.exec();
}

async function getPlayer(redis, username) {
  const raw = await redis.get(keyPlayer(username));
  return raw ? safeParse(raw) : null;
}

async function getSocketForUser(redis, username) {
  return redis.get(keyUserSocket(username));
}

async function getAllPlayers(redis) {
  const usernames = await redis.sMembers(keyPlayers());
  if (!usernames.length) return [];

  const raws = await redis.mGet(usernames.map((u) => keyPlayer(u)));

  const players = [];
  const staleUsers = [];

  for (let i = 0; i < usernames.length; i++) {
    const player = raws[i] ? safeParse(raws[i]) : null;
    if (player) players.push(player);
    else staleUsers.push(usernames[i]);
  }

  if (staleUsers.length) {
    await redis.sRem(keyPlayers(), staleUsers);
  }

  return players;
}

async function removeSocket(redis, socketId) {
  const username = await redis.get(keySocket(socketId));
  if (!username) return;

  const currentOwnerSocket = await redis.get(keyUserSocket(username));

  const multi = redis.multi();
  multi.del(keySocket(socketId));

  if (currentOwnerSocket === socketId) {
    multi.del(keyUserSocket(username));
    multi.del(keyPlayer(username));
    multi.sRem(keyPlayers(), username);
  }

  await multi.exec();
}

async function setWorldOverride(redis, col, row, tile) {
  await redis.hSet(keyWorldOverrides(), `${col},${row}`, String(tile));
}

async function getAllWorldOverrides(redis) {
  const raw = await redis.hGetAll(keyWorldOverrides());
  const out = [];

  for (const [coord, tileStr] of Object.entries(raw)) {
    const comma = coord.indexOf(',');
    if (comma === -1) continue;

    const col = Number(coord.slice(0, comma));
    const row = Number(coord.slice(comma + 1));
    const tile = Number(tileStr);

    if (!Number.isFinite(col) || !Number.isFinite(row) || !Number.isFinite(tile)) continue;
    out.push({ col, row, tile });
  }

  return out;
}

module.exports = {
  PRESENCE_TTL_SEC,
  upsertPlayer,
  getPlayer,
  getSocketForUser,
  getAllPlayers,
  removeSocket,
  setWorldOverride,
  getAllWorldOverrides,
};