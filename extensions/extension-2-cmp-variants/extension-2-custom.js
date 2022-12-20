/**
  * @module extension-2-custom
  *
  * @description The 'Pre Loader' CMP-specific component, see [tealiumCmpIntegration]{@link namespace:tealiumCmpIntegration} for specifics on inputs, or view the source to see a working example for an example CMP.
  *
  *  1.0.1
  *  - Add cmpConvertResponseToLookupObject function, update example logic in other functions
  *  - Move all window-scoped definitions to the top of the main function
  * 
  * 1.0.0 
  *  - Initial version
  *
  */

;(function myCustomConsentIntegration (window) {
  // CMP specific functionality and labels
  window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}

  window.tealiumCmpIntegration.cmpName = 'Custom Integration Example'
  window.tealiumCmpIntegration.cmpIntegrationVersion = 'custom-example-1.0.1'

  window.tealiumCmpIntegration.cmpFetchCurrentConsentDecision = cmpFetchCurrentConsentDecision
  window.tealiumCmpIntegration.cmpFetchCurrentLookupKey = cmpFetchCurrentLookupKey
  
  window.tealiumCmpIntegration.cmpCheckIfOptInModel = cmpCheckIfOptInModel
  window.tealiumCmpIntegration.cmpCheckForWellFormedDecision = cmpCheckForWellFormedDecision
  window.tealiumCmpIntegration.cmpCheckForExplicitConsentDecision = cmpCheckForExplicitConsentDecision
  window.tealiumCmpIntegration.cmpCheckForTiqConsent = cmpCheckForTiqConsent
  window.tealiumCmpIntegration.cmpConvertResponseToGroupList = cmpConvertResponseToGroupList
  window.tealiumCmpIntegration.cmpConvertResponseToLookupObject = cmpConvertResponseToLookupObject


  // Should return a boolean, true if the CMP is running the 'Opt-in' model (GDPR style)
  function cmpCheckIfOptInModel () {
    /*
    var decision = cmpFetchCurrentConsentDecision()
    if (decision && decision.ConsentModel && decision.ConsentModel.Name === 'opt-out') {
      return false
    }
    return true
    */
  }

  // Should return some CMP-specific raw object that contains the needed information about the decision
  // This output is used as the cmpRawOutput argument in functions below
  function cmpFetchCurrentConsentDecision () {
    /*
    if (!window.OneTrust || typeof window.OneTrust.GetDomainData !== 'function') return false
    var cmpRawOutput = window.OneTrust.GetDomainData()
    cmpRawOutput.dataLayer = window.dataLayer
    return cmpRawOutput
    */
  }

  // Should return a string that helps Tealium iQ confirm that it's got the right CMP configuration (and not one from some other page / customer of the CMP)
  function cmpFetchCurrentLookupKey () {
    /*
    if (!window.OneTrust || typeof window.OneTrust.GetDomainData !== 'function') return ''
    var id = window.OneTrust.GetDomainData().cctId
    return id || ''
    */
  }

  // Should return a boolean - true if the raw decision meets our expectations for the CMP
  function cmpCheckForWellFormedDecision (cmpRawOutput) {
    /*
    // treat things we don't understand as an opt-out
    if (typeof cmpRawOutput !== 'object') return false
    if (toString.call(cmpRawOutput.Groups) !== '[object Array]') return false
    if (toString.call(cmpRawOutput.dataLayer) !== '[object Array]') return false
    return true
    */
  }

  // Should return a boolean - true if the consent decision was explicitly made by the user
  function cmpCheckForExplicitConsentDecision (cmpRawOutput) {
    /*
    // treat things we don't understand as implicit
    if (cmpCheckForWellFormedDecision(cmpRawOutput) !== true) return false
    if (cmpCheckIfOptInModel()) {
      return window.OneTrust.IsAlertBoxClosed()
    }
    return false
    */
  }

  // Should return an array of consented vendors/purposes - these should match the Purposes in Tealium iQ exactly
  function cmpConvertResponseToGroupList (cmpRawOutput) {
    /*
    var permittedPurposesWithNames = cmpConvertResponseToLookupObject(cmpRawOutput)
    return Object.keys(permittedPurposesWithNames) // keys are IDs, values are names
    */
  }

  // Only used in the console-based debugging / config helper snippet below - the 
  // framework itself only needs the keys, not the pretty names - those are for the user.
  // Should return an object that shows the relationship of IDs to names, for consented vendors
  // or purposes.
  function cmpConvertResponseToLookupObject (cmpRawOutput) {
    /*
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
    */
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
