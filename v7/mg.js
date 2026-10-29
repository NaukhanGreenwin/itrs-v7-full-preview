/* ITRS v7 migration: menus, mobile drawer, open a folded section when its #anchor is targeted. No framework. */
(function () {
  var dds = [].slice.call(document.querySelectorAll('.mg-dd'))
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches
  function close(except) { dds.forEach(function (d) { if (d !== except) { d.classList.remove('is-open'); var t = d.querySelector('.mg-nav-top'); t && t.setAttribute('aria-expanded', 'false') } }) }
  dds.forEach(function (d) {
    var t = d.querySelector('.mg-nav-top')
    if (fine) {
      d.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { close(d); d.classList.add('is-open'); t.setAttribute('aria-expanded', 'true') } })
      d.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { d.classList.remove('is-open'); t.setAttribute('aria-expanded', 'false') } })
    }
    t.addEventListener('click', function (e) {
      if (!d.classList.contains('is-open')) { e.preventDefault(); close(d); d.classList.add('is-open'); t.setAttribute('aria-expanded', 'true') }
      else if (t.tagName === 'BUTTON') { d.classList.remove('is-open'); t.setAttribute('aria-expanded', 'false') }
    })
  })
  document.addEventListener('pointerdown', function (e) { if (!e.target.closest('.mg-dd')) close() })
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); toggle(false) } })
  var b = document.querySelector('.mg-burger'), dr = document.getElementById('mg-drawer')
  function toggle(on) { if (!b) return; b.setAttribute('aria-expanded', on ? 'true' : 'false'); dr.hidden = !on; document.documentElement.style.overflow = on ? 'hidden' : '' }
  b && b.addEventListener('click', function () { toggle(dr.hidden) })
  function openHash() {
    if (!location.hash) return
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)))
    if (!el) return
    var d = el.tagName === 'DETAILS' ? el : el.closest('details')
    if (d) { d.open = true; setTimeout(function () { el.scrollIntoView({ block: 'start' }) }, 0) }
  }
  window.addEventListener('hashchange', openHash); openHash()
  ;[].forEach.call(document.querySelectorAll('form[data-preview]'), function (f) {
    f.addEventListener('submit', function (e) { e.preventDefault(); alert('Preview only: this form is disabled on the preview site.') })
  })
})()
