#### Developer documentation for an integration between the Tealium iQ TMS and the Usercentrics Browser SDK (CMP Version 2)

----

## Approach

The purpose of this integration is to allow Tealium iQ customers to control **individual tags** based on a user's interactions with the Usercentrics Browser SDK (CMP Version 2).

 - Tealium iQ will not fire any tags, or set any cookies, until a consent decision is available from Usercentrics. If an expected settingId for Usercentrics is not active on the page, no tags will be allowed to fire at all.

 - If a consent decision isn't found when Tealium iQ loads, this solution will continually poll until one is found.

 - Until a consent decision is found, all events are queued, so they can be processed when a decision is found.

 - When a consent decision (either implicit or explicit) is available from Usercentrics, tags will be fired in accordance with that consent for all events that have been queued.

 - If the found consent decision is implicit, those events go into another queue after implicitly consented tags have been fired, so they can be re-processed for newly consented tags if the user makes an explicit decision. The solution will poll for an explicit decision until one is found.
 
 - If the found consent decision is explicit, all queues are emptied and polling stops. Tags that have already been fired on implicit consent are not re-fired when the explicit consent decision is processed.

 - If a user reopens Usercentrics and makes a new explicit consent decision, past events are NOT reprocessed with the new consent decision.
 
 - For new events processed after initial Tealium iQ load, the fresh consent decision is retrieved from Usercentrics as each event is processed by Tealium iQ.

----

#### What does it do?

 - Allows individual Tealium iQ tags to be associated with a Usercentrics service name (like "Google Analytics" or "Tealium iQ Tag Management").
 - Blocks any tags without consent from firing. The blocking logic works even for tags that are explicitly called using the 'uids' array (which circumvents load rules).
 - Allows any implicitly allowed tags to fire immediately (before user decision), then reprocesses the same event(s) for new tags only if the user makes an explicit choice.
 - Makes the consent information available in each tracking event (in the _b_ object), as 
   - `b.usercentrics_services_with_consent` - array of allowed service names
   - `b.usercentrics_consent_type` - 'explicit' or 'implicit'
 - Allows more than one tag to be mapped to a given service name.

#### What does it NOT do?

 - Doesn't use any of Tealium iQ's built-in Consent Manager (or Privacy Manager) functionality, to avoid interference with legacy setups and allow more granular blocking.
 - Doesn't set any cookies, add any entries to localStorage, or read any localStorage entries directly (instead, it uses Usercentrics methods to check consent as needed).
 - Doesn't allow more than one service name to be mapped to a given tag.
 - **Doesn't support TCF 2.0 or CCPA (so far). Relevant Tasks: [TCF 2.0](https://tealium.atlassian.net/browse/CMPI-14) [CCPA](https://tealium.atlassian.net/browse/CMPI-18)**

The only per-profile** configuration required is a map of service names to tag UIDs for each relevant Usercentrics settings ID, see [GroupToTagMap](https://jaquith.github.io/usercentrics-integration-v2/global.html#GroupToTagMap) for more detailed information.

----

## Using this Documentation

This documentation is intended for developers, and was generated using [JSDoc](https://jsdoc.app/).

The menu headings offered by JSDoc don't fit our needs perfectly.  You should read the headings as follows:

  - **MODULES** - Tealium iQ extensions / JS files
  - **NAMESPACES** - global object(s) on the page (window-scoped)
  - **GLOBAL** -  key data structures.  Classes seem like they'd be better, but would include misleading constructors declarations.

----

## Configuration Steps

Those steps are available in the README of the [repo](https://github.com/jaquith/usercentrics-v2-integration). 

Since this integration is still being formalized, the repo hasn't been made public. Early access is possible on [request](mailto:julian.llorente@tealium.com).

----

## Test Report

Some preliminary cross-browser tests have been run using a separate under-development testing tool - the most recent results can be viewed [here](https://jaquith.github.io/usercentrics-v2-integration/integration-test-report).

----

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)
