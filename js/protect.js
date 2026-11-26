/* Scoraggia il salvataggio delle immagini (tasto destro, trascinamento, pressione lunga) */
(function () {
  function stop(e) {
    var t = e.target && e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA') return;
    e.preventDefault();
  }
  document.addEventListener('contextmenu', stop);
  document.addEventListener('dragstart', function (e) { e.preventDefault(); });
  document.addEventListener('selectstart', function (e) { if (e.target && e.target.tagName === 'IMG') e.preventDefault(); });
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (k === 's' || k === 'u')) e.preventDefault();
  });
})();
