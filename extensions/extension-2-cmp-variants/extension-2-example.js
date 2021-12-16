/**
  * @module extension-2-example
  *
  * @description The 'Pre Loader' CMP-specific component, see [tealiumCmpIntegration]{@link namespace:tealiumCmpIntegration} for specifics on inputs, or view the source to see a working example for an example CMP.
  *
  *
  */

// Usercentrics v2 setup as example here
(function usercentricsBrowserSdkV2 (window) {
  // CMP specific functionality and labels
  window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}

  window.tealiumCmpIntegration.cmpName = 'Usercentrics Browser SDK'

  // for the consent information in the b object
  window.tealiumCmpIntegration.nameOfVendorOptInArray = 'usercentrics_services_with_consent'
  window.tealiumCmpIntegration.nameOfConsentTypeString = 'usercentrics_consent_type'

  // use the mapping if found, with a fallback (Usercentrics default value) if not specified in the mapping
  var tiqGroupName = window.tealiumCmpIntegration.tiqGroupName || 'Tealium iQ Tag Management'

  function cmpFetchCurrentConsentDecision () {
    if (!window.UC_UI || typeof window.UC_UI.getServicesBaseInfo !== 'function') return false
    var cmpRawOutput = window.UC_UI.getServicesBaseInfo()
    return cmpRawOutput
  }

  function cmpFetchCurrentLookupKey () {
    return (window.UC_UI && typeof window.UC_UI.getSettings === 'function' && window.UC_UI.getSettings().id) || ''
  }

  function cmpCheckForWellFormedDecision (cmpRawOutput) {
    // treat things we don't understand as an opt-out
    if (toString.call(cmpRawOutput) !== '[object Array]') return false
    // use the first entry as a proxy for all
    if (cmpRawOutput && cmpRawOutput[0] && typeof cmpRawOutput[0].name === 'string') {
      return true
    }
    return false
  }

  function cmpCheckForExplicitConsentDecision (cmpRawOutput) {
    // treat things we don't understand as an opt-out
    if (toString.call(cmpRawOutput) !== '[object Array]') return false
    // use the first entry as a proxy for all
    var consentHistory = (cmpRawOutput && cmpRawOutput[0] && cmpRawOutput[0].consent && cmpRawOutput[0].consent.history) || []
    var lastHistoryEntryType = (consentHistory && consentHistory.length && consentHistory[consentHistory.length - 1].type) || ''
    if (lastHistoryEntryType === 'explicit') {
      return true
    }
    return false
  }

  function cmpCheckForTiqConsent (cmpRawOutput) {
    var foundOptIn = false
    // treat things we don't understand as an opt-out
    if (toString.call(cmpRawOutput) !== '[object Array]') return false
    // check vendors if there's an object, look for at least one
    cmpRawOutput.forEach(function (tagInfo) {
      if ((tagInfo.consent && tagInfo.consent.status === true) && tagInfo.name === tiqGroupName) {
        foundOptIn = true
      }
    })
    return foundOptIn
  }

  function cmpConvertResponseToGroupList (cmpRawOutput) {
    var vendorArray = []
    cmpRawOutput && cmpRawOutput.forEach(function (tagConsent) {
      if (tagConsent.consent && tagConsent.consent.status === true) {
        vendorArray.push(tagConsent.name)
      }
    })
    return vendorArray
  }

  window.tealiumCmpIntegration.cmpFetchCurrentConsentDecision = cmpFetchCurrentConsentDecision
  window.tealiumCmpIntegration.cmpFetchCurrentLookupKey = cmpFetchCurrentLookupKey
  window.tealiumCmpIntegration.cmpCheckForWellFormedDecision = cmpCheckForWellFormedDecision
  window.tealiumCmpIntegration.cmpCheckForExplicitConsentDecision = cmpCheckForExplicitConsentDecision
  window.tealiumCmpIntegration.cmpCheckForTiqConsent = cmpCheckForTiqConsent
  window.tealiumCmpIntegration.cmpConvertResponseToGroupList = cmpConvertResponseToGroupList
})(window)