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
  * 2.0.1 
  *  - Add safeguarding conditional to cmpConvertResponseToLookupObject
  *  - Fix bug in cmpCheckForExplicitConsentDecision where an explicit opt-in was incorrectly output as an 'implicit' decision
  * 
  * 2.0.0
  *  - Start using keys instead of names for the lookup (breaking change, but with deactivation switch)
  *  - Update the way the Vendor ID is pulled from the page to stop using the legacy cctId property
  *  - Parse window.dataLayer for the decision to avoid relying on ConsentIntegrationData, which isn't always populated for all customers
  *  - Introduce a new function to help with setup (cmpConvertResponseToLookupObject) that produces a key-to-name lookup object
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
  // allows simple adjustment of the name/id behavior
  var useNamesInsteadOfKeys = false
  // allow the safety check of the expected Vendor ID to be circumvented to simplify setup at the cost of increased risk
  var disableVendorIdValidation = false

  // CMP specific functionality and labels
  window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}

  window.tealiumCmpIntegration.cmpName = 'OneTrust'
  window.tealiumCmpIntegration.cmpIntegrationVersion = 'onetrust-2.0.0'

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
    // newer versions of OneTrust, starting at the end of 2022 no longer have cctId defined
    // but this HTML attribute is the way OneTrust can tell
    var scrapeOneTrustVendorId = function () {
      var allScripts = document.getElementsByTagName('script')
      var re = /\/otSDKStub\.js(\?.*)*$/
      for (var i = 0; i < allScripts.length; i++) {
        var isOneTrustScript = re.test(allScripts[i].src) // can be null
        if (isOneTrustScript) {
          var fullVendorId = allScripts[i].getAttribute('data-domain-script') // parse it from the script
          return fullVendorId.split('-test')[0]
        }
      }
      return 'error-not-found'
    }
    if (disableVendorIdValidation) {
      // just return whatever Vendor ID is expected be active
      return (window.tealiumCmpIntegration && window.tealiumCmpIntegration.map && Object.keys(window.tealiumCmpIntegration.map)[0]) || '(Vendor ID check disabled)' // just return whatever's mapped to short-circuit the check as a test
    }
    return scrapeOneTrustVendorId()
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
    return window.OneTrust && typeof window.OneTrust.IsAlertBoxClosed === 'function' && window.OneTrust.IsAlertBoxClosed()
  }

  function cmpConvertResponseToLookupObject (cmpRawOutput) {
    // convert from array of objects to object for easier lookups
    var decisionString = ''
    if (cmpCheckForWellFormedDecision(cmpRawOutput) !== true) return {}
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
    var keysOrValues = useNamesInsteadOfKeys ? 'values' : 'keys'
    return Object[keysOrValues](permittedPurposesWithNames) // keys are IDs, values are names
  }

  function cmpCheckForTiqConsent (cmpRawOutput, tiqGroupName) {
    // treat things we don't understand as an opt-out
    if (cmpCheckForWellFormedDecision(cmpRawOutput) !== true) return false

    tiqGroupName = tiqGroupName || 'tiq-group-name-missing'
    var allowedGroups = cmpConvertResponseToGroupList(cmpRawOutput)
    return allowedGroups.indexOf(tiqGroupName) !== -1
  }
})(window)

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

