/* global reporterHelper, rootRequire, $, proxyHelper, describe, it, browser, chai */

const helper = rootRequire('test-helpers/user-helpers/caleb-jaquith/usercentrics-v2-general-integration-test-helper.js')

let proxyOutput
let firedTagLogs

const initialView = helper.tagValidationObjects.initialView
const event1 = helper.tagValidationObjects.event1
const event2 = helper.tagValidationObjects.event2
const event3 = helper.tagValidationObjects.event3
const virtualView = helper.tagValidationObjects.virtualView

describe('STEP 1 - initial visit to test page', function () {
  it('should navigate to the page', async function () {
    await browser.url(helper.datalayerListenerTestPage)
    await browser.waitForTraffic()
    await reporterHelper.takeScreenshot()
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

  it('should have the current version of the Usercentrics integration running', async function () {
    const integrationVersion = await browser.execute(function () {
      return window.tealiumCmpIntegration && window.tealiumCmpIntegration.version
    })
    // node.js context - client and console are available
    reporterHelper.logMessage(integrationVersion)
    chai.expect(integrationVersion).to.equal(helper.currentVersion)
  })
})

describe('STEP 2 - deny tracking', function () {
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
})

describe('STEP 3 - fire virtual page view by clicking button', function () {
  it('should click the button to fire tracking', async function () {
    const button = await $(helper.selectors.standardViewButton)
    await button.click()
    await browser.pause(3000)
    await browser.waitForTraffic() // wait for any network calls
  })
})

describe('STEP 4 - fire another virtual page view by clicking button', function () {
  it('should click the button to fire tracking', async function () {
    const button = await $(helper.selectors.standardViewButton)
    await button.click()
    await browser.pause(3000)
    await browser.waitForTraffic() // wait for any network calls
  })
})

describe('STEP 5 - second visit to test page', function () {
  it('should navigate to the page', async function () {
    await browser.url(helper.datalayerListenerTestPage)
    await browser.waitForTraffic()
    await browser.pause(3000)
    await reporterHelper.takeScreenshot()
  })

  it('should have the correct title', async function () {
    const title = await browser.getTitle()
    chai.expect(title).to.equal('Usercentrics v2 Test')
  })

  it('should NOT have a visible Usercentrics banner anymore', async function () {
    await reporterHelper.takeScreenshot('After decision.')
    const ucBanner = await $(helper.selectors.usercentricsBanner)
    chai.expect(ucBanner).to.be.an('object').with.property('isDisplayed').that.is.a('function')
    chai.expect(await ucBanner.isDisplayed()).to.equal(false)
  })

  it('should have a utag_main cookie', async function () {
    await browser.waitForTraffic()
    const cookie = await browser.getCookieByName('utag_main')
    chai.expect(cookie).to.be.an('object').with.property('value').that.is.a('string')
  })
})

describe('FINALIZE - get Proxy logs', function () {
  it('finish the run and get the logs', async function () {
    proxyOutput = await proxyHelper.getLogs()
  })

  it('should verify step creation in LiveConnect', async function () {
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step1')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step2')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step3')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step4')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step5')
  })

  it('should generate the filtered logs', async function () {
    firedTagLogs = proxyOutput.getFilteredLogs(helper.testTagUrl)
    reporterHelper.logMessage(JSON.stringify(firedTagLogs, null, 2))
    chai.expect(firedTagLogs).to.be.an('object')
  })
})

describe('VERIFY STEP 1 - make sure the correct tags fired', function () {
  it('Step 1 should have fired tag 7 based on IMPLICIT consent for the intial pageview', async function () {
    chai.expect(firedTagLogs.step1).to.include.something.like(helper.getTestTagObject(7, initialView))
  })

  it('Step 1 should have fired tag 9 based on IMPLICIT consent for the intial pageview', async function () {
    chai.expect(firedTagLogs.step1).to.include.something.like(helper.getTestTagObject(9, initialView))
  })

  it('Step 1 should have fired tag 7 based on IMPLICIT consent for event1', async function () {
    chai.expect(firedTagLogs.step1).to.include.something.like(helper.getTestTagObject(7, event1))
  })

  it('Step 1 should have fired tag 9 based on IMPLICIT consent for event1', async function () {
    chai.expect(firedTagLogs.step1).to.include.something.like(helper.getTestTagObject(9, event1))
  })

  it('Step 1 should have fired tag 7 based on IMPLICIT consent for event2', async function () {
    chai.expect(firedTagLogs.step1).to.include.something.like(helper.getTestTagObject(7, event2))
  })

  it('Step 1 should have fired tag 9 based on IMPLICIT consent for event2', async function () {
    chai.expect(firedTagLogs.step1).to.include.something.like(helper.getTestTagObject(9, event2))
  })

  it('Step 1 should have fired tag 7 based on IMPLICIT consent for event3', async function () {
    chai.expect(firedTagLogs.step1).to.include.something.like(helper.getTestTagObject(7, event3))
  })

  it('Step 1 should have fired tag 9 based on IMPLICIT consent for event3', async function () {
    chai.expect(firedTagLogs.step1).to.include.something.like(helper.getTestTagObject(9, event3))
  })

  it('Step 1 should NOT have fired tags 6, 8 or 10 based on IMPLICIT consent', async function () {
    reporterHelper.logMessage('Those are categorized as \'Google Analytics\', which is set up to require explicit consent.')
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(10))
  })
})

describe('VERIFY STEP 2 - make sure the correct tags fired', function () {
  it('Step 2 should NOT have fired tags 6, 8 or 10 (because the user opted out)', async function () {
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(10))
  })
})

describe('VERIFY STEP 3 - make sure the correct tags fired', function () {
  it('Step 3 should have fired tag 7 based on EXPLICIT consent for the virtual pageview', async function () {
    chai.expect(firedTagLogs.step3).to.include.something.like(helper.getTestTagObject(7, virtualView))
  })

  it('Step 3 should have fired tag 9 based on EXPLICIT consent for the virtual pageview', async function () {
    chai.expect(firedTagLogs.step3).to.include.something.like(helper.getTestTagObject(9, virtualView))
  })

  it('Step 3 should NOT have fired tags 6, 8 or 10 based on EXPLICIT consent', async function () {
    reporterHelper.logMessage('Those are categorized as \'Google Analytics\', which is set up to require explicit consent.')
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(10))
  })
})

describe('VERIFY STEP 4 - make sure the correct tags fired', function () {
  it('Step 4 should fire tags 7 and 9', async function () {
    reporterHelper.logMessage(JSON.stringify(firedTagLogs.step4, null, 2))
    chai.expect(firedTagLogs.step4).to.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step4).to.include.something.like(helper.getTestTagObject(9))
  })

  it('Step 4 should NOT fire tags 6, 8 or 10', async function () {
    reporterHelper.logMessage(JSON.stringify(firedTagLogs.step4, null, 2))
    chai.expect(firedTagLogs.step4).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step4).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step4).to.not.include.something.like(helper.getTestTagObject(10))
  })
})

describe('VERIFY STEP 5 - tags should have fired based on previous consent choice', function () {
  it('Step 5 should have fired tag 7 based on EXPLICIT consent for the intial pageview', async function () {
    chai.expect(firedTagLogs.step5).to.include.something.like(helper.getTestTagObject(7, initialView))
  })
  it('Step 5 should have fired tag 9 based on EXPLICIT consent for the intial pageview', async function () {
    chai.expect(firedTagLogs.step5).to.include.something.like(helper.getTestTagObject(9, initialView))
  })

  it('Step 5 should have fired tag 7 based on EXPLICIT consent for event1', async function () {
    chai.expect(firedTagLogs.step5).to.include.something.like(helper.getTestTagObject(7, event1))
  })
  it('Step 5 should have fired tag 9 based on EXPLICIT consent for event1', async function () {
    chai.expect(firedTagLogs.step5).to.include.something.like(helper.getTestTagObject(9, event1))
  })

  it('Step 5 should have fired tag 7 based on EXPLICIT consent for event2', async function () {
    chai.expect(firedTagLogs.step5).to.include.something.like(helper.getTestTagObject(7, event2))
  })
  it('Step 5 should have fired tag 9 based on EXPLICIT consent for event2', async function () {
    chai.expect(firedTagLogs.step5).to.include.something.like(helper.getTestTagObject(9, event2))
  })

  it('Step 5 should have fired tag 7 based on EXPLICIT consent for event3', async function () {
    chai.expect(firedTagLogs.step5).to.include.something.like(helper.getTestTagObject(7, event3))
  })
  it('Step 5 should have fired tag 9 based on EXPLICIT consent for event3', async function () {
    chai.expect(firedTagLogs.step5).to.include.something.like(helper.getTestTagObject(9, event3))
  })
})

describe('VERIFY BLOCKED TAGS - make sure certain tags were completely blocked', function () {
  it('Tag 6 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('The user opted out.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(11))
  })

  it('Tag 8 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('The user opted out.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(11))
  })

  it('Tag 10 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('The user opted out.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(11))
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
