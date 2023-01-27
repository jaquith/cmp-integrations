/**
  * @module utcm/integration
  * @description
  *
  * An integration that checks for an opt-out cookie and returns either
  *  - ['no-selling'] (opt-out cookie with any value found)
  * OR
  *  - ['no-selling', 'yes-selling'] (no opt-out cookie found)
  *
  * The (case-sensitive) name of the cookie is taken from the 'Vendor ID' field in the UI.
  *
  * Also respects the Global Privacy Control as an opt-out
  */

(function myCustomConsentIntegration (window) {
  // allow this to be deactivated in case someone wants to for some reason
  var respectGlobalPrivacyControlSignal = true
  // CMP specific functionality and labels
  window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}

  window.tealiumCmpIntegration.cmpName = 'Opt-out Cookie (cookie name from Vendor ID field)'
  window.tealiumCmpIntegration.cmpIntegrationVersion = 'v1.0.0'

  window.tealiumCmpIntegration.cmpFetchCurrentConsentDecision = cmpFetchCurrentConsentDecision
  window.tealiumCmpIntegration.cmpFetchCurrentLookupKey = cmpFetchCurrentLookupKey
  window.tealiumCmpIntegration.cmpCheckIfOptInModel = cmpCheckIfOptInModel
  window.tealiumCmpIntegration.cmpCheckForWellFormedDecision = cmpCheckForWellFormedDecision
  window.tealiumCmpIntegration.cmpCheckForExplicitConsentDecision = cmpCheckForExplicitConsentDecision
  window.tealiumCmpIntegration.cmpCheckForTiqConsent = cmpCheckForTiqConsent
  window.tealiumCmpIntegration.cmpConvertResponseToGroupList = cmpConvertResponseToGroupList

  var optOutCookieName = (window.tealiumCmpIntegration && window.tealiumCmpIntegration.map && Object.keys(window.tealiumCmpIntegration.map)[0]) || 'error-no-map-found-so-no-cookie-name-available'

  // Should return a boolean, true if the CMP is running the 'Opt-in' model (GDPR style)
  function cmpCheckIfOptInModel () {
    return false
  }

  // Should return some CMP-specific raw object that contains the needed information about the decision
  // This output is used as the cmpRawOutput argument in functions below
  function cmpFetchCurrentConsentDecision () {
    var readCookie = function (name) {
      var reString = '(?:(?:^|.*;\\s*)' + name + '\\s*\\=\\s*([^;]*).*$)|^.*$'
      var re = new RegExp(reString)
      var cookieValue = document.cookie.replace(re, '$1')
      if (!cookieValue) return undefined
      return cookieValue
    }
    var cookie = readCookie(optOutCookieName) || 'opt-out-cookie-not-found'
    var gpc = navigator.globalPrivacyControl
    return { cookieState: cookie, gpcState: gpc }
  }

  // Should return a string that helps Tealium iQ confirm that it's got the right CMP configuration (and not one from some other page / customer of the CMP)
  function cmpFetchCurrentLookupKey () {
    return optOutCookieName
  }

  // Should return a boolean - true if the raw decision meets our expectations for the CMP
  function cmpCheckForWellFormedDecision (cmpRawOutput) {
    return typeof cmpRawOutput === 'object' && typeof cmpRawOutput.cookieState === 'string'
  }

  // Should return a boolean - true if the consent decision was explicitly made by the user
  function cmpCheckForExplicitConsentDecision (cmpRawOutput) {
    if ((typeof cmpRawOutput === 'object' && typeof cmpRawOutput.cookieState === 'string' && cmpRawOutput.cookieState !== 'opt-out-cookie-not-found') || (typeof cmpRawOutput === 'object' && cmpRawOutput.gpcState === true)) return true
    return false
  }

  // Should return an array of consented vendors/purposes - these should match the Purposes in Tealium iQ exactly
  function cmpConvertResponseToGroupList (cmpRawOutput) {
    var consentDecision = ['no-selling'] // always allowed
    // very simple check for a non-empty opt-out cookie OR GPC opt-out signal (if active)
    if (cmpRawOutput.cookieState === 'opt-out-cookie-not-found' && (!respectGlobalPrivacyControlSignal || cmpRawOutput.gpcState !== true)) {
      consentDecision.push('yes-selling') // we don't see a cookie, so we have to assume selling/sharing data is fine
    }
    return consentDecision
  }

  // You shouldn't need to change this function, or anything below it
  function cmpCheckForTiqConsent (cmpRawOutput, tiqGroupName) {
    // treat things we don't understand as an opt-out
    if (cmpCheckForWellFormedDecision(cmpRawOutput) !== true) return false

    tiqGroupName = tiqGroupName || 'tiq-group-name-missing'
    var allowedGroups = cmpConvertResponseToGroupList(cmpRawOutput)
    return allowedGroups.indexOf(tiqGroupName) !== -1
  }
})(window)

/*
  // Debugging / development output - repaste the integration on your test pages each time you make a change to your consent state
  var outputString = `${tealiumCmpIntegration.cmpCheckIfOptInModel() ? 'Opt-in' : 'Opt-out'} Model

  Checks:
    - id:          ${tealiumCmpIntegration.cmpFetchCurrentLookupKey()}
    - well-formed: ${tealiumCmpIntegration.cmpCheckForWellFormedDecision(tealiumCmpIntegration.cmpFetchCurrentConsentDecision())}
    - explicit:    ${tealiumCmpIntegration.cmpCheckForExplicitConsentDecision(tealiumCmpIntegration.cmpFetchCurrentConsentDecision())}
    - group list:  ${JSON.stringify(tealiumCmpIntegration.cmpConvertResponseToGroupList(tealiumCmpIntegration.cmpFetchCurrentConsentDecision()))}
  `
  console.log(outputString);

  */
