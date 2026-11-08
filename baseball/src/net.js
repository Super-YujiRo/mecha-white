// オンライン対戦（PeerJS）。?local=1 のときは同じブラウザの2タブで試せる BroadcastChannel を使う
const PREFIX = 'hakkyu-battle-v1-';
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class Net {
  constructor() {
    this.role = null; this.conn = null; this.peer = null; this.bc = null;
    this.onMessage = () => {}; this.onOpen = () => {}; this.onClose = () => {}; this.onError = () => {};
    this.local = new URLSearchParams(location.search).has('local');
    this.open = false;
  }

  static makeCode() { let c = ''; for (let i = 0; i < 5; i++) c += LETTERS[Math.floor(Math.random() * LETTERS.length)]; return c; }

  host(code) {
    this.role = 'host'; this.code = code;
    if (this.local) return this._bc(code);
    try {
      this.peer = new window.Peer(PREFIX + code);
      this.peer.on('connection', (c) => { if (this.conn) { c.close(); return; } this._wire(c); });
      this.peer.on('error', (e) => this.onError(e && e.type === 'unavailable-id' ? 'そのコードは使われています。もう一度作ってね' : 'つながりませんでした（' + (e && e.type) + '）'));
      this.peer.on('disconnected', () => { try { this.peer.reconnect(); } catch (_) {} });
    } catch (e) { this.onError('通信を始められませんでした'); }
  }

  join(code) {
    this.role = 'guest'; this.code = code;
    if (this.local) return this._bc(code);
    try {
      this.peer = new window.Peer();
      this.peer.on('open', () => {
        const c = this.peer.connect(PREFIX + code, { reliable: true });
        this._wire(c);
      });
      this.peer.on('error', (e) => this.onError(e && e.type === 'peer-unavailable' ? '部屋が見つかりません。コードを確認してね' : 'つながりませんでした（' + (e && e.type) + '）'));
    } catch (e) { this.onError('通信を始められませんでした'); }
  }

  _wire(c) {
    this.conn = c;
    c.on('open', () => { this.open = true; this.onOpen(); });
    c.on('data', (d) => this.onMessage(d));
    c.on('close', () => { this.open = false; this.onClose(); });
    c.on('error', () => {});
  }

  _bc(code) {
    this.bc = new BroadcastChannel(PREFIX + code);
    this.bc.onmessage = (e) => {
      const d = e.data;
      if (d.__from === this.role) return;
      if (d.__hello) { if (!this.open) { this.open = true; this.bc.postMessage({ __from: this.role, __hello: 1 }); this.onOpen(); } return; }
      this.onMessage(d.m);
    };
    this.bc.postMessage({ __from: this.role, __hello: 1 });
  }

  send(m) {
    if (this.bc) { this.bc.postMessage({ __from: this.role, m }); return; }
    if (this.conn && this.open) this.conn.send(m);
  }

  close() {
    try { this.conn && this.conn.close(); } catch (_) {}
    try { this.peer && this.peer.destroy(); } catch (_) {}
    try { this.bc && this.bc.close(); } catch (_) {}
    this.open = false;
  }
}
