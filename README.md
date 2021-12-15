# Tealium iQ CMP Integrations

A series of integrations between the Tealium iQ Tag Manager and various Consent Management Platforms (CMPs).

----

# Approach

The purpose of these integrations is to allow Tealium iQ customers to control **individual tags** based on a user's interactions with the CMP of their choice.

 - Tealium iQ will not fire any tags, or set any cookies, until a consent decision is available from the CMP. If the expected CMP is not active on the page, no tags will be allowed to fire at all.

 - If a consent decision isn't found when Tealium iQ loads, this solution will continually poll until one is found.

 - Until a consent decision is found, all events are queued, so they can be processed when a decision is found.

 - When a consent decision (either implicit or explicit) is available from the CMP, tags will be fired in accordance with that consent for all events that have been queued.

 - If the found consent decision is implicit, those events go into another queue after implicitly consented tags have been fired, so they can be re-processed for newly consented tags if the user makes an explicit decision. The solution will poll for an explicit decision until one is found.
 
 - If the found consent decision is explicit, all queues are emptied and polling stops. Tags that have already been fired on implicit consent are not re-fired when the explicit consent decision is processed.

 - If a user reopens the CMP's interactive layer and makes a new explicit consent decision, past events are NOT reprocessed with the new consent decision.
 
 - For new events processed after initial Tealium iQ load, the fresh consent decision is retrieved from the CMP as each event is processed by Tealium iQ, to ensure the CMP is treated as the universal source of truth.

 ----

# Configuration Steps

Until this is added as a turnkey extension, it can be implemented as follows:

1. Add your CMP to the appropriate pages on your site - either directly, or with a JavaScript extension scoped to Pre Loader. **Integrating the CMP as a tag won't work (because Tealium iQ won't fire tags without a signal from the CMP).**

2. Add 4 extensions from the extensions folder, making sure to update the `example-map` extension to match your setup.

    - `extension-1-example-map.js` - Pre Loader, provides the mapping of TiQ tag UIDs to CMP groups.  **Requires modification and maintenance per customer implementation.**
    - `extension-2-cmp-variants.js` - Pre Loader, provides the CMP-specific logic needed for each supported integration.  **Requires modification for each CMP, but no per-customer changes.**
    - `extension-3.js` - Pre Loader, decides if TiQ should load and overrides some system functions.  No need to modify.  Should be the LAST 'Pre Loader' extension.
    - `extension-4.js` - All Tags - After Load Rules (should be the last extension in the list), blocks or allows tags based on implicit/explicit consent. No need to modify. Should be the LAST 'All Tags - After Load Rules' extension.

3. Modify the `example-map.js` extension to match your Usercentrics / TiQ configuration.  There is a helper script in the comments of that extension that will generate the basis.

4. Edit the utag loader template to include this line directly after `##UTGEN##`

    ````javascript
    // override a couple utag functions for the Usercentrics integration (stopgap solution)
    window.tealiumCmpIntegration && window.tealiumCmpIntegration.overrideUtagFunctions && window.tealiumCmpIntegration.overrideUtagFunctions()
    ````

5. Publish (to Dev/QA) and test - detailed logging designed to help with troubleshooting and debugging will be displayed in the console if you [activate debug mode](https://docs.tealium.com/platforms/javascript/debugging/).

----


# Notes

 - Each tag can only be assigned a single Group name - there is no support for tags in multiple groups, by design.

----

# Further Documentation

Developer documentation is available [here](https://jaquith.github.io/cmp-integrations/).

----


[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)
