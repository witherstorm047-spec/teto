/* Teto word of the day - versão Android (Capacitor) */
(function () {
  "use strict";
  var L = window.TetoLogic;
  var LETTER_DELAY_MS = 140;
  var WORDLIST_URL = "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt";
  var CHANNEL_ID = "teto-daily";
  var NOTIF_ID = 1;

  var $ = function (id) { return document.getElementById(id); };
  var frames = [0, 1, 2, 3].map(function (i) { var im = new Image(); im.src = "frames/" + i + ".png"; return im; });
  var audio = new Audio("teto.mp3");
  audio.preload = "auto";

  var cap = window.Capacitor;
  var native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  var LN = native && cap.Plugins ? cap.Plugins.LocalNotifications : null;

  var run = 0;            // identifica a "sessão" atual da animação
  var current = null;     // { word, definition }
  var currentDay = "";
  var talking = false;
  var hiddenAt = 0;

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(toast.tid); toast.tid = setTimeout(function () { t.classList.remove("on"); }, 3500);
  }
  function withTimeout(promiseFactory, ms) {
    var ctl = new AbortController();
    var tid = setTimeout(function () { ctl.abort(); }, ms);
    return promiseFactory(ctl.signal).finally(function () { clearTimeout(tid); });
  }

  // ---------- palavra do dia ----------
  async function getDefinition(word) {
    try {
      var r = await withTimeout(function (s) {
        return fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(word), { signal: s });
      }, 6000);
      var data = await r.json();
      return data[0].meanings[0].definitions[0].definition || "";
    } catch (e) { return ""; }
  }

  async function pickWord(date) {
    var day = L.isoDate(date);
    var cached = store("teto:day");
    if (cached) {
      try { var c = JSON.parse(cached); if (c.date === day && c.word) return c; } catch (e) {}
    }
    var word, listOk = false;
    try {
      var r = await withTimeout(function (s) { return fetch(WORDLIST_URL, { signal: s }); }, 30000);
      if (!r.ok) throw new Error("http " + r.status);
      var words = L.parseWordList(await r.text());
      if (words.length < 1000) throw new Error("lista inválida");
      word = L.wordFromList(words, date);
      listOk = true;
    } catch (e) {
      word = L.fallbackWord(date);
    }
    var definition = await getDefinition(word);
    var result = { date: day, word: word, definition: definition };
    if (listOk && definition) store("teto:day", JSON.stringify(result));   // só guarda se veio tudo completo
    return result;
  }

  // ---------- animação ----------
  function setFrame(i) { $("sprite").src = frames[i].src; }

  function fitWord(word) {
    var line = $("wordline"), size = Math.max(40, Math.round(window.innerHeight / 9));
    line.style.fontSize = size + "px";
    $("shown").textContent = ""; $("rest").textContent = word;
    var max = window.innerWidth * 0.9;
    while (line.scrollWidth > max && size > 20) { size -= 4; line.style.fontSize = size + "px"; }
  }

  function playAudio() {
    try { audio.pause(); audio.currentTime = 0; var p = audio.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }

  function talk(word, definition) {
    var my = ++run, i = 0, last = 0;
    talking = true;
    $("def").classList.remove("on");
    $("def").textContent = L.capitalize(definition || "");
    fitWord(word);
    setFrame(0);
    playAudio();
    setTimeout(function step() {
      if (my !== run) return;
      if (i < word.length) {
        $("shown").textContent = word.slice(0, i + 1);
        $("rest").textContent = word.slice(i + 1);
        var opts = [0, 1, 2, 3].filter(function (k) { return k !== last; });
        last = opts[Math.floor(Math.random() * opts.length)];
        setFrame(last);
        i++;
        setTimeout(step, LETTER_DELAY_MS);
      } else {
        setFrame(0);
        $("def").classList.add("on");
        talking = false;
      }
    }, 600);
  }

  async function start() {
    var my = ++run;
    var now = new Date();
    currentDay = L.isoDate(now);
    talking = true;
    $("def").classList.remove("on");
    $("shown").textContent = ""; $("rest").textContent = "";
    setFrame(0);
    toastLoading(true);
    var res = await pickWord(now);
    toastLoading(false);
    if (my !== run) return;
    current = { word: L.capitalize(res.word), definition: res.definition };
    talk(current.word, current.definition);
  }
  function toastLoading(on) { $("hint").textContent = on ? "A escolher a palavra de hoje…" : "Toca no ecrã para ouvir outra vez"; }

  // ---------- notificação diária ----------
  async function scheduleDaily(hhmm) {
    if (!LN) { toast("O lembrete diário só funciona na app Android."); return false; }
    var perm = await LN.requestPermissions();
    if (perm.display !== "granted") { toast("Sem permissão para notificações. Ativa-as nas definições do Android."); return false; }
    try { await LN.createChannel({ id: CHANNEL_ID, name: "Palavra do dia", description: "Lembrete diário da Teto", importance: 4, visibility: 1 }); } catch (e) {}
    try { await LN.cancel({ notifications: [{ id: NOTIF_ID }] }); } catch (e) {}
    var p = hhmm.split(":");
    await LN.schedule({ notifications: [{
      id: NOTIF_ID,
      title: "Teto word of the day",
      body: "A tua palavra do dia está pronta!",
      channelId: CHANNEL_ID,
      schedule: { on: { hour: parseInt(p[0], 10), minute: parseInt(p[1], 10) }, allowWhileIdle: true }
    }] });
    store("teto:time", hhmm);
    toast("A Teto vai aparecer todos os dias às " + hhmm + ".");
    return true;
  }

  function askTime() {
    return new Promise(function (resolve) {
      $("time").value = store("teto:time") || "09:00";
      $("modal").classList.add("on");
      function done(v) {
        $("modal").classList.remove("on");
        $("save").onclick = $("later").onclick = null;
        resolve(v);
      }
      $("save").onclick = async function () {
        var v = $("time").value;
        if (!/^\d{2}:\d{2}$/.test(v)) { toast("Escolhe uma hora válida."); return; }
        done(true); await scheduleDaily(v);
      };
      $("later").onclick = function () { done(false); };
    });
  }

  // ---------- eventos ----------
  document.addEventListener("click", function (e) {
    if (e.target.closest("#modal") || e.target.closest("#sched")) return;
    if (!talking && current) talk(current.word, current.definition);
  });
  $("sched").addEventListener("click", function () { askTime(); });

  // voltar à app (ex.: ao tocar na notificação): repete a animação / muda de dia
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (L.isoDate(new Date()) !== currentDay) start();
    else if (current && Date.now() - hiddenAt > 60000) talk(current.word, current.definition);
  });

  (async function init() {
    if (native && !store("teto:time")) await askTime();   // primeira vez: escolher o horário
    start();
  })();
})();
