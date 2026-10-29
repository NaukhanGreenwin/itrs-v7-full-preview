/* ITRS v7 migration: menus, mobile drawer, open a folded section when its #anchor is targeted,
   cookie consent + GA4/Ads events (ports of src/components/CookieConsent.tsx, src/lib/consent.ts and
   src/components/AnalyticsTracker.tsx; same IDs, same event names). No framework. */
(function () {
  var GA_ID = 'G-KNT7SJ3LYP', ADS_ID = 'AW-18376615029', KEY = 'itrs_consent', GPC_NOTE = 'itrs_gpc_note_seen'
  var BASE = (document.querySelector('.mg-logo') || {}).getAttribute ? (document.querySelector('.mg-logo').getAttribute('href') || '/').replace(/\/$/, '') : ''
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
  var b = document.querySelector('.mg-burger'), dr = document.getElementById('mg-menu')
  if (dr) { dr.setAttribute('role', 'dialog'); dr.setAttribute('aria-modal', 'true'); dr.setAttribute('aria-label', 'Site menu') }
  function toggle(on) {
    if (!b || !dr) return
    var was = !dr.hidden
    b.setAttribute('aria-expanded', on ? 'true' : 'false'); b.setAttribute('aria-label', on ? 'Close menu' : 'Open menu'); dr.hidden = !on
    document.documentElement.classList.toggle('mg-menu-open', on); document.documentElement.style.overflow = on ? 'hidden' : ''
    if (on) { var f = dr.querySelector('a'); f && f.focus() } else if (was) b.focus()
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { close(); toggle(false) }
    if (e.key === 'Tab' && dr && !dr.hidden) {  // keep focus inside the open menu (burger + menu links)
      var els = [b].concat([].slice.call(dr.querySelectorAll('a,button')))
      var i = els.indexOf(document.activeElement)
      if (e.shiftKey && i <= 0) { e.preventDefault(); els[els.length - 1].focus() }
      else if (!e.shiftKey && (i === els.length - 1 || i === -1)) { e.preventDefault(); els[0].focus() }
    }
  })
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

  /* ---------- consent (localStorage only; Google tags load only after Accept; GPC = refusal) ---------- */
  function gpc() { return navigator.globalPrivacyControl === true }
  function getConsent() { try { var v = localStorage.getItem(KEY); return v === 'granted' || v === 'denied' ? v : null } catch (_) { return null } }
  function hasConsent() { return !navigator.webdriver && !gpc() && getConsent() === 'granted' }
  function track(name, params) { if (hasConsent() && typeof window.gtag === 'function') window.gtag('event', name, params || {}) }
  function delCookies() {
    var names = document.cookie.split(';').map(function (c) { return c.split('=')[0].trim() }).filter(function (n) { return /^(_ga|_gid|_gat|_gcl_|_gac_)/.test(n) })
    var parts = location.hostname.split('.'), doms = ['']
    for (var i = 0; i < parts.length - 1; i++) { var d = parts.slice(i).join('.'); doms.push('; domain=' + d, '; domain=.' + d) }
    names.forEach(function (n) { doms.forEach(function (d) { document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d }) })
  }
  var pvSent = false
  function pageView() {
    if (pvSent || !hasConsent() || typeof window.gtag !== 'function') return
    pvSent = true
    var p = location.pathname, rel = BASE && p.indexOf(BASE) === 0 ? p.slice(BASE.length) || '/' : p
    window.gtag('event', 'page_view', { page_title: document.title || 'IT Rapid Support', page_location: location.href, page_path: rel + location.search,
      page_type: rel === '/' ? 'home' : rel.indexOf('/services/') > -1 ? 'service' : 'page', send_to: GA_ID })
    setTimeout(function () { track('engagement', { engagement_time_msec: 10000, page_path: rel + location.search }) }, 10000)
  }
  function setConsent(c) {
    try { localStorage.setItem(KEY, c); localStorage.removeItem('cookieConsent') } catch (_) {}
    if (c === 'granted' && !gpc()) { window.itrsLoadGoogleTags && window.itrsLoadGoogleTags(); pageView() }
    else {
      window['ga-disable-' + GA_ID] = true; window['ga-disable-' + ADS_ID] = true
      if (typeof window.gtag === 'function') window.gtag('consent', 'update', { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
      delCookies()
    }
    window.dispatchEvent(new CustomEvent('itrs-consent-change', { detail: c }))
  }
  var banner = null
  function showBanner() {
    if (banner) { banner.hidden = false; return }
    banner = document.createElement('div')
    if (gpc()) {
      banner.className = 'mg-consent mg-consent--gpc'; banner.setAttribute('role', 'region'); banner.setAttribute('aria-label', 'Privacy notice'); banner.setAttribute('data-consent-banner', 'gpc')
      banner.innerHTML = '<p>Your browser sent a Global Privacy Control signal, so we do not load analytics or advertising cookies. <a href="' + BASE + '/privacy/#global-privacy-control">Learn more</a></p><div class="mg-consent-b"><button type="button" data-consent="ok">OK</button></div>'
    } else {
      banner.className = 'mg-consent'; banner.setAttribute('role', 'dialog'); banner.setAttribute('aria-label', 'Cookie consent'); banner.setAttribute('data-consent-banner', 'choice')
      banner.innerHTML = '<p>With your permission we use Google Analytics and Google Ads conversion tracking to understand how our site is used. They stay off unless you accept, and you can change your choice any time from Cookie settings in the footer. <a href="' + BASE + '/privacy/#cookies">Privacy Policy</a></p>' +
        '<div class="mg-consent-b"><button type="button" data-consent="reject">Reject</button><button type="button" data-consent="accept">Accept</button></div>'
    }
    banner.addEventListener('click', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-consent'); if (!k) return
      if (k === 'ok') { try { localStorage.setItem(GPC_NOTE, '1') } catch (_) {} } else setConsent(k === 'accept' ? 'granted' : 'denied')
      banner.hidden = true
    })
    document.body.appendChild(banner)
  }
  var noteSeen = false; try { noteSeen = localStorage.getItem(GPC_NOTE) === '1' } catch (_) {}
  var needs = gpc() ? !noteSeen : getConsent() === null
  if (needs && !/ReactSnap/.test(navigator.userAgent)) {
    // after load + idle, so the banner is never the LCP element (same timing as the React banner)
    var later = function () { setTimeout(function () { 'requestIdleCallback' in window ? requestIdleCallback(showBanner, { timeout: 2000 }) : showBanner() }, 1000) }
    document.readyState === 'complete' ? later() : window.addEventListener('load', later, { once: true })
  }
  ;[].forEach.call(document.querySelectorAll('[data-cookie-settings]'), function (x) { x.addEventListener('click', function (e) { e.preventDefault(); showBanner() }) })
  // returning visitor who accepted: the head script loads gtag after load+idle; send this page's page_view once it exists
  if (hasConsent()) { var tries = 0, iv = setInterval(function () { if (window.gtag && (document.querySelector('script[src*="googletagmanager.com/gtag/js"]') || tries > 40)) { clearInterval(iv); pageView() } tries++ }, 250) }
  // phone + primary CTA clicks (same names/params as AnalyticsTracker.tsx)
  var CTA = /^\/(contact|it-health-check|security-assessment|managed-it-plans)(\/|\?|$)/
  document.addEventListener('click', function (e) {
    var t = e.target
    var tel = t && t.closest && t.closest('a[href^="tel:"]')
    if (tel) track('phone_call_click', { phone_number: tel.getAttribute('href').replace('tel:', ''), link_text: (tel.textContent || '').trim().slice(0, 100), page_path: location.pathname })
    var el = t && t.closest && t.closest('[data-cta], a[href]'); if (!el) return
    var href = (el.getAttribute('href') || '').replace(BASE, ''), ex = el.getAttribute('data-cta')
    if (ex || CTA.test(href)) track('cta_click', { cta_name: ex || href, cta_text: (el.textContent || '').trim().slice(0, 100), cta_destination: href, cta_location: location.pathname })
  }, true)
  window.itrsTrackFormSubmission = function (formName, data) {
    data = data || {}
    var a = { conversion: true, form_name: formName }, g = { form_name: formName, page_path: location.pathname }
    for (var k in data) { a[k] = data[k]; g[k] = data[k] }
    track('form_submission', a); track('generate_lead', g)
  }

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
      var formName = String(body.get('form_name') || (f.querySelector('[name=subject]') ? 'contact_form' : 'callback_inline'))
      if (!String(body.get('message') || '').trim()) {
        body.set('message', 'Request from ' + location.pathname + '. Name: ' + (body.get('name') || [body.get('firstName'), body.get('lastName')].filter(Boolean).join(' ')) + '. Phone: ' + (body.get('phone') || '') + '. Email: ' + (body.get('email') || '') + '.')
      }
      if (btn) btn.disabled = true
      status.textContent = 'Sending…'
      fetch(f.action, { method: 'POST', body: body, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return {} }).then(function (j) { return { ok: r.ok, j: j } }) })
        .then(function (x) {
          status.textContent = x.ok ? 'Thanks. A technician from our Vaughan office will get back to you within one business day.' : (x.j.error || 'There was a problem sending your request. Please call (289) 582-9930 instead.')
          if (x.ok) {
            var extra = formName === 'contact_form'
              ? { subject: String(body.get('subject') || ''), company_provided: !!String(body.get('company') || ''), page_location: location.pathname }
              : { source: String(body.get('_subject') || '').replace(/^Website call-back request:\s*/, '') || location.pathname, city: String(body.get('city') || ''),
                  phone_provided: !!String(body.get('phone') || ''), page_location: location.pathname }
            window.itrsTrackFormSubmission(formName, extra)
            f.reset()
          }
        })
        .catch(function () { status.textContent = 'There was a problem sending your request. Please call (289) 582-9930 instead.' })
        .then(function () { if (btn) btn.disabled = false; try { wid !== null && grecaptcha.reset(wid) } catch (_) {} })
    })
  })
})()
