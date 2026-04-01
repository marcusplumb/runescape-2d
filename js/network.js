/**
 * Network — thin wrapper around Socket.io.
 *
 * Auth is now handled by the HttpOnly session cookie that the browser sends
 * automatically with the WebSocket upgrade request. No token is passed here.
 */
export class Network {
  constructor() {
    // withCredentials: true makes the browser include cookies (including the
    // HttpOnly session cookie) in the Socket.io handshake request.
    // eslint-disable-next-line no-undef
    this.socket = io({ withCredentials: true });

    this._lastCol = null;
    this._lastRow = null;
    this._lastDir = null;

    this.socket.on('connect', () => {
      console.log('[Network] connected', this.socket.id);
    });
    this.socket.on('connect_error', (err) => {
      console.warn('[Network] connection error:', err.message);
    });
  }

  /** Emit current position — only if it actually changed (avoids spam). */
  sendMove(col, row, dir) {
    if (col === this._lastCol && row === this._lastRow && dir === this._lastDir) return;
    this._lastCol = col;
    this._lastRow = row;
    this._lastDir = dir;
    this.socket.emit('move', { col, row, dir });
  }

  /** Emit equipment + style after the player equips or visits the makeover mage. */
  sendEquip(equipment, style, name, combatLevel) {
    this.socket.emit('equip', { equipment, style, name, combatLevel });
  }

  /** Emit a tile change caused by this player (chop, mine, fire, etc.). */
  sendTileChange(col, row, tile) {
    this.socket.emit('tile_change', { col, row, tile });
  }

  /** Emit action state change (idle, chop, mine, fish, cook, fight). */
  sendAction(currentAction, actionTarget) {
    this.socket.emit('action', { currentAction, actionTarget: actionTarget || null });
  }

  /** Notify the server that this player hit a mob (server updates HP for all clients). */
  sendMobHit(mobId, damage) {
    this.socket.emit('mob_hit', { mobId, damage });
  }

  /** Tell the server this player started attacking a mob. */
  sendStartCombat(mobId) {
    this.socket.emit('start_combat', { mobId });
  }

  /** Tell the server this player stopped attacking a mob. */
  sendStopCombat(mobId) {
    this.socket.emit('stop_combat', { mobId });
  }

  /** Notify other clients of this player's current HP (health bar sync). */
  sendPlayerHp(hp, maxHp) {
    this.socket.emit('player_hp', { hp, maxHp });
  }

  /** Notify other clients of a hit splat on this player (mob attacking player). */
  sendPlayerSplat(damage, wx, wy) {
    this.socket.emit('player_splat', { damage, wx, wy });
  }

  /** Notify other clients that this player just performed an attack swing (animation sync). */
  sendAttack() {
    this.socket.emit('player_attack');
  }

  /** Send a chat message to all players. */
  sendChat(message) {
    this.socket.emit('chat', { message });
  }

  on(event, cb)  { this.socket.on(event, cb); }
  off(event, cb) { this.socket.off(event, cb); }

  /** Register a callback that fires when the server kicks this session. */
  onForceLogout(cb) { this.socket.on('force_logout', cb); }

  disconnect() { this.socket.disconnect(); }
}
