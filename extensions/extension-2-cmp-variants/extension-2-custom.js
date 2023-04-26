//1.0.0
//base:custom

/**
 * GETTING STARTED WITH YOUR CUSTOM CONSENT INTEGRATION
 * 
 *   - You will need to edit this template. 
 *   - There is a working example provided in the comments and described below.
 *   - Make sure to take advantage of the built-in debugging features:
 *      - Developing without publishing
 *          1. Uncomment the block at the bottom of this template
 *          2. Paste this entire file into the console of a website running the CMP you are working to support
 *          3. The newly uncommented trailing code block will output the consent decision. 
 *          4. Adjust your decision and repaste the template contents to see the re-interpreted decision
 *          5. When you're happy with it, make sure to re-comment the debugging block before adding it to Tealium iQ and publishing
 *      - Debugging and validating after publishing:
 *          - Using debug mode
 *            - Set the 'utagdb' cookie to 'true' with 'document.cookie = "utagdb=true"' in the console
 *            - Set your console filter to see only the relevant (suggested filter is in the debug output)
 *            - Test different decisions to ensure things are working as expected. 
 *          - Using the window.tealiumCmpOutput object
 *            - Paste the debugging comment at the bottom by itself to output just your decision and related output
 *            - You can also call those functions individually as needed, or access the other useful properties of that object, more in the docs below
 * 
 * More detail in the related docs:
 *  - https://docs.tealium.com/iq-tag-management/consent-integrations/custom-cmp/
 *  - https://docs.tealium.com/iq-tag-management/consent-integrations/validate-and-debug/
 */

;(function myCustomConsentIntegration (window) {
  /**
    * This template is meant to be edited, for you to build your own support for a custom or unsupport CMP / capture tool.
    * 
    * The example code (commented out) is taken from an integration that checks for an opt-out cookie and returns either
    * 
    *  - ['no-selling'] (opt-out cookie with any value found)
    *  - ['no-selling', 'yes-selling'] (no opt-out cookie found)
    *
    * The (case-sensitive) name of the cookie is taken from the 'Vendor ID' field in the UI. 
    * 
    * For more, see https://docs.tealium.com/iq-tag-management/consent-integrations/supported-vendors/#opt-out-cookie--gpc (that integration is the provided example, with the GPC logic removed for simplicity)
    */

  // CMP specific functionality and labels
  window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}

  window.tealiumCmpIntegration.cmpName = 'Custom Example - no Vendor ID check'
  window.tealiumCmpIntegration.cmpIntegrationVersion = 'v1.0.0'

  window.tealiumCmpIntegration.cmpFetchCurrentConsentDecision = cmpFetchCurrentConsentDecision
  window.tealiumCmpIntegration.cmpFetchCurrentLookupKey = cmpFetchCurrentLookupKey
  window.tealiumCmpIntegration.cmpCheckIfOptInModel = cmpCheckIfOptInModel
  window.tealiumCmpIntegration.cmpCheckForWellFormedDecision = cmpCheckForWellFormedDecision
  window.tealiumCmpIntegration.cmpCheckForExplicitConsentDecision = cmpCheckForExplicitConsentDecision
  window.tealiumCmpIntegration.cmpCheckForTiqConsent = cmpCheckForTiqConsent
  window.tealiumCmpIntegration.cmpConvertResponseToGroupList = cmpConvertResponseToGroupList


  /*
  // pull whatever's been entered as the Vendor ID in the UI for the single relevant integration
  var optOutCookieName = (window.tealiumCmpIntegration && window.tealiumCmpIntegration.map && Object.keys(window.tealiumCmpIntegration.map)[0]) || 'error-no-map-found-so-no-cookie-name-available'
  */

  // Should return a boolean, true if the CMP is running the 'Opt-in' model (GDPR style)
  // This opt-out cookie example only supports the Opt-out model (CCPA/CPRA style), so this is hardcoded to return false.
  function cmpCheckIfOptInModel () {
    /*
    return false
    */
  }

  // Should return some CMP-specific raw object (must be an object) that contains the needed information about the decision.
  // This output is used as the cmpRawOutput argument in functions below.
  function cmpFetchCurrentConsentDecision () {
    /*
    // we can't use any tag manager functionality here because it hasn't been allowed to load yet
    var readCookie = function (name) {
      var reString = '(?:(?:^|.*;\\s*)' + name + '\\s*\\=\\s*([^;]*).*$)|^.*$'
      var re = new RegExp(reString)
      var cookieValue = document.cookie.replace(re, '$1')
      if (!cookieValue) return undefined
      return cookieValue
    }
    var cookie = readCookie(optOutCookieName) || 'opt-out-cookie-not-found'
    return { cookieState: cookie } // we have to return an object for the integration to work - this lets us add in other properties (like Global Privacy Control) later
    */
  }

  // Should return a string that helps Tealium iQ confirm that it's got the right CMP configuration (and not one from some other page / customer of the CMP)
  function cmpFetchCurrentLookupKey () {
    /*
    return optOutCookieName
    */
  }

  // Should return a boolean - true if the raw decision meets our expectations for the CMP
  function cmpCheckForWellFormedDecision (cmpRawOutput) {
    /*
    return typeof cmpRawOutput === 'object' && typeof cmpRawOutput.cookieState === 'string'
    */
  }

  // Should return a boolean - true if the consent decision was explicitly made by the user
  function cmpCheckForExplicitConsentDecision (cmpRawOutput) {
    /*
    if ((typeof cmpRawOutput === 'object' && typeof cmpRawOutput.cookieState === 'string' && cmpRawOutput.cookieState !== 'opt-out-cookie-not-found') || (typeof cmpRawOutput === 'object' && cmpRawOutput.gpcState === true)) return true
    return false
    */
  }

  // Should return an array of consented vendors/purposes - these should match the Purposes in Tealium iQ exactly
  function cmpConvertResponseToGroupList (cmpRawOutput) {
    /*
    var consentDecision = ['no-selling'] // tags that don't sell/share data are always allowed
    // very simple check for a non-empty opt-out cookie to determine if tags that sell data are allowed
    if (cmpRawOutput.cookieState === 'opt-out-cookie-not-found') {
      consentDecision.push('yes-selling') // we don't see a cookie, so we have to assume selling/sharing data is fine
    }
    return consentDecision
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
  // Debugging / development output - uncomment this block, then paste/repaste this entire template on your test pages
  var outputString = `${tealiumCmpIntegration.cmpCheckIfOptInModel() ? 'Opt-in' : 'Opt-out'} Model

  Checks:
    - id:          ${tealiumCmpIntegration.cmpFetchCurrentLookupKey()}
    - well-formed: ${tealiumCmpIntegration.cmpCheckForWellFormedDecision(tealiumCmpIntegration.cmpFetchCurrentConsentDecision())}
    - explicit:    ${tealiumCmpIntegration.cmpCheckForExplicitConsentDecision(tealiumCmpIntegration.cmpFetchCurrentConsentDecision())}
    - group list:  ${JSON.stringify(tealiumCmpIntegration.cmpConvertResponseToGroupList(tealiumCmpIntegration.cmpFetchCurrentConsentDecision()))}
  `
  console.log(outputString);

  */


