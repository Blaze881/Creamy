/* Creamy Launcher - player video in stile YouTube 2012 (basato su YouTube IFrame API) */
(function () {
  var apiState = 0, queue = [];
  function loadApi(cb) {
    if (window.YT && YT.Player) { cb(); return; }
    queue.push(cb);
    if (apiState) return;
    apiState = 1;
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (prev) try { prev(); } catch (e) {}
      apiState = 2;
      while (queue.length) queue.shift()();
    };
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }
  function fmt(t) {
    t = Math.max(0, Math.floor(t || 0));
    var m = Math.floor(t / 60), s = t % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }
  var SVG_VOL = '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M1 6h3l4-3v10l-4-3H1z" fill="#eee"/><path class="w" d="M10 5.5c1.4 1.4 1.4 3.6 0 5M12 3.5c2.5 2.5 2.5 6.5 0 9" stroke="#eee" stroke-width="1.4" fill="none"/></svg>';
  var SVG_FS = '<svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 5V1h4M11 1h4v4M15 9v4h-4M5 13H1V9" stroke="#eee" stroke-width="2" fill="none"/></svg>';

  function Player(host, id) {
    var self = this, root = el('div', 'ytp');
    this.id = id; this.root = root; this.ready = false; this.drag = false;
    root.innerHTML =
      '<div class="ytp-video"><div class="ytp-slot"></div></div>' +
      '<div class="ytp-poster" style="background-image:url(https://i.ytimg.com/vi/' + id + '/hqdefault.jpg)"></div>' +
      '<div class="ytp-shield"></div><div class="ytp-big" title="Play"></div>' +
      '<div class="ytp-error">Il video non pu&ograve; essere caricato qui.<br><a href="https://www.youtube.com/watch?v=' + id + '" target="_blank" rel="noopener">Guardalo su YouTube</a></div>' +
      '<div class="ytp-bar">' +
        '<button class="ytp-btn ytp-play" title="Play"></button>' +
        '<div class="ytp-time"><b class="ytp-cur">0:00</b> / <span class="ytp-dur">0:00</span></div>' +
        '<div class="ytp-track"><div class="ytp-rail"><div class="ytp-loaded"></div><div class="ytp-played"></div><div class="ytp-handle"></div></div></div>' +
        '<div class="ytp-vol"><button class="ytp-btn ytp-mute" title="Mute">' + SVG_VOL + '</button><div class="ytp-vslider"><div class="ytp-vrail"><div class="ytp-vlevel"></div></div></div></div>' +
        '<span class="ytp-hd">HD</span>' +
        '<a class="ytp-logo" href="https://www.youtube.com/watch?v=' + id + '" target="_blank" rel="noopener" title="Watch on YouTube">You<span>Tube</span></a>' +
        '<button class="ytp-btn ytp-fs" title="Full screen">' + SVG_FS + '</button>' +
      '</div>';
    host.innerHTML = '';
    host.appendChild(root);
    this.q = function (s) { return root.querySelector(s); };
    this.bind();
    loadApi(function () { self.create(); });
    setTimeout(function () { if (!self.ready) root.className += ' failed'; }, 12000);
  }
  Player.prototype.create = function () {
    var self = this;
    this.yt = new YT.Player(this.q('.ytp-slot'), {
      videoId: this.id, width: '100%', height: '100%',
      playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, iv_load_policy: 3, playsinline: 1, showinfo: 0, cc_load_policy: 0, origin: location.origin },
      events: {
        onReady: function () { self.ready = true; self.q('.ytp-dur').textContent = fmt(self.yt.getDuration()); self.tick(); },
        onStateChange: function (e) { self.state(e.data); },
        onError: function () { self.root.className += ' failed'; }
      }
    });
    setInterval(function () { self.tick(); }, 250);
  };
  Player.prototype.state = function (s) {
    var r = this.root, c = r.className.replace(/\s*(playing|buffering)/g, '');
    if (s === 1) { c += ' playing'; this.q('.ytp-poster').style.display = 'none'; this.q('.ytp-dur').textContent = fmt(this.yt.getDuration()); this.wake(); }
    else if (s === 3) { c += ' buffering'; this.q('.ytp-poster').style.display = 'none'; }
    else if (s === 0) { this.q('.ytp-poster').style.display = 'block'; this.yt.seekTo(0, false); this.yt.pauseVideo(); }
    r.className = c;
  };
  Player.prototype.toggle = function () {
    if (!this.ready) return;
    var s = this.yt.getPlayerState();
    if (s === 1 || s === 3) this.yt.pauseVideo(); else this.yt.playVideo();
  };
  Player.prototype.tick = function () {
    if (!this.ready || this.drag) return;
    var d = this.yt.getDuration() || 0, t = this.yt.getCurrentTime() || 0;
    var p = d ? Math.min(100, t / d * 100) : 0;
    this.q('.ytp-played').style.width = p + '%';
    this.q('.ytp-handle').style.left = p + '%';
    this.q('.ytp-loaded').style.width = (this.yt.getVideoLoadedFraction() || 0) * 100 + '%';
    this.q('.ytp-cur').textContent = fmt(t);
    this.q('.ytp-dur').textContent = fmt(d);
  };
  Player.prototype.wake = function () {
    var r = this.root, self = this;
    r.className = r.className.replace(/\s*idle/g, '');
    clearTimeout(this.idleT);
    this.idleT = setTimeout(function () { r.className += ' idle'; }, 3000);
  };
  Player.prototype.bind = function () {
    var self = this, r = this.root;
    function frac(e, node) {
      var b = node.getBoundingClientRect(), x = (e.touches ? e.touches[0].clientX : e.clientX);
      return Math.max(0, Math.min(1, (x - b.left) / b.width));
    }
    this.q('.ytp-shield').onclick = this.q('.ytp-big').onclick = this.q('.ytp-play').onclick = function () { self.toggle(); };
    r.addEventListener('mousemove', function () { self.wake(); });
    r.addEventListener('touchstart', function () { self.wake(); }, { passive: true });
    var track = this.q('.ytp-track'), rail = this.q('.ytp-rail');
    function seek(e) {
      if (!self.ready) return;
      var f = frac(e, rail), d = self.yt.getDuration() || 0;
      self.q('.ytp-played').style.width = f * 100 + '%';
      self.q('.ytp-handle').style.left = f * 100 + '%';
      self.q('.ytp-cur').textContent = fmt(f * d);
      return f * d;
    }
    function down(e) {
      if (!self.ready) return;
      self.drag = true; seek(e);
      function mv(ev) { seek(ev); ev.preventDefault && ev.preventDefault(); }
      function up(ev) {
        var t = self.drag ? seek(ev.changedTouches ? { touches: ev.changedTouches } : ev) : null;
        self.drag = false;
        if (t != null) self.yt.seekTo(t, true);
        document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up);
        document.removeEventListener('touchmove', mv); document.removeEventListener('touchend', up);
      }
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
      document.addEventListener('touchmove', mv, { passive: false }); document.addEventListener('touchend', up);
      e.preventDefault && e.preventDefault();
    }
    track.addEventListener('mousedown', down);
    track.addEventListener('touchstart', down, { passive: false });
    var mute = this.q('.ytp-mute'), vs = this.q('.ytp-vslider'), lvl = this.q('.ytp-vlevel');
    mute.onclick = function () {
      if (!self.ready) return;
      if (self.yt.isMuted()) { self.yt.unMute(); lvl.style.width = self.yt.getVolume() + '%'; mute.querySelector('.w').style.display = ''; }
      else { self.yt.mute(); lvl.style.width = '0%'; mute.querySelector('.w').style.display = 'none'; }
    };
    vs.onclick = function (e) {
      if (!self.ready) return;
      var v = Math.round(frac(e, vs.querySelector('.ytp-vrail')) * 100);
      self.yt.unMute(); self.yt.setVolume(v); lvl.style.width = v + '%';
      mute.querySelector('.w').style.display = v ? '' : 'none';
    };
    this.q('.ytp-fs').onclick = function () {
      var d = document, fs = d.fullscreenElement || d.webkitFullscreenElement;
      if (fs) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); }
      else { var f = r.requestFullscreen || r.webkitRequestFullscreen; if (f) f.call(r); }
    };
  };
  window.CreamyPlayer = {
    mount: function (id, videoId) { var h = document.getElementById(id); if (h) return new Player(h, videoId); }
  };
})();
