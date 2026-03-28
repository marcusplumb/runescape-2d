/**
 * Network — thin wrapper around Socket.io.
 * Connects to the server with a JWT token and exposes
 * methods for sending updates and registering event callbacks.
 */
export class Network {
  constructor(token) {
    // io() is provided by /socket.io/socket.io.js loaded in index.html
    // eslint-disable-next-line no-undef
    this.socket = io({ auth: { token } });

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

  on(event, cb) { this.socket.on(event, cb); }
  off(event, cb) { this.socket.off(event, cb); }

  /** Register a callback that fires when the server kicks this session. */
  onForceLogout(cb) { this.socket.on('force_logout', cb); }

  disconnect() { this.socket.disconnect(); }
}
