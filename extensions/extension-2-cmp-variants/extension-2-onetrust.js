/**
 *  Scope       : Pre Loader
 *  Condition   : n/a
 *  Description : CMP Integration Element 2/4 - CMP Specific Preloader component
 *
 *                CMP-specific  Logic for OneTrust
 */

/**
  * @module integration-onetrust
  *
  * @description The 'Pre Loader' CMP-specific component for OneTrust.
  * @private
  *
  * 1.0.2
  *  - Improve cmpCheckForExplicitConsentDecision again - there are non-decision interactions, so now we check if it's opt-in mode and the box is open
  *
  * 1.0.1
  *  - Improve cmpCheckForExplicitConsentDecision - use the interaction count instead of last interaction label (more reliable)
  *
  * 1.0.0
  *  - Initial version, start versioning
  */

;(function oneTrust (window) {
  // CMP specific functionality and labels
  window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}

  window.tealiumCmpIntegration.cmpName = 'OneTrust'
  window.tealiumCmpIntegration.cmpIntegrationVersion = 'onetrust-1.0.1'

  function cmpCheckIfOptInModel () {
    var decision = cmpFetchCurrentConsentDecision()
    if (decision && decision.ConsentModel && decision.ConsentModel.Name === 'opt-out') {
      return false
    }
    return true
  }

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
    // treat things we don't understand as implicit
    if (cmpCheckForWellFormedDecision(cmpRawOutput) !== true) return false
    if (cmpCheckIfOptInModel()) {
      return window.OneTrust.IsAlertBoxClosed()
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
