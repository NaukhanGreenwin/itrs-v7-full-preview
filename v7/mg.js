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
  var b = document.querySelector('.mg-burger'), dr = document.getElementById('mg-menu')
  function toggle(on) { if (!b || !dr) return; b.setAttribute('aria-expanded', on ? 'true' : 'false'); b.setAttribute('aria-label', on ? 'Close menu' : 'Open menu'); dr.hidden = !on; document.documentElement.classList.toggle('mg-menu-open', on); document.documentElement.style.overflow = on ? 'hidden' : '' }
  dr && dr.addEventListener('click', function (e) { if (e.target.closest('a')) toggle(false) })
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
  /* Production forms: same contract as the old React forms (CaptchaWidget + fetch to the relay).
     reCAPTCHA v2 loads on first interaction only; tokens are single-use, so reset after each attempt. */
  var SITEKEY = '6Let2qMtAAAAAEuXi-DzvEmP1_oq2nHXF8ezQpKG', RC = 'https://www.google.com/recaptcha/api.js?render=explicit'
  ;[].forEach.call(document.querySelectorAll('form[action*="itrs-form-relay"]:not([data-preview])'), function (f) {
    var btn = f.querySelector('button[type=submit], button:not([type]), [type=submit]')
    var box = document.createElement('div'); box.className = 'mg-captcha'
    btn ? btn.parentNode.insertBefore(box, btn) : f.appendChild(box)
    var status = document.createElement('p'); status.className = 'mg-status'; status.setAttribute('role', 'status'); f.appendChild(status)
    var wid = null, armed = false
    function render() { if (window.grecaptcha && wid === null) grecaptcha.ready(function () { if (wid === null) wid = grecaptcha.render(box, { sitekey: SITEKEY }) }) }
    function arm() {
      if (armed) return; armed = true
      if (window.grecaptcha) return render()
      var s = document.querySelector('script[src="' + RC + '"]')
      if (!s) { s = document.createElement('script'); s.src = RC; s.async = true; document.head.appendChild(s) }
      s.addEventListener('load', render)
    }
    ;['focusin', 'pointerdown', 'touchstart'].forEach(function (ev) { f.addEventListener(ev, arm, { passive: true }) })
    f.addEventListener('submit', function (e) {
      e.preventDefault()
      var body = new FormData(f)
      if (!String(body.get('message') || '').trim()) {
        body.set('message', 'Request from ' + location.pathname + '. Name: ' + (body.get('name') || [body.get('firstName'), body.get('lastName')].filter(Boolean).join(' ')) + '. Phone: ' + (body.get('phone') || '') + '. Email: ' + (body.get('email') || '') + '.')
      }
      if (btn) btn.disabled = true
      status.textContent = 'Sending…'
      fetch(f.action, { method: 'POST', body: body, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return {} }).then(function (j) { return { ok: r.ok, j: j } }) })
        .then(function (x) {
          status.textContent = x.ok ? 'Thanks. A technician from our Vaughan office will get back to you within one business day.' : (x.j.error || 'There was a problem sending your request. Please call (289) 582-9930 instead.')
          if (x.ok) f.reset()
        })
        .catch(function () { status.textContent = 'There was a problem sending your request. Please call (289) 582-9930 instead.' })
        .then(function () { if (btn) btn.disabled = false; try { wid !== null && grecaptcha.reset(wid) } catch (_) {} })
    })
  })
})()
