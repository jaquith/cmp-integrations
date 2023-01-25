# Tealium iQ CMP Integrations

A series of integrations between the Tealium iQ Tag Manager and various Consent Management Platforms (CMPs).


# See It in Action

Just visit the [OneTrust-managed demo site](https://www.otprivacy.com/user/jmyles/TagManagerDemo/OTKicks_Tealium/index.html).

If you want detailed logs, [activate debug mode](https://docs.tealium.com/platforms/javascript/debugging/) by pasting 

`document.cookie = "utagdb=true"`

in the developer tools console.

----

# Approach

The purpose of these integrations is to allow Tealium iQ customers to control **individual tags** based on a user's interactions with the CMP of their choice.

### Opt-in Model

 - Tealium iQ will not fire any tags, or set any cookies, until a consent decision is available from the CMP. If the expected CMP is not active on the page, or Tealium iQ is not consented to, Tealium iQ will not run, and no tags will be allowed to fire at all.

 - If a consent decision isn't found when Tealium iQ loads, this solution will continually poll until one is found.

 - Until a consent decision is found, all events are queued, so they can be processed when a decision is found.

 - When a consent decision (either implicit or explicit) is available from the CMP, the first check is whether Tealium iQ is allowed to run (since it sets cookies). 
 
  - If Tealium iQ is allowed to run, tags will be fired in accordance with that consent for all events that have been queued.

 - If the found consent decision is implicit, those events go into another queue after implicitly consented tags have been fired, so they can be re-processed for newly consented tags if the user makes an explicit decision. The solution will poll for an explicit decision until one is found.
 
 - If the found consent decision is explicit, all queues are emptied and polling stops. Tags that have already been fired on implicit consent are not re-fired when the explicit consent decision is processed unless included in the `refiringAllowed` array in the map and there are newly-consented purposes to process.

 - If a user reopens the CMP's interactive layer and makes a new explicit consent decision, past events are NOT reprocessed with the new consent decision.
 
 - For new events processed after initial Tealium iQ load, the fresh consent decision is retrieved from the CMP as each event is processed by Tealium iQ, to ensure the CMP is treated as the universal source of truth.

 *The opt-out model is very similar but simpler, (much) more detail [here](https://jaquith.github.io/cmp-integrations/).*

----


# Setting Up in Tealium iQ

Until this functionality is natively available in Tealium iQ, it can be implemented as follows:

1. Add your CMP to the appropriate pages on your site - either directly, or with a JavaScript extension scoped to Pre Loader. **Integrating the CMP as a tag won't work (because Tealium iQ won't fire tags without a signal from the CMP).**

2. Add 4 extensions from the extensions folder, making sure to update the `example-map` extension to match your setup.

    - `extension-1-example-map` <br/> Pre Loader, provides the mapping of TiQ tag UIDs to CMP groups.  **Update for each implementation.**

    - `extension-2-cmp-variants` <br/> Pre Loader, provides the CMP-specific logic needed for each supported integration. If needed, a new variant can be created to support a new CMP.

    - `extension-3` <br/> Pre Loader, decides if TiQ should load and overrides some system functions.  No need to modify.  Should be the LAST 'Pre Loader' extension.

    - `extension-4` <br/> All Tags - After Load Rules (should be the last extension in the list), blocks or allows tags based on implicit/explicit consent. No need to modify. Should be the LAST 'All Tags - After Load Rules' extension.

3. Modify `extension-1` to match your CMP / TiQ configuration.

4. Edit the utag loader template to include this line directly after `##UTGEN##`

    ````javascript
    // override a couple utag functions for the CMP integration (stopgap solution)
    window.tealiumCmpIntegration && window.tealiumCmpIntegration.overrideUtagFunctions && window.tealiumCmpIntegration.overrideUtagFunctions()
    ````

5. Publish (to Dev/QA) and test - detailed logging designed to help with troubleshooting and debugging will be displayed in the console if you [activate debug mode](https://docs.tealium.com/platforms/javascript/debugging/).

----

# Integrating a New CMP

To add a new integration, you can use the existing integrations and provided [example](https://github.com/jaquith/cmp-integrations/blob/main/extensions/extension-2-cmp-variants/extension-2-example.js) as a guide.

The CMP-specific component of the integration is defined in `extension-2` on the `window.tealiumCmpIntegration` object.

It consists of a name (`.cmpName`), a version indicator (`.cmpIntegrationVersion`), and the following functions:

### Determine operating mode

- `.cmpCheckIfOptInModel` <br/> Determine if the integration should operate on the 'opt-in' or 'opt-out' model

### Fetch decision

- `.cmpFetchCurrentConsentDecision` <br/> Get the current raw consent decision (raw, from the CMP)

### Validate and standardize the decision

- `.cmpCheckForWellFormedDecision` <br/> Check if the raw consent decision (from cmpFetchCurrentConsentDecision) is well-formed and understandable

- `.cmpCheckForTiqConsent` <br/> Check if the raw consent decision includes permission for Tealium iQ to process data (otherwise nothing runs)

- `.cmpCheckForExplicitConsentDecision` <br/> Check if the raw consent decision is explicit or implicit

- `.cmpConvertResponseToGroupList` <br/> Transform the raw decision from the CMP into a simple array of the allowed group names (should match the group names in the mapping in `extension-1`)

*More detail [here](https://jaquith.github.io/cmp-integrations/tealiumCmpIntegration.html).*

----

# Supported CMPs and Demo Pages

This framework is allowed to make it easy to support new CMPs, so please reach out / raise an issue if you've built something that should be added here so we can validate it and set up the unit tests together before adding it.

### Usercentrics Browser SDK
 - Supports opt-in mode (which also technically works for opt-out mode, but with unneeded polling)
 - [Bare-bones demo page](https://solutions.tealium.net/hosted/usercentrics-v2/test-page-standard.html)
 - [Bare-bones dataLayer listener demo page](https://solutions.tealium.net/hosted/usercentrics-v2/test-page-datalayer-listener.html)
 - [Integration Test Report](https://jaquith.github.io/cmp-integrations/usercentrics-integration-test-report/index.html)

### OneTrust
 - Supports both opt-in and opt-out modes
 - [OneTrust-managed Demo](https://www.otprivacy.com/user/jmyles/TagManagerDemo/OTKicks_Tealium/index.html)

----

# Server-side Enforcement

Tealium Collect must be mapped to a consented purpose, like all other tags. 

But the `refiringAllowed` option allows tags to be refired on new decisions, so one could clearly explain that the tag is used for a variety of server-side purposes and use the available server-side filters and logic to ensure the signal is only processed as appropriate, while allowing it to refire. 

Collect will fire with the following event-level attributes on each event:

 - `consent_type` - the ConsentDecision's 'type' attribute ('implicit' or 'explicit') when adding it to Tealium's b object on each event
 - `purposes_with_consent_all` - the full ConsentDecision array when adding it to Tealium's b object on each event
 - `purposes_with_consent_processed` - the array of already-processed consented purposes
 - `purposes_with_consent_unprocessed` - the array of not-yet-processed-but-consented purposes 

Depending on whether you're refiring Collect (and what server-side tools you're using), you should use either `purposes_with_consent_unprocessed` (with refiring) or `purposes_with_consent_all` (without refiring) as your primarly event-level consent attribute.

----


# Notes

 - Each tag can only be assigned a single Group name - there is no support for tags in multiple groups, by design.

----

# More Detail

The [developer docs](https://jaquith.github.io/cmp-integrations/) have much more detail.

----

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)
