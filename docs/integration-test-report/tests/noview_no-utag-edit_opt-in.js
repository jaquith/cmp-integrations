/* global reporterHelper, rootRequire, $, proxyHelper, opJourneyId, opRunId, describe, it, browser, chai */

const helper = rootRequire('helpers/specific/usercentrics-v2-general-integration-test-helper.js')

let proxyOutput
let firedTagLogs

describe('STEP 1 - initial visit to test page', () => {
  it('should navigate to the page', () => {
    browser.url(helper.noviewNoUtagEditTestPage)
    browser.waitForTraffic()
    reporterHelper.takeScreenshot('On landing')
  })

  it('should have the correct title', () => {
    const title = browser.getTitle()
    chai.expect(title).to.equal('Usercentrics v2 Test')
  })

  it('should have a utag_main cookie', () => {
    browser.waitForTraffic()
    reporterHelper.logMessage('TiQ will run because we can\'t detect the edit before load, but no tags should be fired.')
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

describe('STEP 2 - accept all tracking', () => {
  it('should accept tracking', () => {
    const acceptButton = $(helper.selectors.ucShadow).shadow$(helper.selectors.acceptAllButton)
    acceptButton.click()
    browser.waitForTraffic() // wait for any network calls
  })

  it('should NOT have a visible Usercentrics banner anymore', () => {
    reporterHelper.takeScreenshot('After decision.')
    const ucBanner = $(helper.selectors.ucShadow).shadow$(helper.selectors.usercentricsBanner)
    chai.expect(ucBanner).to.be.an('object').with.property('isDisplayed').that.is.a('function')
    chai.expect(ucBanner.isDisplayed()).to.equal(false)
  })
})

describe('STEP 3 - fire virtual page view by clicking button', () => {
  it('should click the button to fire tracking', () => {
    const button = $(helper.selectors.standardViewButton)
    button.click()
    browser.waitForTraffic() // wait for any network calls
  })
})

describe('STEP 4 - fire virtual page view to tag 10 only by clicking button', () => {
  it('should click the button to fire tracking', () => {
    const button = $(helper.selectors.specificViewButton10)
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

  it('should verify step creation in LiveConnect', () => {
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

describe('VERIFY - check the network logs to make sure no tags fired at any point in this test.', () => {
  it('basic log validation', () => {
    chai.expect(proxyOutput.tags).to.be.an('object')
    chai.expect(proxyOutput.logs).to.be.an('object')
  })

  it('Tag 6 should NOT have fired at any point in this test', () => {
    reporterHelper.logMessage('Missing map should mean that no tags fire, no matter what.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(6))
  })

  it('Tag 7 should NOT have fired at any point in this test', () => {
    reporterHelper.logMessage('Missing map should mean that no tags fire, no matter what.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(7))
  })

  it('Tag 8 should NOT have fired at any point in this test', () => {
    reporterHelper.logMessage('Missing map should mean that no tags fire, no matter what.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(8))
  })

  it('Tag 9 should NOT have fired at any point in this test', () => {
    reporterHelper.logMessage('Missing map should mean that no tags fire, no matter what.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(9))
  })

  it('Tag 10 should NOT have fired at any point in this test', () => {
    reporterHelper.logMessage('Missing map should mean that no tags fire, no matter what.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(10))
  })

  it('Tag 11 should NOT have fired at any point in this test', () => {
    reporterHelper.logMessage('Missing map should mean that no tags fire, no matter what.')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(11))
  })

  it('Tag 15 should NOT have fired at any point in this test', () => {
    reporterHelper.logMessage('Tag 15 is not configured in the mapping, so it should never fire')
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(15))
  })
})
