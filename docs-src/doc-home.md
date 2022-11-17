### Developer documentation for a CMP Integration Framework for Tealium iQ.

----

# Configuration

Guides to setting up this solution in Tealium iQ, and adding a new CMP, are available in the README of the [repo](https://github.com/jaquith/cmp-integrations). 

----

# Approach

The purpose of this integration is to allow Tealium iQ customers to control **individual tags** based on a user's interactions with various Consent Management Platforms (CMPs).

## Core Behaviors (Opt-In Model)

 - Tealium iQ will not fire any tags, or set any cookies, until a consent decision is available from the CMP. The expected CMP is not active on the page, no tags will be allowed to fire at all, and no cookies will be set.

 - If a consent decision isn't found when Tealium iQ loads, this solution will continually poll until one is found.

 - Until a consent decision is found, all events are queued, so they can be processed when a decision is found.

 - When a consent decision (either implicit or explicit) is available from the CMP, tags will be fired in accordance with that consent for all events that have been queued.

 - If the found consent decision is implicit and the opt-in pattern is active, events go into another queue after implicitly consented tags have been fired, so they can be re-processed for newly consented tags if the user makes an explicit decision. The solution will poll for an explicit decision until one is found, when appropriate.
 
 - If the found consent decision is explicit, all queues are emptied and polling stops. Tags that have already been fired on implicit consent are not re-fired when the explicit consent decision is processed.

 - If a user reopens the CMP's interactive layer and makes a new explicit consent decision, past events are NOT reprocessed with the new consent decision.
 
 - For new events processed after initial Tealium iQ load, the fresh consent decision is retrieved from the CMP as each event is processed by Tealium iQ.

## Opt-In Flow

For regulations like GDPR.

<img style="max-width: 1200px;" src='tiq-cmp-integration-flow-opt-in.png'/>

## Opt-Out Flow

For regulations like CCPA - the opt-in flow also works, but this simplified flow is more efficient.

<img style="max-width: 1200px;" src='tiq-cmp-integration-flow-opt-out.png'/>

----

# What does it do?

 - Allows individual Tealium iQ tags to be associated with a CMP group name (like "Google Analytics" or "Tealium iQ Tag Management" or "Analytics").
 - Blocks any tags without consent from firing. The blocking logic works even for tags that are explicitly called using the `uids` array (which circumvents load rules).
 - Allows any implicitly allowed tags to fire immediately (before user decision), then reprocesses the same event(s) for new tags only if the user makes an explicit choice.
 - Makes the consent information available in each tracking event (in the `b` object), as: 
   - `b.consent_type` - 'explicit' or 'implicit', name can be overridden
   - `b.groups_with_consent_all` - array of all allowed groups, name can be overridden
   - `b.groups_with_consent_processed` - array of allowed groups, name can be overridden
   - `b.groups_with_consent_unprocessed` - array of all allowed but not yet processed groups, name can be overridden
 - Allows more than one tag to be mapped to a given service name.

# What does it NOT do?

 - Doesn't use any of Tealium iQ's built-in Consent Manager (or Privacy Manager) functionality, to avoid interference with legacy setups and allow more granular blocking.
 - Doesn't set any cookies, add any entries to localStorage, or read any localStorage entries directly (instead, it uses CMP methods to check consent as needed).
 - Doesn't allow more than one service name to be mapped to a given tag.


The only **per-profile** configuration required is a map of service names to tag UIDs for each relevant CMP setting ID, see [GroupToTagMap](https://jaquith.github.io/cmp-integrations/global.html#GroupToTagMap) for more detailed information.

----

# Server-side Enforcement

Tealium Collect must be mapped to a consented purpose, like all other tags. 

But the `refiringAllowed` option allows tags to be refired on new decisions, so one could clearly explain that the tag is used for a variety of server-side purposes and use the available server-side filters and logic to ensure the signal is only processed as appropriate, while allowing it to refire. 

Collect will include the event-level attributes on each event:

 - `consent_type` - the ConsentDecision's 'type' attribute ('implicit' or 'explicit') when adding it to Tealium's b object on each event
 - `purposes_with_consent_all` - the full ConsentDecision array when adding it to Tealium's b object on each event
 - `purposes_with_consent_processed` - the array of already-processed consented groups
 - `purposes_with_consent_unprocessed` - the array of not-yet-processed-but-consented groups 

Depending on whether you're refiring Collect (and what server-side tools you're using), you should use either `purposes_with_consent_unprocessed` (with refiring) or `purposes_with_consent_all` (without refiring) as your primarly event-level consent attribute.

----

# Using this Documentation

This documentation is intended for developers, and was generated using [JSDoc](https://jsdoc.app/).

The menu headings offered by JSDoc don't fit our needs perfectly.  You should read the headings as follows:

  - **MODULES** - Tealium iQ extensions / JS files
  - **NAMESPACES** - global object(s) on the page (window-scoped)
  - **GLOBAL** -  key data structures.  Classes seem like they'd be better, but would include misleading constructors declarations.

----

# Known Limitations

This framework presently uses polling, and expects a synchronous response from the `cmpFetchCurrentConsentDecision` method - patterns like callbacks and event listeners will be explored in subsequent iterations, and will be more resource-efficient (less polling, but likely still a bit to solve the CMP/TiQ race).  For now, we've prioritized simplicity and reliability.

Maintaining a map in JSON not an ideal user experience - we're working to formalize this approach natively in Tealium iQ.

----

# Testing

## Unit Tests

There are unit tests set up for each CMP integration, you can run them (and the linter) with `npm test`, and it's set up to easily test new integrations with very little effort.

## Integration Tests
 - [Usercentrics Browser SDK (Opt-in model)](usercentrics-integration-test-report/index.html).

A list of supported CMPs and demo pages is available in the README of the [repo](https://github.com/jaquith/cmp-integrations)

----

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)
