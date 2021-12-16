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

describe('STEP 2 - accept all tracking', function () {
  it('should accept tracking', async function () {
    const acceptButton = $(helper.selectors.acceptAllButton)
    await acceptButton.click()
    await browser.waitForTraffic() // wait for any network calls
  })

  it('should NOT have a visible Usercentrics banner anymore', async function () {
    await reporterHelper.takeScreenshot('After decision.')
    const ucBanner = await $(helper.selectors.usercentricsBanner)
    chai.expect(ucBanner).to.be.an('object').with.property('isDisplayed').that.is.a('function')
    chai.expect(await ucBanner.isDisplayed()).to.equal(false)
    await browser.waitForTraffic()
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
    await browser.waitForTraffic() // wait for any network calls
    // await browser.pause(12000) // debugging
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

  it('should perform very basic object validation', async function () {
    chai.expect(proxyOutput.logs).to.be.an('object')
  })

  it('should verify step creation', async function () {
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step1').that.is.an('array')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step2').that.is.an('array')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step3').that.is.an('array')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step4').that.is.an('array')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step5').that.is.an('array')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step6').that.is.an('array')
  })

  it('should generate the filtered logs', async function () {
    firedTagLogs = proxyOutput.getFilteredLogs(helper.testTagUrl)
    reporterHelper.logMessage(JSON.stringify(firedTagLogs, null, 2))
    chai.expect(firedTagLogs).to.be.an('object')
  })
})

describe('VERIFY - check the network logs to make sure the correct tags fired for each step', function () {
  it('Step 1 should have fired tags 7 and 9 based on IMPLICIT consent', async function () {
    reporterHelper.logMessage('Those tags are categorized as Mouseflow, which is set up to fire by default (with implicit consent).')
    chai.expect(firedTagLogs.step1).to.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step1).to.include.something.like(helper.getTestTagObject(9))
  })

  it('Step 1 should NOT have fired tags 6, 8 or 10 based on IMPLICIT consent', async function () {
    reporterHelper.logMessage('Those are categorized as \'Google Analytics\', which is set up to require explicit consent.')
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(10))
  })

  it('Step 2 should have fired tags 6, 8, and 10 based on EXPLICIT consent', async function () {
    reporterHelper.logMessage('Those tags are categorized as \'Mouseflow\', which is set up to fire by default (with implicit consent).')
    chai.expect(firedTagLogs.step2).to.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step2).to.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step2).to.include.something.like(helper.getTestTagObject(10))
  })

  it('Step 3 should only fire tag 10', async function () {
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(9))
    chai.expect(firedTagLogs.step3).to.include.something.like(helper.getTestTagObject(10))
  })

  it('Step 4 should have fired tag 6 based on EXPLICIT consent', async function () {
    reporterHelper.logMessage('Full opt-in case')
    reporterHelper.logMessage(JSON.stringify(firedTagLogs.step4, null, 2))
    reporterHelper.logMessage(JSON.stringify(helper.getTestTagObject(6), null, 2))
    chai.expect(firedTagLogs.step4).to.include.something.like(helper.getTestTagObject(6))
  })

  it('Step 4 should have fired tag 7 based on EXPLICIT consent', async function () {
    reporterHelper.logMessage('Full opt-in case')
    reporterHelper.logMessage(JSON.stringify(firedTagLogs.step4, null, 2))
    reporterHelper.logMessage(JSON.stringify(helper.getTestTagObject(7), null, 2))
    chai.expect(firedTagLogs.step4).to.include.something.like(helper.getTestTagObject(7))
  })

  it('Step 4 should have fired tag 8 based on EXPLICIT consent', async function () {
    reporterHelper.logMessage('Full opt-in case')
    reporterHelper.logMessage(JSON.stringify(firedTagLogs.step4, null, 2))
    reporterHelper.logMessage(JSON.stringify(helper.getTestTagObject(8), null, 2))
    chai.expect(firedTagLogs.step4).to.include.something.like(helper.getTestTagObject(8))
  })

  it('Step 4 should have fired tag 9 based on EXPLICIT consent', async function () {
    reporterHelper.logMessage('Full opt-in case')
    reporterHelper.logMessage(JSON.stringify(firedTagLogs.step4, null, 2))
    reporterHelper.logMessage(JSON.stringify(helper.getTestTagObject(9), null, 2))
    chai.expect(firedTagLogs.step4).to.include.something.like(helper.getTestTagObject(9))
  })

  it('Step 5 should not fire any tags', async function () {
    reporterHelper.logMessage('Tag 11 is mapped to the service \'Another Tag\', which isn\'t configured in Usercentrics, so it shouldn\'t fire, and this virtual view was sent only to that tag.')
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(9))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(10))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(11))
  })

  it('Step 6 should have ONLY fired tag 7 on EXPLICIT consent', async function () {
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

  it('Tag 11 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Tag 11 is misconfigured, as \'Another Tag\', which isn\'t a configured Service in Usercentrics')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(11))
  })

  it('Tag 15 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Tag 15 is not configured in the mapping, so it should never fire')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(15))
  })
})
