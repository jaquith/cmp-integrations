/**
 *  Scope       : Pre Loader
 *  Condition   : n/a
 *  Description : CMP Integration Element 2/4 - CMP Specific Preloader component
 *
 *                CMP-specific  Logic for OneTrust v2
 */

/**
  * @module integration-onetrust-v2
  *
  * @description The 'Pre Loader' CMP-specific component for OneTrust V2.
  * @private
  *
  *
  */

// Usercentrics v2 setup
;(function oneTrust (window) {
  // CMP specific functionality and labels
  window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}

  window.tealiumCmpIntegration.cmpName = 'OneTrust'

  // for the consent information in the b object
  // window.tealiumCmpIntegration.nameOfVendorOptInArray = 'onetrust_services_with_consent'
  // window.tealiumCmpIntegration.nameOfConsentTypeString = 'usercentrics_consent_type'

  // use the mapping if found, with a fallback (Usercentrics default value) if not specified in the mapping
  var tiqGroupName = window.tealiumCmpIntegration.tiqGroupName || 'Strictly Necessary Cookies'

  function cmpFetchCurrentConsentDecision () {
    if (!window.OneTrust || typeof window.OneTrust.GetDomainData !== 'function') return false
    var cmpRawOutput = window.OneTrust.GetDomainData()
    return cmpRawOutput
  }

  function cmpFetchCurrentLookupKey () {
    if (!window.OneTrust || typeof window.OneTrust.GetDomainData !== 'function') return ''
    var id = window.OneTrust.GetDomainData().cctId
    return id || ''
  }

  function cmpCheckForWellFormedDecision (cmpRawOutput) {
    // treat things we don't understand as an opt-out
    if (typeof cmpRawOutput !== 'object') return false
    if (typeof cmpRawOutput.ConsentIntegrationData !== 'object') return false
    if (typeof cmpRawOutput.ConsentIntegrationData.consentPayload !== 'object') return false
    if (toString.call(cmpRawOutput.Groups) !== '[object Array]') return false
    return true
  }

  function cmpCheckForExplicitConsentDecision (cmpRawOutput) {
    // treat things we don't understand as an opt-out
    if (cmpCheckForWellFormedDecision(cmpRawOutput) !== true) return false

    // check for any logged interaction - OneTrust seems to only log decisions, not other clicks in the UI
    if (cmpRawOutput.ConsentIntegrationData && cmpRawOutput.ConsentIntegrationData.consentPayload &&
      cmpRawOutput.ConsentIntegrationData.consentPayload.dsDataElements &&
      cmpRawOutput.ConsentIntegrationData.consentPayload.dsDataElements.InteractionType !== '') {
      return true
    }
    return false
  }

  function cmpConvertResponseToGroupList (cmpRawOutput) {
    // convert from array of objects to object for easier lookups
    var decisionByPurpose = {}
    if (cmpRawOutput && cmpRawOutput.ConsentIntegrationData &&
        cmpRawOutput.ConsentIntegrationData.consentPayload &&
        cmpRawOutput.ConsentIntegrationData.consentPayload.purposes
    ) {
      cmpRawOutput.ConsentIntegrationData.consentPayload.purposes.forEach(function (obj) {
        decisionByPurpose[obj.Id] = obj.TransactionType
      })
    } else {
      return []
    }

    var decisionByGroupName = {}
    cmpRawOutput.Groups.forEach(function (groupInfo) {
      decisionByGroupName[groupInfo.GroupName] = decisionByPurpose[groupInfo.PurposeId] || 'ERROR-MISSING'
    })

    var vendorArray = []
    var groupNames = Object.keys(decisionByGroupName)
    groupNames.forEach(function (groupName) {
      if (decisionByGroupName[groupName] === 'NO_CHOICE' || decisionByGroupName[groupName] === 'CONFIRMED') {
        vendorArray.push(groupName)
      }
    })
    return vendorArray
  }

  function cmpCheckForTiqConsent (cmpRawOutput) {
    // treat things we don't understand as an opt-out
    if (cmpCheckForWellFormedDecision(cmpRawOutput) !== true) return false

    var allowedGroups = cmpConvertResponseToGroupList(cmpRawOutput)
    return allowedGroups.indexOf(tiqGroupName) !== -1
  }

  window.tealiumCmpIntegration.cmpFetchCurrentConsentDecision = cmpFetchCurrentConsentDecision
  window.tealiumCmpIntegration.cmpFetchCurrentLookupKey = cmpFetchCurrentLookupKey
  window.tealiumCmpIntegration.cmpCheckForWellFormedDecision = cmpCheckForWellFormedDecision
  window.tealiumCmpIntegration.cmpCheckForExplicitConsentDecision = cmpCheckForExplicitConsentDecision
  window.tealiumCmpIntegration.cmpCheckForTiqConsent = cmpCheckForTiqConsent
  window.tealiumCmpIntegration.cmpConvertResponseToGroupList = cmpConvertResponseToGroupList
})(window)