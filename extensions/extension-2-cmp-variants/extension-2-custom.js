/**
  * @module extension-2-custom
  *
  * @description The 'Pre Loader' CMP-specific component, see [tealiumCmpIntegration]{@link namespace:tealiumCmpIntegration} for specifics on inputs, or view the source to see a working example for an example CMP.
  *
  *
  */

// Use OneTrust integration as the example
;(function oneTrust (window) {
  // CMP specific functionality and labels
  window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}

  window.tealiumCmpIntegration.cmpName = 'Custom Integration Example'
  window.tealiumCmpIntegration.cmpIntegrationVersion = 'custom-example-1.0.0'

  function cmpCheckIfOptInModel () {
    /*
    var decision = cmpFetchCurrentConsentDecision()
    if (decision && decision.ConsentModel && decision.ConsentModel.Name === 'opt-out') {
      return false
    }
    return true
    */
  }

  function cmpFetchCurrentConsentDecision () {
    /*
    if (!window.OneTrust || typeof window.OneTrust.GetDomainData !== 'function') return false
    var cmpRawOutput = window.OneTrust.GetDomainData()
    return cmpRawOutput
    */
  }

  function cmpFetchCurrentLookupKey () {
    /*
    if (!window.OneTrust || typeof window.OneTrust.GetDomainData !== 'function') return ''
    var id = window.OneTrust.GetDomainData().cctId
    return id || ''
    */
  }

  function cmpCheckForWellFormedDecision (cmpRawOutput) {
    /*
    // treat things we don't understand as an opt-out
    if (typeof cmpRawOutput !== 'object') return false
    if (typeof cmpRawOutput.ConsentIntegrationData !== 'object') return false
    if (typeof cmpRawOutput.ConsentIntegrationData.consentPayload !== 'object') return false
    if (toString.call(cmpRawOutput.Groups) !== '[object Array]') return false
    return true
    */
  }

  function cmpCheckForExplicitConsentDecision (cmpRawOutput) {
    /*
    // treat things we don't understand as an opt-out
    if (cmpCheckForWellFormedDecision(cmpRawOutput) !== true) return false

    // check for any logged interaction - OneTrust seems to only log decisions, not other clicks in the UI
    if (cmpRawOutput.ConsentIntegrationData && cmpRawOutput.ConsentIntegrationData.consentPayload &&
      cmpRawOutput.ConsentIntegrationData.consentPayload.customPayload &&
      cmpRawOutput.ConsentIntegrationData.consentPayload.customPayload.Interaction > 0) {
      return true
    }
    return false
    */
  }

  function cmpConvertResponseToGroupList (cmpRawOutput) {
    /*
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
    */
  }

  // you shouldn't need to change this function
  function cmpCheckForTiqConsent (cmpRawOutput, tiqGroupName) {
    // treat things we don't understand as an opt-out
    if (cmpCheckForWellFormedDecision(cmpRawOutput) !== true) return false

    tiqGroupName = tiqGroupName || 'tiq-group-name-missing'
    var allowedGroups = cmpConvertResponseToGroupList(cmpRawOutput)
    return allowedGroups.indexOf(tiqGroupName) !== -1
  }

  window.tealiumCmpIntegration.cmpFetchCurrentConsentDecision = cmpFetchCurrentConsentDecision
  window.tealiumCmpIntegration.cmpFetchCurrentLookupKey = cmpFetchCurrentLookupKey
  window.tealiumCmpIntegration.cmpCheckIfOptInModel = cmpCheckIfOptInModel
  window.tealiumCmpIntegration.cmpCheckForWellFormedDecision = cmpCheckForWellFormedDecision
  window.tealiumCmpIntegration.cmpCheckForExplicitConsentDecision = cmpCheckForExplicitConsentDecision
  window.tealiumCmpIntegration.cmpCheckForTiqConsent = cmpCheckForTiqConsent
  window.tealiumCmpIntegration.cmpConvertResponseToGroupList = cmpConvertResponseToGroupList
})(window)
