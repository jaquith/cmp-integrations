/* global b */

/**
 *  Scope       : All Tags - After Load Rules
 *  Condition   : n/a
 *  Description : CMP Integration Element 4/4 - After Load Rules component
 *
 *                Prevent tags from firing if they don't have an opt-in in the mapping (or there is no mapping).
 *
 */

/**
 * @module extension-4
 * @description The 'All Tags - After Load Rules' component, responsible for blocking tags if consent is missing or this CMP integration is misconfigured.
 */

var map = (window.tealiumCmpIntegration && window.tealiumCmpIntegration.map) || {}

// get settings from CMP 1 extension, shouldn't need to change these
var globals = window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}
var tiqGroupName = globals.tiqGroupName || 'Tealium iQ Tag Management' // how is Tealium iQ indicated in the CMP output?

var nameOfFullGroupArray = globals.nameOfFullGroupArray || 'missing_opt_in_array_name'
var nameOfConsentTypeString = globals.nameOfConsentTypeString || 'missing_consent_type_name'
var nameOfProcessedGroupArray = globals.nameOfProcessedGroupArray || 'missing_implicit_queue_array_name'
var nameOfUnprocessedGroupArray = globals.nameOfUnprocessedGroupArray || 'missing_new_opt_in_array_name'

var refiringAllowed = window.tealiumCmpIntegration.refiringAllowed || [] // tags like Tealium Collect that should fire all the time

var tagBasedMap = globals.tagBasedMap || {}

var getCurrentConsentDecision = globals.getCurrentConsentDecision || function () { return [] }
var cmpFetchCurrentLookupKey = globals.cmpFetchCurrentLookupKey || function () { return '' }

var logger = globals.logger || (window.utag && window.utag.DB) || function (message) { console.log(message) } // logger function with fallback in case global function is missing

// recheck
var currentlyAllowedVendors = getCurrentConsentDecision()
var alreadyProcessed = b[nameOfProcessedGroupArray] || [] // use the previously stored array, from the queued event
var notProcessed = getNewConsents(alreadyProcessed, currentlyAllowedVendors)

// Add the current ConsentDecision information (allowed Services and consent type) to the UDO for possible use in extensions
b[nameOfFullGroupArray] = currentlyAllowedVendors
b[nameOfConsentTypeString] = currentlyAllowedVendors && currentlyAllowedVendors.type
b[nameOfUnprocessedGroupArray] = notProcessed

function getNewConsents (implicit, explicit) {
  implicit = implicit || []
  explicit = explicit || []
  var changes = []
  for (var i = 0; i < explicit.length; i++) {
    if (implicit.indexOf(explicit[i]) === -1) {
      changes.push(explicit[i])
    }
  }
  return changes
}

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

logger('Called block logic:\n\nAllowed: ' + JSON.stringify(currentlyAllowedVendors, null, 2) + '\n\nAlready processed: ' + (alreadyProcessed ? JSON.stringify(alreadyProcessed, null, 2) : '(none)'))

logger('Map:\n\n' + JSON.stringify(map, null, 2) + '\n\nActive CMP Lookup Key: ' + cmpFetchCurrentLookupKey() + '\n\nMap has entry for current settingsId: ' + (typeof map[cmpFetchCurrentLookupKey()] === 'object' ? 'true' : 'false') + '\n\nTag-based map for the active key: ' + JSON.stringify(tagBasedMap, null, 2))
logger('Consent confirmed: ' + currentlyAllowedVendors.type + ' : ' + JSON.stringify(currentlyAllowedVendors, null, 2))

var newCfg = blockTagsBasedOnConsent(tagBasedMap, window.utag.loader.cfg, currentlyAllowedVendors, alreadyProcessed, notProcessed, refiringAllowed)

// logger('Tag block debug:' + JSON.stringify(newCfg, null, 2))

window.utag.loader.cfg = newCfg

/**
 * Blocks tags based on consent by manually setting the 'load' and 'send' flags to 0 for any tags that don't have permission to fire.
 *
 * That logic isn't sufficient to block tracking calls with a 'uids' array (which also circumvents load rules), so additional blocking logic is added in the utag.handler.trigger override.
 * @param {object} tagBasedMap a {@link TagToGroupMap TagToGroupMap}
 * @param {object} configObject the current window.utag.loader.cfg object (which is used to control which tags should load/fire)
 * @param {array} consentedServices a {@link ConsentDecision ConsentDecision}
 * @param {array} alreadyProcessedGroups an array of Service Names that have already been processed, to avoid double-firing those tags.
 * @private
 */
function blockTagsBasedOnConsent (tagBasedMap, configObject, consentedServices, alreadyProcessedGroups, notProcessedGroups, refiringAllowed) {
  // block all tags if the consented services array is missing
  if (Array.isArray(consentedServices) !== true) {
    consentedServices = []
  }

  tagBasedMap = tagBasedMap || {}

  // if the utag template hasn't been edited, this function won't have been overriden, so we gut it
  // to stop tags from firing
  var utagFunctionsHaveBeenOverridden = window.utag.handler.trigger.toString().indexOf('tealiumCmpIntegration') !== -1
  if (utagFunctionsHaveBeenOverridden !== true) {
    window.utag.handler.trigger = function () {
      if (messageNotLoggedYet(1)) {
        logger('Tags have been disabled because the required utag.loader edit hasn\'t been done successfully and the tealiumCmpIntegration is active.')
      }
    }
    consentedServices = []
  }

  var deactivatedTags = []
  // turn the map into an easier-to-query object

  alreadyProcessedGroups = alreadyProcessedGroups || []

  var tiqIsAllowed = tiqGroupName && consentedServices.indexOf(tiqGroupName) !== -1

  var allTagUids = Object.keys(configObject)

  var assignedServiceName
  var shouldFire

  // deactivate tags that aren't mapped and consented
  for (var i = 0; i < allTagUids.length; i++) {
    shouldFire = false // assume no consent

    assignedServiceName = tagBasedMap[allTagUids[i]] || false

    if (assignedServiceName) {
      // only fire if TiQ and the tag is allowed AND (it hasn't already fired OR it's supposed to fire when decisions change)
      shouldFire = tiqIsAllowed && consentedServices.indexOf(assignedServiceName) !== -1 && (alreadyProcessedGroups.indexOf(assignedServiceName) === -1 || (notProcessedGroups.length > 0 && refiringAllowed.indexOf(Number(allTagUids[i])) !== -1))
    }

    if (shouldFire !== true) {
      // this isn't enough to stop specified tagUids (in the array) from firing by itself
      configObject[allTagUids[i]].send = 0
      configObject[allTagUids[i]].load = 0
      deactivatedTags.push(allTagUids[i])
    }
  }
  if (messageNotLoggedYet(2)) {
    logger('Blocked tags: ' + JSON.stringify(deactivatedTags, null, 2) + (tiqIsAllowed ? '' : '\n\nAll tags blocked because Tealium iQ isn\'t allowed to fire.'))
  }
  return configObject
}
