/* global reporterHelper, rootRequire, $, proxyHelper, describe, it, browser, chai */

const helper = rootRequire('test-helpers/user-helpers/caleb-jaquith/usercentrics-v2-general-integration-test-helper.js')

let proxyOutput
let firedTagLogs

describe('STEP 1 - initial visit to test page', function () {
  it('should navigate to the page', async function () {
    await browser.url(helper.noviewTestPage)
    await browser.waitForTraffic()
    await reporterHelper.takeScreenshot('On landing')
  })

  it('should have the correct title', async function () {
    const title = await browser.getTitle()
    chai.expect(title).to.equal('Usercentrics v2 Test')
  })

  it('should have a utag_main cookie', async function () {
    await browser.waitForTraffic()
    const cookie = await browser.getCookieByName('utag_main')
    chai.expect(cookie).to.be.an('object').with.property('value').that.is.a('string')
  })

  it('should have a visible Usercentrics banner', async function () {
    const ucBanner = await $(helper.selectors.usercentricsBanner)
    chai.expect(ucBanner).to.not.be.undefined()
    chai.expect(await ucBanner.isClickable()).to.equal(true)
  })

  it('should NOT have queued an initial view event (because of the noview setting)', async function () {
    const queueLength = await browser.execute(function () {
      return window.tealiumCmpIntegration.implicitEventQueue.length
    })
    chai.expect(queueLength).to.equal(0)
  })

  it('should have the current version of the Usercentrics integration running', async function () {
    const integrationVersion = await browser.execute(function () {
      return window.tealiumCmpIntegration && window.tealiumCmpIntegration.version
    })
    // node.js context - client and console are available
    chai.expect(integrationVersion).to.equal(helper.currentVersion)
  })
})

describe('STEP 2 - deny all tracking', function () {
  it('should deny tracking', async function () {
    const denyButton = await $(helper.selectors.denyAllButton)
    await denyButton.click()
    await browser.waitForTraffic() // wait for any network calls
  })

  it('should NOT have a visible Usercentrics banner anymore', async function () {
    await reporterHelper.takeScreenshot('After decision.')
    const ucBanner = await $(helper.selectors.usercentricsBanner)
    chai.expect(ucBanner).to.be.an('object').with.property('isDisplayed').that.is.a('function')
    chai.expect(await ucBanner.isDisplayed()).to.equal(false)
  })

  it('should have an empty queue', async function () {
    const queueLength = await browser.execute(function () {
      return window.tealiumCmpIntegration.implicitEventQueue.length
    })
    chai.expect(queueLength).to.equal(0)
  })
})

describe('STEP 3 - fire virtual page view to tags 6 and 7 only by clicking button', function () {
  it('should click the button to fire tracking', async function () {
    const button = await $(helper.selectors.specificViewButton6and7)
    await button.click()
    await browser.waitForTraffic() // wait for any network calls
  })
})

describe('FINALIZE - get Proxy logs to confirm tag firings', function () {
  it('finish the run and get the logs', async function () {
    proxyOutput = await proxyHelper.getLogs()
  })

  it('should verify step creation in LiveConnect', async function () {
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step1')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step2')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step3')
  })

  it('should generate the filtered logs', async function () {
    firedTagLogs = proxyOutput.getFilteredLogs(helper.testTagUrl)
    reporterHelper.logMessage(JSON.stringify(firedTagLogs, null, 2))
    chai.expect(firedTagLogs).to.be.an('object')
  })
})

describe('VERIFY - check the network logs to make sure the correct tags fired for each step', function () {
  it('basic log validation', async function () {
    chai.expect(proxyOutput.logs).to.be.an('object')
  })

  it('Step 1 should not fire any tags', async function () {
    reporterHelper.logMessage('The noview setting should be respected.')
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(9))
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(10))
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(11))
  })

  it('Step 2 should not have fired any tags based on EXPLICIT consent', async function () {
    reporterHelper.logMessage('The virtual view is scoped to tags 6 and 7, but only 7 has implicit consent (and it already fired).')
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(9))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(10))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(11))
  })

  it('Step 3 should have fired ONLY tag 7 based on EXPLICIT consent -  tag 6 would have been fired (and it\'s been opted out)', async function () {
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step3).to.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(9))
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(10))
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(11))
  })
  it('Tag 6 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Tag 6 has been specified in virtual views, but has been opted out.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(8))
  })

  it('Tag 8 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Tag 8 was never specified in a virtual view, and there has been no general tracking event.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(8))
  })

  it('Tag 9 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Tag 9 was never specified in a virtual view, and there has been no general tracking event.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(9))
  })

  it('Tag 10 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Tag 10 was never specified in a virtual view, and there has been no general tracking event.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(10))
  })

  it('Tag 11 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Tag 11 is misconfigured, as \'Another Tag\', which isn\'t a configured Service in Usercentrics')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(11))
  })

  it('Tag 15 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Tag 15 is not configured in the mapping, so it should never fire')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(15))
  })
})
