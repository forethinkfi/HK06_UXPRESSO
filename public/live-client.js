// UXLive — browser engine for Gemini Live voice ordering: microphone capture (16 kHz PCM), reply playback (24 kHz PCM)
// and the WebSocket to THIS server (/api/live). It knows nothing about screens, cart or design: every event goes out
// through the `handlers` object given to UXLive.start(), so the final design only has to supply those handlers
// (the adapter lives in app.js). The API key never reaches the browser; the server holds it.
//
//   UXLive.start({
//     path (optional)             -> WebSocket path, default '/api/live' (v6 uses '/api/live?catalog=v6')
//     context(init, langChanged)  -> { lang, screen, mode, cartCount, hasUnpriced }   (sent to the server)
//     onReady(), onMic('ready'|'denied'), onInput(text, newTurn), onOutput(text, newTurn),
//     onSpeaking(), onSpeakEnd(), onInterrupted(), onTurnComplete(),
//     onAction({ id, name, args })   -> the app applies it and answers with UXLive.reply(id, result)
//     onError(code), onClosed(reason)
//   })
//   UXLive.stop() · sendText(t) · sendContext(ctx) · reply(id, result) · setMuted(bool) · isReady()
(() => {
  const E = { ws: null, ready: false, inCtx: null, outCtx: null, stream: null, src: null, proc: null, gain: null, nextTime: 0, sources: new Set(), token: 0, muted: false, turn: '', h: {}, d: { audioIn: 0, played: 0, ended: 0, micSent: 0 } };
  const call = (name, ...a) => { try { E.h[name] && E.h[name](...a); } catch (e) { console.error('[live-client] handler', name, e); } };

  function pcmToBase64(float32, srcRate) {
    let samples = float32;
    if (srcRate && srcRate !== 16000) { // browsers may ignore the requested 16 kHz context: resample linearly
      const ratio = srcRate / 16000;
      const len = Math.max(1, Math.floor(float32.length / ratio));
      samples = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        const idx = i * ratio, i0 = Math.floor(idx), i1 = Math.min(float32.length - 1, i0 + 1), f = idx - i0;
        samples[i] = float32[i0] * (1 - f) + float32[i1] * f;
      }
    }
    const int16 = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) { const s = Math.max(-1, Math.min(1, samples[i])); int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff; }
    const bytes = new Uint8Array(int16.buffer);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  function stopPlayback() {
    for (const s of E.sources) { try { s.stop(); } catch {} }
    E.sources.clear();
    E.nextTime = 0;
  }

  function playPcm24k(base64) {
    if (!E.outCtx) return;
    if (E.outCtx.state === 'suspended') E.outCtx.resume().catch(() => {});
    E.d.audioIn++;
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const view = new DataView(bytes.buffer);
    const count = Math.floor(bytes.byteLength / 2);
    if (!count) return;
    const f32 = new Float32Array(count);
    for (let i = 0; i < count; i++) f32[i] = view.getInt16(i * 2, true) / 32768;
    const buf = E.outCtx.createBuffer(1, count, 24000);
    buf.getChannelData(0).set(f32);
    const node = E.outCtx.createBufferSource();
    node.buffer = buf;
    node.connect(E.outCtx.destination);
    const startAt = Math.max(E.outCtx.currentTime, E.nextTime);
    E.nextTime = startAt + buf.duration;
    E.sources.add(node);
    node.onended = () => { E.d.ended++; E.sources.delete(node); if (E.sources.size === 0) call('onSpeakEnd'); };
    node.start(startAt); E.d.played++;
  }

  function send(obj) {
    if (E.ws && E.ws.readyState === WebSocket.OPEN) { E.ws.send(JSON.stringify(obj)); return true; }
    return false;
  }

  // Counters only; also printed to the console when a session ends: audioIn (chunks from the server) vs played/ended tells
  // whether sound reached the speaker path. outState 'running' = autoplay was allowed.
  const diag = () => ({ ...E.d, outState: E.outCtx ? E.outCtx.state : 'none', inState: E.inCtx ? E.inCtx.state : 'none', wsOpen: !!E.ws && E.ws.readyState === 1, ready: E.ready });
  function stop() {
    if (E.ws || E.outCtx) console.info('[live] diag', JSON.stringify(diag()));
    E.token++;
    E.ready = false; E.turn = ''; E.muted = false; E.d = { audioIn: 0, played: 0, ended: 0, micSent: 0 };
    stopPlayback();
    for (const k of ['proc', 'src', 'gain']) { if (E[k]) { try { E[k].disconnect(); } catch {} E[k] = null; } }
    if (E.stream) { E.stream.getTracks().forEach((t) => { try { t.stop(); } catch {} }); E.stream = null; }
    for (const k of ['inCtx', 'outCtx']) { if (E[k]) { try { E[k].close(); } catch {} E[k] = null; } }
    if (E.ws) { try { E.ws.close(); } catch {} E.ws = null; }
  }

  async function start(handlers) {
    stop();
    E.h = handlers || {};
    const token = ++E.token;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    try { E.outCtx = new Ctx({ sampleRate: 24000 }); await E.outCtx.resume().catch(() => {}); } catch {}

    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${location.host}${E.h.path || '/api/live'}`);
    E.ws = ws;
    ws.onopen = () => { if (E.token === token) send({ type: 'context', ...(E.h.context ? E.h.context(false, false) : {}) }); };
    ws.onmessage = (ev) => {
      if (E.token !== token) return;
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.type === 'ready') { E.ready = true; call('onReady'); send({ type: 'context', ...(E.h.context ? E.h.context(true, false) : {}) }); }
      else if (msg.type === 'inputTranscript') { const nt = E.turn !== 'user'; E.turn = 'user'; call('onInput', String(msg.text || ''), nt); }
      else if (msg.type === 'outputTranscript') { const nt = E.turn !== 'model'; E.turn = 'model'; call('onOutput', String(msg.text || ''), nt); }
      else if (msg.type === 'audio' && msg.data) { call('onSpeaking'); playPcm24k(msg.data); }
      else if (msg.type === 'interrupted') { stopPlayback(); E.turn = ''; call('onInterrupted'); }
      else if (msg.type === 'turnComplete') { E.turn = ''; call('onTurnComplete', E.sources.size === 0); }
      else if (msg.type === 'action' && typeof msg.id === 'string') call('onAction', { id: msg.id, name: String(msg.name || ''), args: msg.args || {} });
      else if (msg.type === 'error') call('onError', String(msg.code || 'UNKNOWN'));
      else if (msg.type === 'closed') call('onClosed', String(msg.reason || ''));
    };
    ws.onerror = () => { if (E.token === token) call('onError', 'SOCKET'); };
    ws.onclose = () => { if (E.token === token) call('onClosed', 'socket'); };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        if (E.token !== token) { stream.getTracks().forEach((t) => t.stop()); return; }
        E.stream = stream;
        const inCtx = new Ctx({ sampleRate: 16000 });
        E.inCtx = inCtx;
        if (inCtx.state === 'suspended') await inCtx.resume().catch(() => {});
        const src = inCtx.createMediaStreamSource(stream);
        const proc = inCtx.createScriptProcessor(4096, 1, 1);
        const gain = inCtx.createGain();
        gain.gain.value = 0; // keeps the processor running without playing the mic back
        src.connect(proc); proc.connect(gain); gain.connect(inCtx.destination);
        E.src = src; E.proc = proc; E.gain = gain;
        proc.onaudioprocess = (e) => {
          if (E.token !== token || !E.ready || E.muted) return;
          if (E.ws && E.ws.readyState === WebSocket.OPEN && E.ws.bufferedAmount < 1048576) {
            E.ws.send(JSON.stringify({ type: 'audio', data: pcmToBase64(e.inputBuffer.getChannelData(0), inCtx.sampleRate) })); E.d.micSent++;
          }
        };
        call('onMic', 'ready');
      } catch {
        if (E.token === token) call('onMic', 'denied'); // permission refused / no microphone: typing still works
      }
    } else call('onMic', 'denied');
  }

  window.UXLive = {
    start, stop,
    sendText: (text) => send({ type: 'text', text: String(text || '') }),
    sendContext: (ctx) => send({ type: 'context', ...ctx }),
    reply: (id, result) => send({ type: 'actionResult', id, result }),
    setMuted: (b) => { E.muted = !!b; },
    stopPlayback, diag,
    isReady: () => E.ready && !!E.ws && E.ws.readyState === WebSocket.OPEN,
  };
})();
