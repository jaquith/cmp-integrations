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
  * 1.1.0
  *  - Circumvent the cctId check because of a OneTrust bug in a couple recent versions where that's unavailable
  *  - Parse the dataLayer for the decision to avoid relying on ConsentIntegrationData, which isn't always populated for all customers
  *  - Introduce a new function to help with setup (cmpConvertResponseToLookupObject) that produces a key-to-name lookup object
  *  - Update debugging comment at bottom to include new function
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

  window.tealiumCmpIntegration.cmpName = 'OneTrust by Name'
  window.tealiumCmpIntegration.cmpIntegrationVersion = 'onetrust-1.1.0'

  window.tealiumCmpIntegration.cmpFetchCurrentConsentDecision = cmpFetchCurrentConsentDecision
  window.tealiumCmpIntegration.cmpFetchCurrentLookupKey = cmpFetchCurrentLookupKey
  window.tealiumCmpIntegration.cmpCheckIfOptInModel = cmpCheckIfOptInModel
  window.tealiumCmpIntegration.cmpCheckForWellFormedDecision = cmpCheckForWellFormedDecision
  window.tealiumCmpIntegration.cmpCheckForExplicitConsentDecision = cmpCheckForExplicitConsentDecision
  window.tealiumCmpIntegration.cmpCheckForTiqConsent = cmpCheckForTiqConsent
  window.tealiumCmpIntegration.cmpConvertResponseToGroupList = cmpConvertResponseToGroupList
  window.tealiumCmpIntegration.cmpConvertResponseToLookupObject = cmpConvertResponseToLookupObject

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
    cmpRawOutput.dataLayer = window.dataLayer
    return cmpRawOutput
  }

  function cmpFetchCurrentLookupKey () {
    return (window.tealiumCmpIntegration && window.tealiumCmpIntegration.map && Object.keys(tealiumCmpIntegration.map)[0]) || '(Vendor ID check disabled)' // just return whatever's mapped to short-circuit the check as a test
  }

  function cmpCheckForWellFormedDecision (cmpRawOutput) {
    // treat things we don't understand as an opt-out
    if (typeof cmpRawOutput !== 'object') return false
    if (toString.call(cmpRawOutput.Groups) !== '[object Array]') return false
    if (toString.call(cmpRawOutput.dataLayer) !== '[object Array]') return false
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

  function cmpConvertResponseToLookupObject (cmpRawOutput) {
    // convert from array of objects to object for easier lookups
    var decisionString = ''
    for (var i = cmpRawOutput.dataLayer.length - 1; i >= 0; i--) {
      if (['OneTrustGroupsUpdated', 'OneTrustLoaded'].indexOf(cmpRawOutput.dataLayer[i].event) !== -1) {
        decisionString = cmpRawOutput.dataLayer[i].OnetrustActiveGroups
        break
      }
    }

    var permittedPurposeIds = decisionString.split(',').filter(function (group) {
      return group !== ''
    })

    var permittedPurposesWithNames = {}
    cmpRawOutput.Groups.forEach(function (groupInfo) {
      if (permittedPurposeIds.indexOf(groupInfo.OptanonGroupId) !== -1) {
        permittedPurposesWithNames[groupInfo.OptanonGroupId] = groupInfo.GroupName || 'ERROR-MISSING'
      }
    })

    return permittedPurposesWithNames // keys are IDs, values are names
  }

  function cmpConvertResponseToGroupList (cmpRawOutput) {
    var permittedPurposesWithNames = cmpConvertResponseToLookupObject(cmpRawOutput)
    return Object.values(permittedPurposesWithNames) // keys are IDs, values are names
  }

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
  var outputString = `CMP Found: ${window.tealiumCmpIntegration.cmpName} (${window.tealiumCmpIntegration.cmpCheckIfOptInModel() ? 'Opt-in' : 'Opt-out'} Model)

  Checks:
    - id:          ${tealiumCmpIntegration.cmpFetchCurrentLookupKey()}
    - well-formed: ${tealiumCmpIntegration.cmpCheckForWellFormedDecision(tealiumCmpIntegration.cmpFetchCurrentConsentDecision())}
    - explicit:    ${tealiumCmpIntegration.cmpCheckForExplicitConsentDecision(tealiumCmpIntegration.cmpFetchCurrentConsentDecision())}
    - group list:  ${JSON.stringify(tealiumCmpIntegration.cmpConvertResponseToGroupList(tealiumCmpIntegration.cmpFetchCurrentConsentDecision()))}

    - name lookup: ${JSON.stringify(tealiumCmpIntegration.cmpConvertResponseToLookupObject(tealiumCmpIntegration.cmpFetchCurrentConsentDecision()), null, 6)}
  `
  console.log(outputString)
*/
