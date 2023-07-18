// 1.0.0
// base:trustarc

;(function trustarc (window) {
  // allows simple adjustment of the name/id behavior
  var useNamesInsteadOfKeys = false

  // CMP specific functionality and labels
  window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}

  window.tealiumCmpIntegration.cmpName = 'TrustArc'
  window.tealiumCmpIntegration.cmpIntegrationVersion = 'trustarc-1.0.0'

  window.tealiumCmpIntegration.cmpFetchCurrentConsentDecision = cmpFetchCurrentConsentDecision
  window.tealiumCmpIntegration.cmpFetchCurrentLookupKey = cmpFetchCurrentLookupKey
  window.tealiumCmpIntegration.cmpCheckIfOptInModel = cmpCheckIfOptInModel
  window.tealiumCmpIntegration.cmpCheckForWellFormedDecision = cmpCheckForWellFormedDecision
  window.tealiumCmpIntegration.cmpCheckForExplicitConsentDecision = cmpCheckForExplicitConsentDecision
  window.tealiumCmpIntegration.cmpCheckForTiqConsent = cmpCheckForTiqConsent
  window.tealiumCmpIntegration.cmpConvertResponseToGroupList = cmpConvertResponseToGroupList
  window.tealiumCmpIntegration.cmpConvertResponseToLookupObject = cmpConvertResponseToLookupObject

  function cmpCheckIfOptInModel () {
    return !(truste && truste.util && typeof truste.util.readCookie === 'function' && truste.util.readCookie('notice_behavior'))
  }

  function cmpFetchCurrentConsentDecision () {
    if (!window.truste || !window.truste.util || typeof window.truste.util.readCookie !== 'function') return false
    return {
      cookie: window.truste.util.readCookie(truste.eu.COOKIE_GDPR_PREF_NAME) || '0,'
    }
  }

  function cmpFetchCurrentLookupKey () {
    // just return whatever Vendor ID is expected be active to short-circuit the ID-based double check for now
    return (window.tealiumCmpIntegration && window.tealiumCmpIntegration.map && Object.keys(window.tealiumCmpIntegration.map)[0]) || '(Vendor ID check disabled)'
  }

  function cmpCheckForWellFormedDecision (cmpRawOutput) {
    // treat things we don't understand as an opt-out
    if (typeof cmpRawOutput !== 'object') return false
    if (typeof cmpRawOutput.cookie !== 'string') return false
    return true
  }

  function cmpCheckForExplicitConsentDecision (cmpRawOutput) {
    if (!window.truste || !window.truste.util || typeof window.truste.util.readCookie !== 'function') return false
    return typeof window.truste.util.readCookie(truste.eu.COOKIE_GDPR_PREF_NAME) === 'string'
  }

  function cmpConvertResponseToLookupObject (cmpRawOutput) {
    if (!cmpCheckForWellFormedDecision(cmpRawOutput)) return []
    const cookieConsentValues = cmpRawOutput.cookie.split(':')[0].split(',')
    const extraSplit = []
    cookieConsentValues.forEach((el) => {
      if (!el) return
      extraSplit.push.apply(extraSplit, el.split('|'))
    })

    const trustArcMap = {
      0: 'Required',
      1: 'Functional',
      2: 'Personalization/Advertising'
    }

    const output = {}

    extraSplit.forEach((key) => {
      if (key !== '') {
        output[key] = trustArcMap[key] || 'Category name unknown'
      }
    })
    return output
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

/*

// Debugging / development output - uncomment this code and paste the integration into the console on your test pages each time you make a change to your consent state to test without publishing
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
