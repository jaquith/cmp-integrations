/**
 *  Scope       : Pre Loader
 *  Execution   : n/a
 *  Condition   : n/a
 *  Description : CMP Integration Element 1/4, Specifies the connections between Usercentrics Services and TiQ tags
 *
 *                Must be Pre Loader, BEFORE the other Pre Loader extensions.
 */

/**
 * @module extension-1-example-map
 *
 * @description An example of an extension to supply the mapping, which should be a {@link GroupToTagMap GroupToTagMap}.
 *
 * Also shows how to declare a non-standard name for the Tealium iQ TMS, which is used to determine if the TMS is allowed to run at all.
 *
 * @example
window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}
// the numbers are tag UIDs from the TiQ user interface
window.tealiumCmpIntegration.map = {
  yPyIAIIxY: {
    'Google Analytics': [6, 8, 10], // three Google Analytics tags in TiQ
    'Another Tag': [11]
  }
}
// if TiQ isn't allowed to fire, no tags will be fired at all, and no cookies will be set
window.tealiumCmpIntegration.tiqGroupName = 'Tealium iQ'
 */

window.tealiumCmpIntegration = window.tealiumCmpIntegration || {}

// the numbers are tag UIDs from the TiQ user interface
window.tealiumCmpIntegration.map = {
  yPyIAIIxY: {
    'Google Analytics': [6, 8, 10], // three Google Analytics tags in TiQ
    'Another Tag': [11]
  }
}

// refire if an event is processed twice (once implicitly consent, once explicitly)
window.tealiumCmpIntegration.refiringAllowed = [11]

// tags like Tealium Collect, where it should be refired for the same event (on implicit AND explicit consent)
window.tealiumCmpIntegration.refiringAllowed = []

// if TiQ isn't allowed to fire, no tags will be fired at all, and no cookies will be set
window.tealiumCmpIntegration.tiqGroupName = 'Tealium iQ'
