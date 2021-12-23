/**
 *  Scope       : Pre Loader
 *  Condition   : n/a
 *  Description : CMP Integration Element 3/4 - Preloader component
 *
 *                Prevent TiQ from loading if no consent, queue implicitly consented events to retrigger (for new tags only) if explicit decision is made.
 *
 */

/**
  * @module extension-3
  *
  * @description The 'Pre Loader' extension component of the CMP integration, responsible for stopping Tealium iQ from loading/running as appropriate, and making certain
  * window-scoped functions available to the other components.
  *
  * Expects the appropriate {@link tealiumCmpIntegration tealiumCmpIntegration} inputs (from {@link extension-2 extension-2}) and an appropriate map (from {@link extension-1 extension-1}), as well as the other components.
  *
  *
  *
  */

// Tealium iQ runs Pre Loader extensions in global scope, which would make all variables unintentionally global unless we wrap our logic in a function
;(function avoidGlobalScopeUnlessExplicit (window) {
  // set names for key objects and variables to make them easy to change if needed

  var version = 'v1.0.0-alpha-1'

  /**
 * A window-scoped (global) object used to expose or define selected functionality.
 *
 * @namespace tealiumCmpIntegration
 * @type {object}
 * @memberof! <global>
 */
  window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}

  /**
  * The name of the CMP part of the integration, mostly used for logging and debugging.
  * @name cmpName
  * @type {string}
  * @memberof! tealiumCmpIntegration
  *
  * @example
window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}
window.tealiumCmpIntegration.cmpName = 'Usercentrics'
  */
  window.tealiumCmpIntegration.cmpName = window.tealiumCmpIntegration.cmpName || 'Unnamed CMP'

  // for the consent information in the b object
  var nameOfVendorOptInArray = window.tealiumCmpIntegration.nameOfVendorOptInArray || 'groups_with_consent'
  var nameOfConsentTypeString = window.tealiumCmpIntegration.nameOfConsentTypeString || 'consent_type'

  // for the name in the queue
  var nameOfImplicitConsentArray = window.tealiumCmpIntegration.nameOfImplicitConsentArray || '_groups_already_processed'

  // name to use when calling utag.handler.trigger to indicate a consent polling call
  var nameOfConsentPollingEvent = window.tealiumCmpIntegration.nameOfConsentPollingEvent || 'tiq_cmp_consent_polling'

  var consentTimeoutInterval = 250 // setTimeout interval in MS - rate to poll for new (explicit) consent decision or correctly formed object

  // check for the Tealium Debug cookie, see https://docs.tealium.com/platforms/javascript/debugging/
  var tiqInDebugMode = /utagdb=true/.test(document.cookie)
  var tealiumEnvironment = getTealiumEnvironment() || 'prod' // fall back to prod (stops logging) if something goes wrong with the function

  /**
   * CMP-specific helper, expected to be provided by extension-2 (and possibly via mapping). The Group Name for Tealium iQ in the CMP (used to decide if the TMS is allowed to run). Uses a standard name if not provided.
   * @name tiqGroupName
   * @type {object}
   * @memberof! tealiumCmpIntegration
   * @default 'Tealium iQ Tag Management'
   * @example
window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}
window.tealiumCmpIntegration.tiqGroupName = "TiQ"
   */
  var tiqGroupName = window.tealiumCmpIntegration.tiqGroupName || '_missing_' // make sure there's no match if it's not set

  /**
   * CMP-specific helper, expected to be provided by extension-2. Expects a function that gets the current consent decision from the CMP.
   * @function cmpFetchCurrentConsentDecision
   * @memberof! tealiumCmpIntegration
   * @returns {*} The CMP response to use within other CMP-specific functions
   *
   * @example
function cmpFetchCurrentConsentDecision () {
  if (!window.UC_UI || typeof window.UC_UI.getServicesBaseInfo !== 'function') return false
  var cmpRawOutput = window.UC_UI.getServicesBaseInfo()
  return cmpRawOutput
}
window.tealiumCmpIntegration.cmpFetchCurrentConsentDecision = cmpFetchCurrentConsentDecision
   */
  var cmpFetchCurrentConsentDecision = (typeof window.tealiumCmpIntegration.cmpFetchCurrentConsentDecision === 'function' && window.tealiumCmpIntegration.cmpFetchCurrentConsentDecision) || function () {}

  /**
   * CMP-specific helper, expected to be provided by extension-2. Indicates if the CMP has loaded and returned a well-formed indication of user consent.
   * @function cmpCheckForWellFormedDecision
   * @memberof! tealiumCmpIntegration
   * @param cmpRawOutput the CMP output returned from cmpFetchCurrentConsentDecision
   * @returns {boolean} 'true' if the consent decision is well-formed, otherwise 'false'
   *
   * @example
function cmpCheckForWellFormedDecision (cmpRawOutput) {
  // treat things we don't understand as an opt-out
  if (toString.call(cmpRawOutput) !== '[object Array]') return false
  // use the first entry as a proxy for all
  if (cmpRawOutput && cmpRawOutput[0] && typeof cmpRawOutput[0].name === 'string') {
    return true
  }
  return false
}
window.tealiumCmpIntegration.cmpCheckForWellFormedDecision = cmpCheckForWellFormedDecision
   *
   */
  var cmpCheckForWellFormedDecision = (typeof window.tealiumCmpIntegration.cmpCheckForWellFormedDecision === 'function' && window.tealiumCmpIntegration.cmpCheckForWellFormedDecision) || function () {}

  /**
   * CMP-specific helper, expected to be provided by extension-2. Get the current CMP lookup key from the page, to use to find the right map.
   *
   * @returns {string} the ID/key to use for the tag map lookup, defaults to an empty string if none is found
   *
   * @example
function cmpFetchCurrentLookupKey () {
  return (window.UC_UI && typeof window.UC_UI.getSettings === 'function' && window.UC_UI.getSettings().id) || ''
}
window.tealiumCmpIntegration.cmpFetchCurrentLookupKey = cmpFetchCurrentLookupKey
   *
   */
  var cmpFetchCurrentLookupKey = (typeof window.tealiumCmpIntegration.cmpFetchCurrentLookupKey === 'function' && window.tealiumCmpIntegration.cmpFetchCurrentLookupKey) || function () {}

  /**
   * CMP-specific helper, expected to be provided by extension-2. Indicates if the user has made an EXPLICIT decision.
   * @function cmpCheckForExplicitConsentDecision
   * @memberof! tealiumCmpIntegration
   * @param cmpRawOutput the CMP output returned from cmpFetchCurrentConsentDecision
   * @returns {boolean} 'true' if the consent decision is EXPLICIT otherwise 'false'
   *
   * @example
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
window.tealiumCmpIntegration.cmpCheckForExplicitConsentDecision = cmpCheckForExplicitConsentDecision
   */
  var cmpCheckForExplicitConsentDecision = (typeof window.tealiumCmpIntegration.cmpCheckForExplicitConsentDecision === 'function' && window.tealiumCmpIntegration.cmpCheckForExplicitConsentDecision) || function () {}

  /**
   * CMP-specific helper, expected to be provided by extension-2. Indicates if Tealium iQ has permission to run (and fire tags).
   * @function cmpCheckForTiqConsent
   * @memberof! tealiumCmpIntegration
   * @param cmpRawOutput the CMP output returned from cmpFetchCurrentConsentDecision
   * @param tiqGroupName the Group Name designation for Tealium iQ in the CMP
   * @returns {boolean} 'true' if TiQ is allowed to run, otherwise 'false'
   *
   * @example
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
window.tealiumCmpIntegration.cmpCheckForTiqConsent = cmpCheckForTiqConsent
   */
  var cmpCheckForTiqConsent = (typeof window.tealiumCmpIntegration.cmpCheckForTiqConsent === 'function' && window.tealiumCmpIntegration.cmpCheckForTiqConsent) || function () {}

  /**
   * CMP-specific helper, expected to be provided by extension-2. Indicates if Tealium iQ has permission to run (and fire tags).
   * @function cmpConvertResponseToGroupList
   * @memberof! tealiumCmpIntegration
   * @param cmpRawOutput the CMP output returned from cmpFetchCurrentConsentDecision
   * @returns {array} a simple list of the group names with permissions to fire, at the desired granularity
   *
   * @example
function cmpConvertResponseToGroupList (cmpRawOutput) {
  var vendorArray = []
  cmpRawOutput && cmpRawOutput.forEach(function (tagConsent) {
    if (tagConsent.consent && tagConsent.consent.status === true) {
      vendorArray.push(tagConsent.name)
    }
  })
  return vendorArray
}
window.tealiumCmpIntegration.cmpConvertResponseToGroupList = cmpConvertResponseToGroupList
   */
  var cmpConvertResponseToGroupList = (typeof window.tealiumCmpIntegration.cmpConvertResponseToGroupList === 'function' && window.tealiumCmpIntegration.cmpConvertResponseToGroupList) || function () {}

  /**
   * CMP-specific helper, expected to be provided by extension-2. Indicates if the CMP is running in opt-in (GDPR-like) or opt-out (CCPA-like) mode
   * @function cmpCheckIfOptInModel
   * @memberof! tealiumCmpIntegration
   * @returns {boolean} true if the CMP is in opt-in mode (like for GDPR), false if opt-out mode (like for CCPA)
   *
   * @example
   *
  function cmpCheckIfOptInModel () {
    var decision = cmpFetchCurrentConsentDecision()
    if (decision.ConsentModel.Name === 'opt-in') {
      return true
    }
    return false
  }
  */
  var cmpCheckIfOptInModel = (typeof window.tealiumCmpIntegration.cmpCheckIfOptInModel === 'function' && window.tealiumCmpIntegration.cmpCheckIfOptInModel) || function () {}

  /**
   * The current version designation (for extensions 3/4)
   * @name version
   * @type {string}
   * @private
   * @memberof! tealiumCmpIntegration
   */
  window.tealiumCmpIntegration.version = version

  /**
   * A [logger helper function]{@link module:extension-3~logger}, to help Tealium iQ users understand and troubleshoot this CMP integration without unneeded logging in production.
   * @name logger
   * @type {function}
   * @private
   * @memberof! tealiumCmpIntegration
   */
  window.tealiumCmpIntegration.logger = logger

  /**
   * A [helper function]{@link module:extension-3~getCurrentConsentDecision} that returns the current [ConsentDecision]{@link ConsentDecision}.
   * @name getCurrentConsentDecision
   * @type {function}
   * @private
   * @memberof! tealiumCmpIntegration
   */
  window.tealiumCmpIntegration.getCurrentConsentDecision = getCurrentConsentDecision

  /**
   * A [helper function]{@link module:extension-3~cmpFetchCurrentLookupKey} that returns the current CMP lookup key (found on the page)
   * @name cmpFetchCurrentLookupKey
   * @type {function}
   * @private
   * @memberof! tealiumCmpIntegration
   */
  window.tealiumCmpIntegration.cmpFetchCurrentLookupKey = cmpFetchCurrentLookupKey

  /**
   * Records the status of the [noview]{@link https://docs.tealium.com/platforms/javascript/settings/#noview} setting on page load.
   * @name isNoviewSet
   * @type {boolean}
   * @private
   * @memberof! tealiumCmpIntegration
   */
  window.tealiumCmpIntegration.isNoviewSet = window.utag_cfg_ovrd && window.utag_cfg_ovrd.noview === true

  /**
   * The name to use for the [ConsentDecision]{@link ConsentDecision} array when adding it to Tealium's b object on each event.
   * @name nameOfVendorOptInArray
   * @type {string}
   * @private
   * @memberof! tealiumCmpIntegration
   */
  window.tealiumCmpIntegration.nameOfVendorOptInArray = nameOfVendorOptInArray

  /**
   * The name to use for the current [ConsentDecision]{@link ConsentDecision}'s 'type' attribute when adding it to Tealium's b object on each event.
   * @name nameOfConsentTypeString
   * @type {string}
   * @private
   * @memberof! tealiumCmpIntegration
   */
  window.tealiumCmpIntegration.nameOfConsentTypeString = nameOfConsentTypeString

  /**
   * The name to use for the array of implicit tags (which have already been fired) in the 'data' property of {@link QueuedEvent QueuedEvent} objects.
   * @name nameOfImplicitConsentArray
   * @type {string}
   * @private
   * @memberof! tealiumCmpIntegration
   */
  window.tealiumCmpIntegration.nameOfImplicitConsentArray = nameOfImplicitConsentArray

  /**
   * A [helper function]{@link module:extension-3~overrideUtagFunctions} that overrides certain utag functions to allow tags to be blocked based on CMP response.
   *
   * Must be called directly after the '##UTGEN##' reference by [editing]{@link https://community.tealiumiq.com/t5/iQ-Tag-Management/Managing-Tag-Templates/ta-p/21713} the 'utag loader' template, as shown in the example.
   * @name overrideUtagFunctions
   * @type {function}
   * @private
   * @memberof! tealiumCmpIntegration
   * @example
// ... utag loader template ...

##UTGEN##
// override two utag functions for the CMP Integration, to allow tags to be blocked as needed
window.tealiumCmpIntegration && window.tealiumCmpIntegration.overrideUtagFunctions && window.tealiumCmpIntegration.overrideUtagFunctions()

// ... utag loader template continues...

   */
  window.tealiumCmpIntegration.overrideUtagFunctions = overrideUtagFunctions

  /**
   * A queue for any events that Tealium iQ processes with IMPLICIT consent (to allow those events to be re-processed for new Services in the event of an EXPLICIT consent choice by the user).
   *
   * Each element in the queue is a [QueuedEvent]{@link QueuedEvent}
   * @name implicitEventQueue
   * @type {array}
   * @private
   * @memberof! tealiumCmpIntegration
   */
  window.tealiumCmpIntegration.implicitEventQueue = window.tealiumCmpIntegration.implicitEventQueue || []

  /**
   * A queue for any events that are triggered before Tealium iQ AND the CMP have both loaded.
   *
   * Each element in the queue is a [QueuedEvent]{@link QueuedEvent}
   * @name earlyEventQueue
   * @type {array}
   * @private
   * @memberof! tealiumCmpIntegration
   */
  window.tealiumCmpIntegration.earlyEventQueue = window.tealiumCmpIntegration.earlyEventQueue || []

  /**
   * Allows us to make sure we don't log certain messages more than once, especially useful while polling to avoid overwhelming the user.
   * @function messageNotLoggedYet
   * @param {*} messageId a string or number to uniquely identify a message for the purposes of deduplication
   * @private
   * @returns {boolean} 'true' if the message hasn't been logged yet (and should be logged), otherwise 'false'
   */
  var alreadyLoggedMessageIds = {}
  function messageNotLoggedYet (messageId) {
    var output = false
    if (typeof alreadyLoggedMessageIds[messageId] === 'undefined') {
      alreadyLoggedMessageIds[messageId] = true
      output = true
    }
    return output
  }

  /**
   * A map of CMP groups to arrays of Tealium iQ tag UIDs, an instance of {@link GroupToTagMap GroupToTagMap}. TiQ profile specific, and expected to be provided by extension-1 (map).
   * @name map
   * @type {object}
   * @memberof! tealiumCmpIntegration
   *
   * @example
window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}
// the arrays of numbers are tag UIDs from the TiQ user interface
window.tealiumCmpIntegration.map = {
  yPyIAIIxY: {
    'Google Analytics': [6, 8, 10], // three Google Analytics tags in TiQ
    'Another Tag': [11]
  }
}
   */
  var map = window.tealiumCmpIntegration.map || {}

  /**
   * A map of Tealium iQ tag UIDs to CMP group assignment, a {@link TagToGroupMap TagToGroupMap}
   * @name tagBasedMap
   * @type {object}
   * @private
   * @memberof! tealiumCmpIntegration
   */
  generateTagBasedMap() // populates the window-level object for you as well

  // if noload is set to 'true', don't interfere, just return to exit this function and allow that setting to stop TiQ load as usual.
  if (window.utag_cfg_ovrd && window.utag_cfg_ovrd.noload === true) return false

  logger('TiQ CMP integration active: ' + window.tealiumCmpIntegration.cmpName + ' ' + (tiqInDebugMode ? "\n\nDEBUGGING TIP: Use /SENDING|\\*\\*\\*\\*/ in the browser console as the 'filter' to show only CMP and tag send notifications." : '\n\nActivate TiQ Debug Mode for more details: https://docs.tealium.com/platforms/javascript/debugging/'), true)
  var cmpResponse = cmpFetchCurrentConsentDecision()
  // core business/GDPR logic, decides if TiQ should load at all
  reactToCmpResponse(cmpResponse)

  /**
     * Create an instance of {@link ConsentDecision ConsentDecision} based on the specific CMP response
     * @param {array} cmpRawOutput the CMP output returned from cmpFetchCurrentConsentDecision
     * @private
     * @returns {array} an instance of {@link ConsentDecision ConsentDecision}
     */
  function buildConsentDecisionFromRawCmpOutput (cmpRawOutput) {
    var vendorArray = cmpConvertResponseToGroupList(cmpRawOutput) || []

    var isWellFormed = cmpCheckForWellFormedDecision(cmpRawOutput)

    if (!isWellFormed) {
      vendorArray.type = 'missing-well-formed-response'
      return vendorArray
    }

    var tagBasedMap = generateTagBasedMap()

    // if there is no mapping for the settings id, we need to change the console output
    var currentSettingsIdHasMapping = (typeof tagBasedMap === 'object' && Object.keys(tagBasedMap).length > 0)

    if (!currentSettingsIdHasMapping) {
      vendorArray.type = 'missing-map'
      return vendorArray
    }

    vendorArray.type = cmpCheckForExplicitConsentDecision(cmpRawOutput) ? 'explicit' : 'implicit'

    if (cmpCheckForTiqConsent(cmpRawOutput, tiqGroupName) === false) {
      // change the consent type, but leave the array for debugging purposes
      vendorArray.type = 'missing-tiq-consent'
    }

    return vendorArray
  }

  /**
   * The core CMP integration logic, which decides if Tealium iQ should be allowed to run, or if it needs to be stopped
   * until an understandable response that includes permission for Tealium iQ to run is found.
   *
   * @function reactToCmpResponse
   * @param {object} cmpResponse The response from the checkConsents function
   * @access private
   */
  function reactToCmpResponse (cmpResponse) {
    var cmpFound = typeof cmpResponse === 'object'
    var foundWellFormedConsentDecision = cmpCheckForWellFormedDecision(cmpResponse)
    var tagBasedMap = generateTagBasedMap()
    var foundMapEntryForActiveSetting = Object.keys(tagBasedMap).length > 0
    var foundExplicitConsent = cmpCheckForExplicitConsentDecision(cmpResponse)
    var tiqIsAllowedToFire = cmpCheckForTiqConsent(cmpResponse, tiqGroupName)
    var tiqIsLoaded = window.utag && window.utag.handler && window.utag.handler.iflag === 1

    // poll
    function checkLater () {
      return window.setTimeout(recheckForCmpAndConsent, consentTimeoutInterval)
    }

    // poll, but only if we're waiting for an explicit decision in an opt-in model
    function checkLaterIfNeeded () {
      if (cmpCheckIfOptInModel() === true) {
        return window.setTimeout(recheckForCmpAndConsent, consentTimeoutInterval)
      }
    }

    if (!cmpFound) {
      /**
       * CASE A1: no CMP found
       *
       * STOP and fire nothing at all
       * RETRY after a delay
       */
      if (messageNotLoggedYet(1)) logger('No CMP found on page.\n\nStopping TiQ (no cookies set/removed, no tags fired).\n\nPolling for changes.')
      checkLater()
      stopTiq()
    } else if (!foundMapEntryForActiveSetting) {
      /**
        * CASE A7: No map found for the current CMP lookup key
        *
        * STOP and fire nothing at all. Do not retry.
        */
      if (messageNotLoggedYet(2)) logger('No map found for current CMP Lookup Key.\n\nStopping TiQ (no cookies set/removed, no tags fired).\n\nNo retries.')
      stopTiq()
    } else if (!foundWellFormedConsentDecision) {
      /**
       * CASE A2: CMP found but consent response wasn't well-formed/complete/understandable
       *
       * STOP and fire nothing at all
       * RETRY after a delay
       */
      if (messageNotLoggedYet(3)) logger('Found CMP and got response, but didn\'t understand the response.\n\nStopping TiQ (no cookies set/removed, no tags fired).\n\nPolling for changes.')
      checkLater()
      stopTiq()
    } else if (!tiqIsAllowedToFire) {
      /**
       * CASE A3: CMP found and consent response was well-formed, BUT TiQ didn't have an opt-in
       *
       * STOP and fire nothing at all
       * RETRY after a delay
       */
      if (messageNotLoggedYet(4)) logger('Found CMP and got well-formed response, but TiQ isn\'t allowed to run based on the response.\n\nStopping TiQ (no cookies set/removed, no tags fired).\n\nPolling for changes.')
      checkLaterIfNeeded()
      stopTiq()
    } else if (!foundExplicitConsent) {
      /**
       * CASE A4: CMP found AND response was understandable (AND includes an implicit TiQ consent), BUT the user hasn't made an explicit decision yet
       *
       * ALLOW TO LOAD for any 'default opt-in' tags (filter logic in Extension B)
       * RETRY after a delay (in case there's an explicit decision, since implicit decisions usually mean the prompt is displayed)
       */
      if (messageNotLoggedYet(5)) logger('Found CMP and got well-formed IMPLICIT response which includes TiQ.\n\nAllowing certain tags to fire based on IMPLICIT consent.' + cmpCheckIfOptInModel() === true ? '\n\nPolling for changes.' : '\n\nNo further polling.')
      checkLaterIfNeeded()
      if (tiqIsLoaded) {
        processEarlyQueue()
      } else {
        checkLaterIfNeeded()
      }
      triggerOrQueue()
    } else if (foundExplicitConsent) {
      /**
       * CASE A5: CMP found AND response was understandable, AND the user has made an explicit consent decision AND TiQ is allowed
       *
       * ALLOW TO LOAD for any opted-in tags (filter logic in Extension B), do not retry.
       */
      if (messageNotLoggedYet(6)) logger('Found CMP and got well-formed EXPLICIT response which includes TiQ.\n\nAllowing certain tags to fire based on EXPLICIT consent.\n\nNo further polling.')
      // only call if we've been polling (on initial load, it will load automatically)
      if (tiqIsLoaded) {
        processEarlyQueue()
        processImplicitQueue()
      } else {
        checkLater()
      }
      triggerOrQueue()
    } else {
      /**
        * CASE A6: Something went wrong with this extension.
        *
        * STOP and fire nothing at all. Do not retry.
        */
      if (messageNotLoggedYet(7)) logger('Something unexpected went wrong.\n\nStopping TiQ (no cookies set/removed, no tags fired).\n\nNo retries.')
      stopTiq()
    }
  }

  /**
   * Override utag.loader.initdata and utag.handler.trigger to allow Tealium iQ Tags to be blocked if the user hasn't consented.
   *
   * @function overrideUtagFunctions
   * @returns {boolean} 'true' if the function was overridden successfully by this request, 'false' if not (because it was already overridden)
   * @access private
   */
  function overrideUtagFunctions () {
    // don't override more than once, assume that if one function has been overridden, both have
    if (window.utag.handler.trigger.toString().indexOf('tealiumCmpIntegration') !== -1) {
      return true
    }

    // the initial view is handled differently than subsequent events
    // this is safe to to override even if noview is set (because it will never be called in that case)
    window.utag.loader.initdata_old = window.utag.loader.initdata
    window.utag.loader.initdata = newUtagLoaderInitdata

    window.utag.handler.trigger_old = window.utag.handler.trigger
    window.utag.handler.trigger = newUtagHandlerTrigger
    logger('Overrode utag functions!')

    if (window.utag.handler.trigger.toString().indexOf('tealiumCmpIntegration') !== -1) {
      return true
    }

    return false
  }

  /**
   * An overridden version of the Tealium iQ function utag.loader.initdata.
   *
   * Calls the original function, respects possible noview settings, rechecks the user consent, and calls queueEventWithoutFiringImplicitServices
   * if only an IMPLICIT consent is found (after recording the IMPLICIT services, to avoid double-firing).
   *
   * That same event can then be re-processed for any new Services if an EXPLICIT consent decision later made.
   *
   * @function newUtagLoaderInitdata
   * @access private
   */
  function newUtagLoaderInitdata () {
    window.utag.loader.initdata_old()
    // make sure we don't queue this initial page load twice, and respect the configured noview setting
    if (!window.tealiumCmpIntegration.isNoviewSet && !window.tealiumCmpIntegration.alreadyFiredInitialViewEvent) {
      window.tealiumCmpIntegration.alreadyFiredInitialViewEvent = true
      var consentedServices = getCurrentConsentDecision()
      if (consentedServices.type === 'implicit') {
        window.tealiumCmpIntegration.implicitServices = consentedServices
        // we don't need to fire implicit services in this case, because TiQ's loading process will fire them
        queueEventWithoutFiringImplicitServices({
          event: 'view',
          data: window.utag.handler.C(window.utag.data)
        })
      }
    }
  }
  /**
   * Refresh [tealiumCmpIntegration.tagBasedMap]{@link tealiumCmpIntegration.tagBasedMap} and return that new map, helps smooth out any timing issues between CMP and Tealium iQ load.
   *
   * @function generateTagBasedMap
   * @returns a [TagToGroupMap]{@link TagToGroupMap}
   * @access private
   */
  function generateTagBasedMap () {
    var tagBasedMap = getTagBasedMap(map)
    window.tealiumCmpIntegration.tagBasedMap = tagBasedMap
    return tagBasedMap
  }

  /**
   * Tealium iQ's utag.handler.trigger normally causes tags to fire. For this integration, we override that function to support blocking tags without consent.
   *
   * @function newUtagHandlerTrigger
   *
   * @param {*} a can be an object or a string
   * @param {*} b
   * @param {*} c
   *
   * @access private
   */
  function newUtagHandlerTrigger (a, b, c) {
    /**
     * Trigger CASES (utag.handler.trigger override)
     *
     * We need to queue the events if we only have implicit consent, to allow a selective retrigger if/when we get an explicit decision.
     */
    var isPureConsentEvent = (a === nameOfConsentPollingEvent && !b && !c)
    var isNoviewSet = window.tealiumCmpIntegration.isNoviewSet || true // assume noview if something went wrong with the global, to avoid firing tracking in error

    var consentedServices = getCurrentConsentDecision()
    var consentType = (consentedServices && consentedServices.type) || 'none'

    var isCmpReady = consentType === 'implicit' || consentType === 'explicit'
    var isTealiumReady = window.utag && window.utag.handler && window.utag.handler.iflag === 1

    if (!isPureConsentEvent) {
      logger('utag.handler.trigger called with:\n\n' + JSON.stringify(arguments, null, 2))
    }

    if (!isCmpReady && !isTealiumReady) {
      consentedServices.type = 'tealium-and-cmp-loading'
      logger('Waiting for CMP and Tealium to be ready, queueing early event.')
      queueEarlyEvent(a, b, c)
      return false
    } else if (!isCmpReady) {
      consentedServices.type = 'cmp-loading'
      logger('CMP is still loading, queueing early event')
      queueEarlyEvent(a, b, c)
      return false
    } else if (!isTealiumReady) {
      consentedServices.type = 'tealium-still-loading'
      logger('Tealium iQ is still loading, queueing early event')
      queueEarlyEvent(a, b, c)
      return false
    }

    // if an array of tagUids is passed, that forces them to fire regardless of load rules
    // or consent, so we need to filter that array before allowing it to be processed
    var hasTagUidArray = c && typeof c === 'object' && c.uids && c.uids && window.utag.ut.typeOf(c.uids) === 'array'
    var uidMap = generateTagBasedMap()
    var allowedTagUids = []
    var blockedTagUids = []
    var serviceName
    var tagUid
    if (hasTagUidArray) {
      for (var i = 0; i < c.uids.length; i++) {
        tagUid = c.uids[i]
        serviceName = uidMap[tagUid] || '(missing)'
        // only push consented services into the new array
        if (consentedServices.indexOf(serviceName) !== -1) {
          allowedTagUids.push(tagUid)
        } else {
          blockedTagUids.push(tagUid)
        }
      }
      // replace the original with the filtered array (can also be empty, if none of them were allowed)
      logger('Call included tagUid array:\n\n' + JSON.stringify(c.uids) + '\n\nwhich was replaced by the filtered version:\n\n' + JSON.stringify(allowedTagUids))
      c.originalUids = c.uids.slice() // make a shallow copy
      c.uids = allowedTagUids
      c.blockedTagUids = blockedTagUids
    }

    if (consentType === 'explicit') {
      /**
       * CASE T2: expected globals are populated, consent is EXPLICIT
       *
       * FIRE allowed tags (explicit)
       * utag.handler.trigger override PROCESSES the queue, which will include any queued events from CASE A4, making sure not to re-fire any default
       *   opt-in tags that were already fired for the queued events
       */
      // make sure TiQ loads
      processEarlyQueue()
      processImplicitQueue()
      triggerTiqLoad()
      // fire the current event if it's not just a polling event
      if (!isPureConsentEvent) {
        return window.utag.handler.trigger_old(a, b, c)
      }
    } else if (consentType === 'implicit') {
      /**
       * CASE T3: expected globals are populated, consent is IMPLICIT
       *
       * FIRE allowed tags (implicit)
       * utag.handler.trigger override KEEPS a queue/record that includes
       *  - the event(s) that were processed based on implicit consent
       *  - which tags were allowed to process each event (are set to implicit opt-in)
       */
      processEarlyQueue()
      // fire the initial view if appropriate, and queue it
      triggerTiqLoad()
      window.tealiumCmpIntegration.implicitServices = consentedServices

      // queue the initial 'view' on pageload if appropriate
      if (!isNoviewSet && isTealiumReady && !window.tealiumCmpIntegration.alreadyFiredInitialViewEvent) {
        window.tealiumCmpIntegration.alreadyFiredInitialViewEvent = true
        queueEventAndFireImplicitServices('view', window.utag.handler.C(window.utag.data))
      }
      // queue the current event if it exists (and this isn't just consent polling)
      if (!isPureConsentEvent) {
        return queueEventAndFireImplicitServices(a, b, c)
      }
    } else if (consentType === 'missing-map') {
      logger('Something went wrong - all tags were blocked because no consent map was found for the active setting ID.')
      return false
    } else if (consentType === 'missing-tiq-consent') {
      logger('Something went wrong - all tags were blocked because no consent was found for "' + tiqGroupName + '", configured Tealium iQ name.\n\nConsent found: ' + JSON.stringify(consentedServices, null, 2))
      return false
    } else {
      /**
       * CASE T1: expected variables not populated (misconfiguration/error case)
       *
       * STOP and fire nothing at all. Do not retry or queue the event.
       */
      logger('Something went wrong - all tags were blocked because the consent response was not understood.')
      return false
    }
  }

  /**
   * Process any queued tracking events from [the early event queue]{@link tealiumCmpIntegration.earlyEventQueue} (can include pageviews) for any currently-consented Services.
   *
   * Intended to be called first understandable implicit consent.
   *
   * @function processEarlyQueue
   * @access private
   */
  function processEarlyQueue () {
    var queuedEvent
    window.tealiumCmpIntegration.earlyEventQueue = window.tealiumCmpIntegration.earlyEventQueue || []
    while (window.tealiumCmpIntegration.earlyEventQueue.length > 0) {
      // process past events
      queuedEvent = window.tealiumCmpIntegration.earlyEventQueue.shift()
      logger('Processing queued early event for currently consented tags: ' + JSON.stringify(queuedEvent, null, 2))
      window.utag.track(queuedEvent)
    }
  }

  /**
   * Process any queued tracking events from [the global queue]{@link tealiumCmpIntegration.implicitEventQueue} (can include pageviews) for any newly-consented Services.
   *
   * Intended to be called on new EXPLICIT consent decision - queued events have already had IMPLICTLY consented tags fired, so those need to be excluded.
   *
   * @function processImplicitQueue
   * @access private
   */
  function processImplicitQueue () {
    var alreadyLogged = false
    var queuedEvent
    window.tealiumCmpIntegration.implicitEventQueue = window.tealiumCmpIntegration.implicitEventQueue || []
    while (window.tealiumCmpIntegration.implicitEventQueue.length > 0) {
      if (!alreadyLogged) {
        alreadyLogged = true
        logger('Explicit consent tracking request received - processing past implicitly tracked events (' + window.tealiumCmpIntegration.implicitEventQueue.length + ') for any new explicit tags.')
      }
      // process past events
      queuedEvent = window.tealiumCmpIntegration.implicitEventQueue.shift()
      logger('Triggering event for explicitly-consented tags: ' + JSON.stringify(queuedEvent))
      window.utag.track(queuedEvent)
    }
  }

  /**
   * Queue a [tracking event]{@link QueuedEvent} in [the early queue]{@link tealiumCmpIntegration.earlyEventQueue}, without firing any tags.
   *
   * Intended to be called for events that triggered before we get an understandable response from the CMP.
   *
   * @function queueEarlyEvent
   * @param {*} a the 'a' argument from utag.handler.trigger
   * @param {*} b the 'b' argument from utag.handler.trigger
   * @param {*} c the 'c' argument from utag.handler.trigger
   * @access private
   *
   */
  function queueEarlyEvent (a, b, c) {
    a = a || {}

    // make a copy, in case shared objects are used (like utag_data, or a similar global) - snapshot those
    if (typeof b === 'object') {
      b = JSON.parse(JSON.stringify(b))
    }
    // convert to a more standard format
    if (typeof a === 'string') {
      a = { event: a, data: b || {}, cfg: c }
    }

    // if there's a tagUid array, don't queue the already-fired tags - instead, swap that with any blocked tags
    if (a && a.cfg && window.utag.ut.typeOf(a.cfg.uids) === 'array') {
      a.cfg.uids = a.cfg.blockedTagUids.slice()
    }

    // nothing will be allowed to fire
    a.data[nameOfImplicitConsentArray] = []

    window.tealiumCmpIntegration.earlyEventQueue = window.tealiumCmpIntegration.earlyEventQueue || []
    window.tealiumCmpIntegration.earlyEventQueue.push(a)
    logger('Queued early event!')
  }

  /**
   * Queue a [tracking event]{@link QueuedEvent} in [the global queue]{@link tealiumCmpIntegration.implicitEventQueue}, without firing any implictly consented Services.
   *
   * Intended to be called for the initial pageview on load, since the load process will have already fired the implicit services.
   *
   * @function queueEventWithoutFiringImplicitServices
   * @param {*} a the 'a' argument from utag.handler.trigger
   * @param {*} b the 'b' argument from utag.handler.trigger
   * @param {*} c the 'c' argument from utag.handler.trigger
   * @access private
   *
   */
  function queueEventWithoutFiringImplicitServices (a, b, c) {
    a = a || {}

    // make a copy, in case shared objects are used (like utag_data, or a similar global) - snapshot those
    if (typeof b === 'object') {
      b = JSON.parse(JSON.stringify(b))
    }
    // convert to a more standard format
    if (typeof a === 'string') {
      a = { event: a, data: b || {}, cfg: c }
    }

    // if there's a tagUid array, don't queue the already-fired tags - instead, swap that with any blocked tags
    if (a && a.cfg && window.utag.ut.typeOf(a.cfg.uids) === 'array') {
      a.cfg.uids = a.cfg.blockedTagUids.slice()
    }

    a.data[nameOfImplicitConsentArray] = window.tealiumCmpIntegration.implicitServices || []

    window.tealiumCmpIntegration.implicitEventQueue = window.tealiumCmpIntegration.implicitEventQueue || []
    window.tealiumCmpIntegration.implicitEventQueue.push(a)
  }

  /**
   * Queue a [tracking event]{@link QueuedEvent} in [the global queue]{@link tealiumCmpIntegration~implicitEventQueue}, without firing any implicitly consented Services.
   *
   * Intended to be called for all events other than the initial page load.
   *
   * @function queueEventAndFireImplicitServices
   * @param {*} a the 'a' argument from utag.handler.trigger
   * @param {*} b the 'b' argument from utag.handler.trigger
   * @param {*} c the 'c' argument from utag.handler.trigger
   * @access private
   *
   */
  function queueEventAndFireImplicitServices (a, b, c) {
    // fire the implicit tags
    window.utag.handler.trigger_old(a, b, c)
    logger('Implicit consent tracking request fired (or queued, if utag hasn\'t loaded).')
    return queueEventWithoutFiringImplicitServices(a, b, c)
  }

  /**
   * Generate a {@link TagToGroupMap TagToGroupMap} based on a {@link GroupToTagMap GroupToTagMap}
   *
   * @function getTagBasedMap
   * @param {object} map a {@link GroupToTagMap GroupToTagMap} object
   * @return {object} a {@link TagToGroupMap TagToGroupMap}
   * @access private
   */
  function getTagBasedMap (map) {
    // generate a lookup based on the tagUid
    if (typeof map !== 'object') return {}
    var settingsId = cmpFetchCurrentLookupKey() || ''
    if (typeof settingsId !== 'string' || settingsId === '') return {}
    var settingSpecificMap = map[settingsId] || {}
    var serviceNames = Object.keys(settingSpecificMap)
    var uidMap = {}
    for (var i = 0; i < serviceNames.length; i++) {
      for (var j = 0; j < settingSpecificMap[serviceNames[i]].length; j++) {
        uidMap[settingSpecificMap[serviceNames[i]][j]] = serviceNames[i]
      }
    }
    return uidMap
  }

  /**
   * Trigger the core logic with an up-to-date {@link ConsentDecision ConsentDecision}
   * @function recheckForCmpAndConsent
   * @access private
   */
  function recheckForCmpAndConsent () {
    var newConsentResponse = cmpFetchCurrentConsentDecision()
    reactToCmpResponse(newConsentResponse)
  }

  /**
   * Get the current consent decision from the CMP for the active Setting
   * @function getCurrentConsentDecision
   * @returns a {@link ConsentDecision ConsentDecision}
   * @access private
   */
  function getCurrentConsentDecision () {
    var freshConsent = cmpFetchCurrentConsentDecision()
    return buildConsentDecisionFromRawCmpOutput(freshConsent)
  }

  /**
   *  A conditional logging function - we can't use utag.DB directly because some of our logic needs to be preloader, but we can mimic the same logic so that our logging only displays when TiQ is in debug mode and/or not in Prod, or is explicitly forced.
   * @function logger
   * @private
   * @param {string} message the message to be conditionally shown
   * @param {boolean} showOutsideDebugMode if 'true', forces the message to shown outside of debug mode, except on Prod
   *
   */
  function logger (message, showOutsideDebugMode) {
    if (typeof tealiumEnvironment === 'undefined' || tealiumEnvironment === 'prod') {
      // don't allow anything outside of debug mode on prod (disable this flag)
      showOutsideDebugMode = false
    }

    if (showOutsideDebugMode || tiqInDebugMode) {
      message = '\n' + message + '\n'
      var formattedArr = []
      formattedArr.push('****************')
      var messageArr = message.split('\n')
      messageArr.forEach(function (messageLine) {
        formattedArr.push('*  ' + messageLine)
      })
      formattedArr.push('****************')
      var outputString = formattedArr.join('\n')
      console.log(outputString)
    }
  }

  /**
   * Stops Tealium iQ from loading (the TMS will not load tags or set a cookie if this function is called in Pre Loader), using the {@link https://docs.tealium.com/platforms/javascript/settings/#noload noload} setting
   * @function stopTiq
   * @access private
   */
  function stopTiq () {
    // logger("stopTiq function fired")
    window.utag_cfg_ovrd = window.utag_cfg_ovrd || {}
    window.utag_cfg_ovrd.noload = true
  }

  /**
   * Allows TiQ to finish loading, intended to be called when a well-formed consent response is received, and that response allows Tealium iQ to run.
   *
   * Works by setting {@link https://docs.tealium.com/platforms/javascript/settings/#noload noload} to 'false' and calling Tealium iQ's utag.loader.PINIT method.
   *
   * If noload was 'true' and this function runs it must've been set to true by our own {@link module:extension-3~stopTiq stopTiq} function, because otherwise Tealium iQ wouldn't have been allowed to load/poll in the first place.
   * @function triggerTiqLoad
   * @access private
   * @returns {boolean} 'true' if Tealium iQ was successfully triggered, 'false' if it wasn't triggered because it's already initiated
   */
  function triggerTiqLoad () {
    // if the CMP is ready on the first request, TiQ won't have loaded yet at all - let it load naturally
    if (!window.utag) {
      return true
    }
    // if TiQ has already loaded but these flags aren't truthy, we've interrupted the load and should retrigger it
    // initial load / view (noview logic handled in utag.handler.trigger function itself)
    if (!window.utag.handler || !window.utag.handler.iflag) {
      // we don't need to reload actually, just allow it to finish loading
      window.utag.cfg.noload = false // safe because this code only runs if it was set to false originally
      window.utag.loader.PINIT()
      return true
    }
    // already loaded
    return false
  }

  /**
   * If Tealium iQ hasn't loaded, load it (calling utag.handler.trigger in the process), otherwise call utag.handler.trigger.
   * @function triggerOrQueue
   * @access private
   */
  function triggerOrQueue () {
    var successfullyTriggeredLoadIfNeeded = triggerTiqLoad()
    if (!successfullyTriggeredLoadIfNeeded) {
      // explicit consent from polling, but load has already been triggered
      return window.utag.handler.trigger(nameOfConsentPollingEvent)
    }
  }
  /**
   * Get the the current Tealium iQ environment.
   *
   * Since this runs in Pre Loader, it needs to use regex to recognize the utag.js file in the DOM and read the environment from the file name (there are no utag functions or objects at this point in the load).
   *
   * NOTE: This doesn't work correctly when using the the Environment Switcher (because the original script is added to the DOM instead of the new one, and the 307 redirect that's used to pull the new file(s) only changes the response, not the script element itself).
   *
   * If you're using the Environment Switcher on Prod and would like to see console output, set the [debug cookie]{@link https://docs.tealium.com/platforms/javascript/debugging/}.
   *
   * @function getTealiumEnvironment
   * @access private
   * @returns {boolean} 'true' if Tealium iQ was successfully triggered, 'false' if it wasn't triggered because it's already initiated
   */
  function getTealiumEnvironment () {
    var allScripts = document.getElementsByTagName('script')
    var re = /\/([^/]*)\/utag\.js(\?.*)*$/
    for (var i = 0; i < allScripts.length; i++) {
      var result = re.exec(allScripts[i].src) // can be null
      if (result && result[1]) { // [1] is the result of the match
        return result[1]
      }
    }
    return 'prod' // default to guessing we're in prod, just in case we're actually in prod (to avoid logging in Prod)
  }
})(window)

// Document key data structures here for clarity.

/**
 * An array of CMP group names that have permission to run.
 *
 * Also includes a 'type' property that indicates whether the consent decision is IMPLICIT or EXPLICT.
 *
 * @static
 * @type {array}
 * @name ConsentDecision
 * @memberof! <global>
 * @property {string} type the type of consent, will be either 'implicit' or 'explicit'
 * @example
var exampleConsentDecision = window.tealiumCmpIntegration.getCurrentConsentDecision()

JSON.stringify(exampleConsentDecision)
// ["Google Analytics","Another Tag","Tealium iQ Tag Management"]

exampleConsentDecision.type
// "explicit"

exampleConsentDecision.length
// 3
 */

/**
 * Assigns Tealium iQ Tags to CMP Group names. Each group can contain multiple tags, but each tag can only be assigned to a single service. If the same tag UID appears in multiple Service arrays, all but one will be ignored.
 *
 * The keys for the main object are the configuration ID from the CMP, inside that are key/value pairs where the key is a CMP group name (granularity is flexible), and the value is an array of TagUIDs from Tealium iQ.
 *
 * This needs to be provided as per the example below, in [tealiumCmpIntegration.map]{@link namespace:tealiumCmpIntegration~map}.
 *
 * @static
 * @type {object}
 * @name GroupToTagMap
 * @memberof! <global>
 * @example
window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}
window.tealiumCmpIntegration.map = {
  'yPyIAIIxY': {
    'Google Analytics': [6, 8, 10],
    'Mouseflow': [7, 9],
    'Another Tag': [11]
  }
}
 */

/**
 * A simple lookup, with Tealium iQ tag UIDs as keys and the associated CMP Groups as values. Each group can be associated with multiple tags, but each tag can be associated with one group.
 *
 * The example is based on the {@link GroupToTagMap GroupToTagMap} example, where the CMP Lookup Key (a Usercentrics Settings ID, in this case) on the active page is 'yPyIAIIxY'.
 *
 * This object is automatically generated by the [getTagBasedMap]{@link module:extension-3~getTagBasedMap} method, and made available globally in [tealiumCmpIntegration.tagBasedMap]{@link tealiumCmpIntegration~tagBasedMap} for debugging and use within the extensions.
 *
 * @static
 * @type {object}
 * @name TagToGroupMap
 * @memberof! <global>
 * @example
{
  6: 'Google Analytics',
  7: 'Mouseflow',
  8: 'Google Analytics',
  9: 'Mouseflow',
  10: 'Google Analytics',
  11: 'Another Tag'
}
 */

/**
 * An object from the [implicitEventQueue]{@link tealiumCmpIntegration.implicitEventQueue} or [earlyEventQueue]{@link tealiumCmpIntegration.earlyEventQueue}, which represents a Tealium iQ tracking event that's been processed based on an IMPLICIT [ConsentDecision]{@link ConsentDecision}
 *
 * Heavily based on the argument passed to [utag.track]{@link https://community.tealiumiq.com/t5/Tealium-iQ-Tag-Management/utag-track-method/td-p/24578}, since it's designed to be processed by that method.
 *
 * Initial pageviews (handled in the [utag.loader.initdata override]{@link module:extension-3~newUtagLoaderInitdata}) will NOT have metadata like cookies, qps, etc - utag.track calls (handled in the [utag.handler.trigger override]{@link module:extension-3~newUtagHandlerTrigger}) will. That's a byproduct of using utag.handler.trigger, which is later in the load - those metadata will be re-read when the queue is processed, and since this queue isn't persisted between pages, it should be fine like that - the only strange behavior will be that any metadata that aren't present on re-read will still be present after the re-read - only values that are still present will be replaced with new values.
 *
 * An alternative approach could be to manually remove 'cp.\*', 'dom.\*', 'ut.\*', 'qp.\*', 'meta.\*' and possibly 'tealium_\*' (except 'tealium_event') from the 'data' object before queueing - that hasn't been done so far.
 *
 * @static
 * @type {object}
 * @name QueuedEvent
 * @memberof! <global>
 * @property {string} event the type of tracking event, generally 'view' for pageviews or 'link' for other events
 * @property {object} data the Universal Data Object associated with the event (from utag_data or the b object)
 * @property {object} cfg an optional configuration object that can have a 'cb' property (for a callback function) and a 'uids' array, which is a list of tag UIDs that should be triggered by the event, regardless of whether load rules are met.
 * @example
{
  "event": "view",
  "data": {
    "page_type": "test_virtual_view",
    "cp.utag_main_v_id": "0174492849d50013581219634d6103079004907101274",
    "cp.utag_main__sn": "4",
    "cp.utag_main__se": "4",
    "cp.utag_main__ss": "0",
    "cp.utag_main__st": "1598990152209",
    "cp.utag_main_ses_id": "1598988112353",
    "cp.utag_main__pn": "3",
    "cp.utagdb": "true",
    "dom.referrer": "",
    "dom.title": "Usercentrics Test",
    "dom.domain": "solutions.tealium.net",
    "dom.query_string": "",
    "dom.hash": "",
    "dom.url": "https://solutions.tealium.net/hosted/usercentrics/test-page-standard.html",
    "dom.pathname": "/hosted/usercentrics/test-page-standard.html",
    "dom.viewport_height": 456,
    "dom.viewport_width": 1825,
    "ut.domain": "tealium.net",
    "ut.version": "ut4.46.202009011921",
    "ut.event": "view",
    "ut.visitor_id": "0174492849d50013581219634d6103079004907101274",
    "ut.session_id": "1598988112353",
    "ut.account": "services-caleb",
    "ut.profile": "usercentrics-by-tag",
    "ut.env": "prod",
    "tealium_event": "view",
    "tealium_visitor_id": "0174492849d50013581219634d6103079004907101274",
    "tealium_session_id": "1598988112353",
    "tealium_session_number": "4",
    "tealium_session_event_number": "4",
    "tealium_datasource": "",
    "tealium_account": "services-caleb",
    "tealium_profile": "usercentrics-by-tag",
    "tealium_environment": "prod",
    "tealium_random": "2085060854215077",
    "tealium_library_name": "utag.js",
    "tealium_library_version": "4.46.0",
    "tealium_timestamp_epoch": 1598988352,
    "tealium_timestamp_utc": "2020-09-01T19:25:52.211Z",
    "tealium_timestamp_local": "2020-09-01T21:25:52.211",
    "usercentrics_services_with_consent": [
      "Mouseflow",
      "Tealium iQ Tag Management",
      "Usercentrics Consent Management Platform"
    ],
    "usercentrics_consent_type": "implicit",
    "_usercentrics_services_already_processed": [
      "Mouseflow",
      "Tealium iQ Tag Management",
      "Usercentrics Consent Management Platform"
    ]
  },
  "cfg": {
    "cb": function myCallback () {console.log("Callback fired!")},
    "uids": [
      11
    ],
    "originalUids": [
      7,
      11
    ],
    "blockedTagUids": [
      11
    ]
  }
}
*/
