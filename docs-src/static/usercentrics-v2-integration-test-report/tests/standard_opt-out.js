/* global reporterHelper, rootRequire, $, proxyHelper, describe, it, browser, chai */

const helper = rootRequire('test-helpers/user-helpers/caleb-jaquith/usercentrics-v2-general-integration-test-helper.js')

let proxyOutput
let firedTagLogs

describe('STEP 1 - initial visit to test page', function () {
  it('should navigate to the page', async function () {
    await browser.url(helper.standardTestPage)
    await browser.waitForTraffic()
    await reporterHelper.takeScreenshot('On landing')
  })

  it('should have the correct title', async function () {
    const title = await browser.getTitle()
    chai.expect(title).to.equal('Usercentrics v2 Test')
  })

  it('should have a utag_main cookie', async function () {
    await browser.waitForTraffic()
    await browser.pause(5000) // wait (for safari?)
    reporterHelper.logMessage('TiQ will run.')
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
    const denyButton = $(helper.selectors.denyAllButton)
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

describe('STEP 3 - fire virtual page view to tag 10 only by clicking button', function () {
  it('should click the button to fire tracking', async function () {
    const button = await $(helper.selectors.specificViewButton10)
    await button.click()
    await browser.waitForTraffic() // wait for any network calls
  })
})

describe('STEP 4 - fire virtual page view by clicking button', function () {
  it('should click the button to fire tracking', async function () {
    const button = await $(helper.selectors.standardViewButton)
    await button.click()
    // await browser.pause(12000) // debugging
    await browser.waitForTraffic() // wait for any network calls
  })
})

describe('STEP 5 - fire virtual page view to tag 11 only', function () {
  it('should fire the virtual view to tag 11', async function () {
    const button = await $(helper.selectors.specificViewButton11)
    await button.click()
    await browser.waitForTraffic() // wait for any network calls
  })
})

describe('STEP 6 - fire virtual page view to tags 7 and 11 only', function () {
  it('should fire the virtual view to tags 7 and 11 only', async function () {
    const button = await $(helper.selectors.specificViewButton7and11)
    await button.click()
    await browser.waitForTraffic() // wait for any network calls
  })
})

describe('FINALIZE - get Proxy logs to confirm tag firings', function () {
  it('finish the run and get the logs', async function () {
    proxyOutput = await proxyHelper.getLogs()
  })

  it('basic log validation', async function () {
    chai.expect(proxyOutput.logs).to.be.an('object')
  })

  it('verify step creation in LiveConnect', async function () {
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step1')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step2')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step3')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step4')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step5')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step6')
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

  it('Step 1 should have fired tags 7 and 9 based on IMPLICIT consent', async function () {
    reporterHelper.logMessage('Those tags are categorized as Mouseflow, which is set up to fire by default (with implicit consent).')
    chai.expect(firedTagLogs.step1).to.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step1).to.include.something.like(helper.getTestTagObject(9))
  })

  it('Step 1 should NOT have fired tags 6, 8 or 10 based on IMPLICIT consent', async function () {
    reporterHelper.logMessage('Those are categorized as Google Analytics, which is set up to require explicit consent.')
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(10))
  })

  it('Step 2 should not have refired tags 7 and 9 based on EXPLICIT consent (or fired any other tags)', async function () {
    reporterHelper.logMessage('Since it was an opt-out decision, no tags should fire on decision')
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(9))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(10))
  })

  it('Step 3 should NOT have fired tags 7 or 9 (even with implicit consent) because the virtual view was tag-specific (only 10 should fire)', async function () {
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(9))
  })

  it('Step 4 should only fire tags 7 or 9 based on EXPLICIT consent', async function () {
    reporterHelper.logMessage('No option to opt out of these tags')
    chai.expect(firedTagLogs.step4).to.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step4).to.include.something.like(helper.getTestTagObject(9))
  })

  it('Step 4 should have NOT fired tags 6, 8, or 10 based on EXPLICIT consent', async function () {
    reporterHelper.logMessage('Since consent was denied for \'Google Analytics\', these tags should not have fired at any point.')
    chai.expect(firedTagLogs.step4).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step4).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step4).to.not.include.something.like(helper.getTestTagObject(10))
  })

  it('Step 5 should not fire any tags', async function () {
    reporterHelper.logMessage('The virtual view was specific to tag 11, which has no entry in Usercentrics and should never fire.')
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(9))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(10))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(11))
  })

  it('Step 6 should have ONLY fired tag 7 based on EXPLICIT consent', async function () {
    reporterHelper.logMessage('Tag 11 is mapped to the service \'Another Tag\', which isn\'t configured in Usercentrics.')
    reporterHelper.logMessage(`${JSON.stringify(helper.getTestTagObject(11), null, 2)}`)
    reporterHelper.logMessage(`${JSON.stringify(firedTagLogs.step6, null, 2)}`)
    chai.expect(firedTagLogs.step6).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step6).to.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step6).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step6).to.not.include.something.like(helper.getTestTagObject(9))
    chai.expect(firedTagLogs.step6).to.not.include.something.like(helper.getTestTagObject(10))
    chai.expect(firedTagLogs.step6).to.not.include.something.like(helper.getTestTagObject(11))
  })

  it('Tag 6 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Tag 6 was opted out (\'Google Analytics\'), so it shouldn\'t fire at all.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(6))
  })

  it('Tag 8 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Tag 8 was opted out (\'Google Analytics\'), so it shouldn\'t fire at all.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(8))
  })

  it('Tag 10 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Tag 10 was opted out (\'Google Analytics\'), so it shouldn\'t fire at all.')
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
