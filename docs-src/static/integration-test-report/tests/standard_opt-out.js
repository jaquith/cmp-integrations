/* global reporterHelper, rootRequire, $, proxyHelper, opJourneyId, opRunId, describe, it, browser, chai */

const helper = rootRequire('helpers/specific/usercentrics-v2-general-integration-test-helper.js')

let proxyOutput
let firedTagLogs

describe('STEP 1 - initial visit to test page', () => {
  it('should navigate to the page', () => {
    browser.url(helper.standardTestPage)
    browser.waitForTraffic()
    reporterHelper.takeScreenshot('On landing')
  })

  it('should have the correct title', () => {
    const title = browser.getTitle()
    chai.expect(title).to.equal('Usercentrics v2 Test')
  })

  it('should have a utag_main cookie', () => {
    browser.waitForTraffic()
    browser.pause(5000) // wait (for safari?)
    reporterHelper.logMessage('TiQ will run.')
    const cookie = browser.getCookieByName('utag_main')
    chai.expect(cookie).to.be.an('object').with.property('value').that.is.a('string')
  })

  it('should have a visible Usercentrics banner', () => {
    const ucBanner = $(helper.selectors.ucShadow).shadow$(helper.selectors.usercentricsBanner)
    chai.expect(ucBanner).to.not.be.undefined()
    chai.expect(ucBanner.isClickable()).to.equal(true)
  })

  it('should have the current version of the Usercentrics integration running', () => {
    const integrationVersion = browser.execute(() => {
      return window.tealiumCmpIntegration && window.tealiumCmpIntegration.version
    })
    // node.js context - client and console are available
    chai.expect(integrationVersion).to.equal(helper.currentVersion)
  })
})

describe('STEP 2 - deny tracking', () => {
  it('should deny tracking', () => {
    const ucRoot = $(helper.selectors.ucShadow)
    const denyButton = ucRoot.shadow$(helper.selectors.denyAllButton)
    denyButton.click()
    browser.waitForTraffic() // wait for any network calls
  })

  it('should NOT have a visible Usercentrics banner anymore', () => {
    reporterHelper.takeScreenshot('After decision.')
    const ucBanner = $(helper.selectors.ucShadow).shadow$(helper.selectors.usercentricsBanner)
    chai.expect(ucBanner).to.be.an('object').with.property('isDisplayed').that.is.a('function')
    chai.expect(ucBanner.isDisplayed()).to.equal(false)
  })
})

describe('STEP 3 - fire virtual page view to tag 10 only by clicking button', () => {
  it('should click the button to fire tracking', () => {
    const button = $(helper.selectors.specificViewButton10)
    button.click()
    browser.waitForTraffic() // wait for any network calls
  })
})

describe('STEP 4 - fire virtual page view by clicking button', () => {
  it('should click the button to fire tracking', () => {
    const button = $(helper.selectors.standardViewButton)
    button.click()
    browser.waitForTraffic() // wait for any network calls
  })
})

describe('STEP 5 - fire virtual page view to tag 11 only', () => {
  it('should fire the virtual view to tag 11', () => {
    const button = $(helper.selectors.specificViewButton11)
    button.click()
    browser.waitForTraffic() // wait for any network calls
  })
})

describe('STEP 6 - fire virtual page view to tags 7 and 11 only', () => {
  it('should fire the virtual view to tags 7 and 11 only', () => {
    const button = $(helper.selectors.specificViewButton7and11)
    button.click()
    browser.waitForTraffic() // wait for any network calls
  })
})

describe('FINALIZE - get Proxy logs to confirm tag firings', () => {
  it('finish the run and get the logs', () => {
    const proxyEndAndFetch = proxyHelper.endJourneyAndGetLogs(opJourneyId, opRunId)
      .then(function (output) {
        proxyOutput = output
      })
      .catch((e) => {
        console.log('Proxy error: ' + e)
        throw e
      })
    return proxyEndAndFetch
  })

  it('basic log validation', () => {
    chai.expect(proxyOutput.tags).to.be.an('object')
    chai.expect(proxyOutput.logs).to.be.an('object')
  })

  it('verify step creation in LiveConnect', () => {
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step1')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step2')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step3')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step4')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step5')
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step6')
  })

  it('should generate the filtered logs', () => {
    firedTagLogs = proxyOutput.getFilteredLogs(helper.testTagUrl)
    reporterHelper.logMessage(JSON.stringify(firedTagLogs, null, 2))
    chai.expect(firedTagLogs).to.be.an('object')
  })
})

describe('VERIFY - check the network logs to make sure the correct tags fired for each step', () => {
  it('basic log validation', () => {
    chai.expect(proxyOutput.tags).to.be.an('object')
    chai.expect(proxyOutput.logs).to.be.an('object')
  })

  it('Step 1 should have fired tags 7 and 9 based on IMPLICIT consent', () => {
    reporterHelper.logMessage('Those tags are categorized as Mouseflow, which is set up to fire by default (with implicit consent).')
    chai.expect(firedTagLogs.step1).to.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step1).to.include.something.like(helper.getTestTagObject(9))
  })

  it('Step 1 should NOT have fired tags 6, 8 or 10 based on IMPLICIT consent', () => {
    reporterHelper.logMessage('Those are categorized as Google Analytics, which is set up to require explicit consent.')
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step1).to.not.include.something.like(helper.getTestTagObject(10))
  })

  it('Step 2 should not have refired tags 7 and 9 based on EXPLICIT consent (or fired any other tags)', () => {
    reporterHelper.logMessage('Since it was an opt-out decision, no tags should fire on decision')
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(9))
    chai.expect(firedTagLogs.step2).to.not.include.something.like(helper.getTestTagObject(10))
  })

  it('Step 3 should NOT have fired tags 7 or 9 (even with implicit consent) because the virtual view was tag-specific (only 10 should fire)', () => {
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step3).to.not.include.something.like(helper.getTestTagObject(9))
  })

  it('Step 4 should only fire tags 7 or 9 based on EXPLICIT consent', () => {
    reporterHelper.logMessage('No option to opt out of these tags')
    chai.expect(firedTagLogs.step4).to.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step4).to.include.something.like(helper.getTestTagObject(9))
  })

  it('Step 4 should have NOT fired tags 6, 8, or 10 based on EXPLICIT consent', () => {
    reporterHelper.logMessage('Since consent was denied for \'Google Analytics\', these tags should not have fired at any point.')
    chai.expect(firedTagLogs.step4).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step4).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step4).to.not.include.something.like(helper.getTestTagObject(10))
  })

  it('Step 5 should not fire any tags', () => {
    reporterHelper.logMessage('The virtual view was specific to tag 11, which has no entry in Usercentrics and should never fire.')
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(6))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(7))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(8))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(9))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(10))
    chai.expect(firedTagLogs.step5).to.not.include.something.like(helper.getTestTagObject(11))
  })

  it('Step 6 should have ONLY fired tag 7 based on EXPLICIT consent', () => {
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

  it('Tag 6 should NOT have fired at any point in this test', () => {
    reporterHelper.logMessage('Tag 6 was opted out (\'Google Analytics\'), so it shouldn\'t fire at all.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(6))
  })

  it('Tag 8 should NOT have fired at any point in this test', () => {
    reporterHelper.logMessage('Tag 8 was opted out (\'Google Analytics\'), so it shouldn\'t fire at all.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(8))
  })

  it('Tag 10 should NOT have fired at any point in this test', () => {
    reporterHelper.logMessage('Tag 10 was opted out (\'Google Analytics\'), so it shouldn\'t fire at all.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(10))
  })

  it('Tag 11 should NOT have fired at any point in this test', () => {
    reporterHelper.logMessage('Tag 11 is misconfigured, as \'Another Tag\', which isn\'t a configured Service in Usercentrics')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(11))
  })

  it('Tag 15 should NOT have fired at any point in this test', () => {
    reporterHelper.logMessage('Tag 15 is not configured in the mapping, so it should never fire')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(15))
  })
})
