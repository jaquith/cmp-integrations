// 1.0.0
// base:sourcepoint

;(function sourcepointConsentIntegration (window) {
  // polyfill for Promises from https://cdn.jsdelivr.net/npm/promise-polyfill@8.3.0/dist/polyfill.min.js
  !(function (e, t) { typeof exports === 'object' && typeof module !== 'undefined' ? t() : typeof define === 'function' && define.amd ? define(t) : t() }(0, function () { 'use strict'; function e (e) { var t = this.constructor; return this.then(function (n) { return t.resolve(e()).then(function () { return n }) }, function (n) { return t.resolve(e()).then(function () { return t.reject(n) }) }) } function t (e) { return new this(function (t, n) { function r (e, n) { if (n && (typeof n === 'object' || typeof n === 'function')) { var f = n.then; if (typeof f === 'function') return void f.call(n, function (t) { r(e, t) }, function (n) { o[e] = { status: 'rejected', reason: n }, --i == 0 && t(o) }) }o[e] = { status: 'fulfilled', value: n }, --i == 0 && t(o) } if (!e || typeof e.length === 'undefined') return n(new TypeError(typeof e + ' ' + e + ' is not iterable(cannot read property Symbol(Symbol.iterator))')); var o = Array.prototype.slice.call(e); if (o.length === 0) return t([]); for (var i = o.length, f = 0; o.length > f; f++)r(f, o[f]) }) } function n (e, t) { this.name = 'AggregateError', this.errors = e, this.message = t || '' } function r (e) { var t = this; return new t(function (r, o) { if (!e || typeof e.length === 'undefined') return o(new TypeError('Promise.any accepts an array')); var i = Array.prototype.slice.call(e); if (i.length === 0) return o(); for (var f = [], u = 0; i.length > u; u++) try { t.resolve(i[u]).then(r).catch(function (e) { f.push(e), f.length === i.length && o(new n(f, 'All promises were rejected')) }) } catch (c) { o(c) } }) } function o (e) { return !(!e || typeof e.length === 'undefined') } function i () {} function f (e) { if (!(this instanceof f)) throw new TypeError('Promises must be constructed via new'); if (typeof e !== 'function') throw new TypeError('not a function'); this._state = 0, this._handled = !1, this._value = undefined, this._deferreds = [], s(e, this) } function u (e, t) { for (;e._state === 3;)e = e._value; e._state !== 0 ? (e._handled = !0, f._immediateFn(function () { var n = e._state === 1 ? t.onFulfilled : t.onRejected; if (n !== null) { var r; try { r = n(e._value) } catch (o) { return void a(t.promise, o) }c(t.promise, r) } else (e._state === 1 ? c : a)(t.promise, e._value) })) : e._deferreds.push(t) } function c (e, t) { try { if (t === e) throw new TypeError('A promise cannot be resolved with itself.'); if (t && (typeof t === 'object' || typeof t === 'function')) { var n = t.then; if (t instanceof f) return e._state = 3, e._value = t, void l(e); if (typeof n === 'function') return void s((function (e, t) { return function () { e.apply(t, arguments) } }(n, t)), e) }e._state = 1, e._value = t, l(e) } catch (r) { a(e, r) } } function a (e, t) { e._state = 2, e._value = t, l(e) } function l (e) { e._state === 2 && e._deferreds.length === 0 && f._immediateFn(function () { e._handled || f._unhandledRejectionFn(e._value) }); for (var t = 0, n = e._deferreds.length; n > t; t++)u(e, e._deferreds[t]); e._deferreds = null } function s (e, t) { var n = !1; try { e(function (e) { n || (n = !0, c(t, e)) }, function (e) { n || (n = !0, a(t, e)) }) } catch (r) { if (n) return; n = !0, a(t, r) } }n.prototype = Error.prototype; var d = setTimeout; f.prototype.catch = function (e) { return this.then(null, e) }, f.prototype.then = function (e, t) { var n = new this.constructor(i); return u(this, new function (e, t, n) { this.onFulfilled = typeof e === 'function' ? e : null, this.onRejected = typeof t === 'function' ? t : null, this.promise = n }(e, t, n)), n }, f.prototype.finally = e, f.all = function (e) { return new f(function (t, n) { function r (e, o) { try { if (o && (typeof o === 'object' || typeof o === 'function')) { var u = o.then; if (typeof u === 'function') return void u.call(o, function (t) { r(e, t) }, n) }i[e] = o, --f == 0 && t(i) } catch (c) { n(c) } } if (!o(e)) return n(new TypeError('Promise.all accepts an array')); var i = Array.prototype.slice.call(e); if (i.length === 0) return t([]); for (var f = i.length, u = 0; i.length > u; u++)r(u, i[u]) }) }, f.any = r, f.allSettled = t, f.resolve = function (e) { return e && typeof e === 'object' && e.constructor === f ? e : new f(function (t) { t(e) }) }, f.reject = function (e) { return new f(function (t, n) { n(e) }) }, f.race = function (e) { return new f(function (t, n) { if (!o(e)) return n(new TypeError('Promise.race accepts an array')); for (var r = 0, i = e.length; i > r; r++)f.resolve(e[r]).then(t, n) }) }, f._immediateFn = typeof setImmediate === 'function' && function (e) { setImmediate(e) } || function (e) { d(e, 0) }, f._unhandledRejectionFn = function (e) { void 0 !== console && console && console.warn('Possible Unhandled Promise Rejection:', e) }; var p = (function () { if (typeof self !== 'undefined') return self; if (typeof window !== 'undefined') return window; if (typeof global !== 'undefined') return global; throw Error('unable to locate global object') }()); typeof p.Promise !== 'function' ? p.Promise = f : (p.Promise.prototype.finally || (p.Promise.prototype.finally = e), p.Promise.allSettled || (p.Promise.allSettled = t), p.Promise.any || (p.Promise.any = r)) }))
  // CMP specific functionality and labels
  window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}

  window.tealiumCmpIntegration.cmpName = 'Sourcepoint DRAFT'
  window.tealiumCmpIntegration.cmpIntegrationVersion = 'v1.0.0'

  window.tealiumCmpIntegration.cmpFetchCurrentConsentDecision = cmpFetchCurrentConsentDecision
  window.tealiumCmpIntegration.cmpFetchCurrentLookupKey = cmpFetchCurrentLookupKey
  window.tealiumCmpIntegration.cmpCheckIfOptInModel = cmpCheckIfOptInModel
  window.tealiumCmpIntegration.cmpCheckForWellFormedDecision = cmpCheckForWellFormedDecision
  window.tealiumCmpIntegration.cmpCheckForExplicitConsentDecision = cmpCheckForExplicitConsentDecision
  window.tealiumCmpIntegration.cmpCheckForTiqConsent = cmpCheckForTiqConsent
  window.tealiumCmpIntegration.cmpConvertResponseToGroupList = cmpConvertResponseToGroupList
  window.tealiumCmpIntegration.cmpConvertResponseToLookupObject = cmpConvertResponseToLookupObject

  // added for Sourcepoint, since the CMP response is async and we need to work sync, we need to cache the results
  window.tealiumCmpIntegration.asyncDecisionCache = window.tealiumCmpIntegration.asyncDecisionCache || {}

  // pull whatever's been entered as the Vendor ID in the UI for the single relevant integration
  var userInput = (window.tealiumCmpIntegration && window.tealiumCmpIntegration.map && Object.keys(window.tealiumCmpIntegration.map)[0]) || 'no config found'

  // Should return a boolean, true if the CMP is running the 'Opt-in' model (GDPR style)
  // This opt-out cookie example only supports the Opt-out model (CCPA/CPRA style), so this is hardcoded to return false.
  function cmpCheckIfOptInModel () {
    return window.tealiumCmpIntegration.asyncDecisionCache.mode === 'opt-in'
  }

  // Should return some CMP-specific raw object (must be an object) that contains the needed information about the decision.
  // This output is used as the cmpRawOutput argument in functions below.
  function cmpFetchCurrentConsentDecision () {
    fetchCustomConsents().then(function (values) {
      window.tealiumCmpIntegration.asyncDecisionCache.mode = (window.tealiumCmpIntegration.asyncDecisionCache.gdprApplies === true ? 'opt-in' : (window.tealiumCmpIntegration.asyncDecisionCache.ccpaApplies === true ? 'opt-out' : 'unknown'))
    })

    if (!window.tealiumCmpIntegration.asyncDecisionCache.alreadyListening) {
      listenForDecisions()
      window.tealiumCmpIntegration.asyncDecisionCache.alreadyListening = true
    }

    return window.tealiumCmpIntegration.asyncDecisionCache // we have to use a cached version for now because all of utag relies on syncronous processing
  }

  // Should return a string that helps Tealium iQ confirm that it's got the right CMP configuration (and not one from some other page / customer of the CMP)
  function cmpFetchCurrentLookupKey () {
    return userInput
  }

  // Should return a boolean - true if the raw decision meets our expectations for the CMP
  function cmpCheckForWellFormedDecision (cmpRawOutput) {
    return typeof cmpRawOutput === 'object' && typeof cmpRawOutput.custom === 'object' && typeof cmpRawOutput.custom.vendorsActuallyWithConsent === 'object'
  }

  // Should return a boolean - true if the consent decision was explicitly made by the user
  function cmpCheckForExplicitConsentDecision (cmpRawOutput) {
    var events = (window.tealiumCmpIntegration.asyncDecisionCache && window.tealiumCmpIntegration.asyncDecisionCache.updateEvents) || []
    // details on callback response events here: https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md
    var showedPopup = events.indexOf('cmpuishown') !== -1
    var decisionOnPage = events.indexOf('useractioncomplete') !== -1
    var loadedWithExistingDecision = events.indexOf('tcloaded') !== -1
    return loadedWithExistingDecision || (showedPopup && decisionOnPage)
  }

  // Should return an array of consented vendors/purposes - these should match the Purposes in Tealium iQ exactly
  function cmpConvertResponseToGroupList (cmpRawOutput) {
    var permittedPurposesWithNames = cmpConvertResponseToLookupObject(cmpRawOutput)
    return Object.keys(permittedPurposesWithNames) // keys are IDs, values are names
  }

  function cmpConvertResponseToLookupObject (cmpRawOutput) {
    // convert from array of objects to object for easier lookups
    return (cmpRawOutput.custom && cmpRawOutput.custom.vendorsActuallyWithConsent) || {}
  }

  // You shouldn't need to change this function, or anything below it
  function cmpCheckForTiqConsent (cmpRawOutput, tiqGroupName) {
    // treat things we don't understand as an opt-out
    if (cmpCheckForWellFormedDecision(cmpRawOutput) !== true) return false

    tiqGroupName = tiqGroupName || 'tiq-group-name-missing'
    var allowedGroups = cmpConvertResponseToGroupList(cmpRawOutput)
    return allowedGroups.indexOf(tiqGroupName) !== -1
  }

  async function listenForDecisions () {
    return new Promise(function (resolve, reject) {
      // register a callback to get consent updates / changes cached
      // see https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md#addeventlistener
      __tcfapi('addEventListener', 2, function (tcData, success) {
        if (!success) return
        window.tealiumCmpIntegration.asyncDecisionCache.updates = window.tealiumCmpIntegration.asyncDecisionCache.updates || []
        window.tealiumCmpIntegration.asyncDecisionCache.updateEvents = window.tealiumCmpIntegration.asyncDecisionCache.updateEvents || []
        window.tealiumCmpIntegration.asyncDecisionCache.updates.push(tcData)
        window.tealiumCmpIntegration.asyncDecisionCache.updateEvents.push(tcData.eventStatus)
        window.tealiumCmpIntegration.asyncDecisionCache.gdprApplies = tcData.gdprApplies
        window.tealiumCmpIntegration.asyncDecisionCache.ccpaApplies = tcData.ccpaApplies
      })
      resolve(true)
    })
  };

  async function fetchCustomConsents () {
    return new Promise(function (resolve, reject) {
      window.__tcfapi('getCustomVendorConsents', 2, function (data, success) {
        if (!data) {
          window.tealiumCmpIntegration.asyncDecisionCache.custom = 'error! no data returned'
          reject(error)
        }

        data.vendorsActuallyWithConsent = {}
        data.vendorsActuallyWithConsent.always_consented = 'For tags that do not require consent to fire, as a workaround'

        var nameLookup = {}
        data.consentedVendors.forEach(function (vendor) {
          nameLookup[vendor._id] = vendor.name || ''
        })

        data.consentedVendors.forEach(function (vendor) {
          if (
            data &&
            data.grants &&
            data.grants[vendor._id] &&
            data.grants[vendor._id].vendorGrant
          ) {
            data.vendorsActuallyWithConsent[vendor._id] = nameLookup[vendor._id]
          }
        })
        window.tealiumCmpIntegration.asyncDecisionCache.nameLookup = nameLookup
        window.tealiumCmpIntegration.asyncDecisionCache.custom = data
        resolve(data)
      })
    })
  };
})(window)

/*
// Debugging / development output - uncomment this block, then paste/repaste this entire template on your test pages
window.logString = function () {
  // Debugging / development output - uncomment this block, then paste/repaste this entire template on your test pages
  var outputString = `${tealiumCmpIntegration.cmpCheckIfOptInModel() ? 'Opt-in' : 'Opt-out'} Model

  Checks:
  - id:          ${tealiumCmpIntegration.cmpFetchCurrentLookupKey()}
  - well-formed: ${tealiumCmpIntegration.cmpCheckForWellFormedDecision(tealiumCmpIntegration.cmpFetchCurrentConsentDecision())}
  - explicit:    ${tealiumCmpIntegration.cmpCheckForExplicitConsentDecision(tealiumCmpIntegration.cmpFetchCurrentConsentDecision())}
  - group list:  ${JSON.stringify(tealiumCmpIntegration.cmpConvertResponseToGroupList(tealiumCmpIntegration.cmpFetchCurrentConsentDecision()))}

  - name lookup: ${JSON.stringify(window.tealiumCmpIntegration.cmpConvertResponseToLookupObject(window.tealiumCmpIntegration.cmpFetchCurrentConsentDecision()), null, 6)}
  `
  console.log(outputString)

}
tealiumCmpIntegration.cmpFetchCurrentConsentDecision()
setTimeout(logString, 1000)
*/
