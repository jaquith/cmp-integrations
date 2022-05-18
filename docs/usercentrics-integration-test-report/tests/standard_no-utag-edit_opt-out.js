/* global reporterHelper, rootRequire, $, proxyHelper, describe, it, browser, chai */

const helper = rootRequire('test-helpers/user-helpers/caleb-jaquith/usercentrics-v2-general-integration-test-helper.js');

let proxyOutput;
let firedTagLogs;

describe('STEP 1 - initial visit to test page', function () {
  it('should navigate to the page', async function () {
    await browser.url(helper.standardNoUtagEditTestPage);
    await browser.waitForTraffic();
    await reporterHelper.takeScreenshot('On landing');
  });

  it('should have the correct title', async function () {
    const title = await browser.getTitle();
    chai.expect(title).to.equal('Usercentrics v2 Test');
  });

  it('should NOT have a utag_main cookie', async function () {
    await browser.waitForTraffic();
    const cookie = await browser.getCookieByName('utag_main');
    chai.expect(cookie).to.be.undefined();
  });

  it('should have a visible Usercentrics banner', async function () {
    const ucBanner = await $(helper.selectors.usercentricsBanner);
    chai.expect(ucBanner).to.not.be.undefined();
    chai.expect(await ucBanner.isClickable()).to.equal(true);
  });

  it('should have the current version of the Usercentrics integration running', async function () {
    const integrationVersion = await browser.execute(function () {
      return window.tealiumCmpIntegration && window.tealiumCmpIntegration.version;
    });
    // node.js context - client and console are available
    chai.expect(integrationVersion).to.equal(helper.currentVersion);
  });
});

describe('STEP 2 - deny tracking', function () {
  it('should deny tracking', async function () {
    const denyButton = await $(helper.selectors.denyAllButton);
    await denyButton.click();
    await browser.waitForTraffic(); // wait for any network calls
  });

  it('should NOT have a visible Usercentrics banner anymore', async function () {
    await reporterHelper.takeScreenshot('After decision.');
    const ucBanner = await $(helper.selectors.usercentricsBanner);
    chai.expect(ucBanner).to.be.an('object').with.property('isDisplayed').that.is.a('function');
    chai.expect(await ucBanner.isDisplayed()).to.equal(false);
  });
});

describe('STEP 3 - fire virtual page view by clicking button', function () {
  it('should click the button to fire tracking', async function () {
    const button = await $(helper.selectors.standardViewButton);
    await button.click();
    await browser.waitForTraffic(); // wait for any network calls
  });
});

describe('STEP 4 - fire virtual page view to tag 10 only by clicking button', function () {
  it('should click the button to fire tracking', async function () {
    const button = await $(helper.selectors.specificViewButton10);
    await button.click();
    await browser.waitForTraffic(); // wait for any network calls
  });
});

describe('STEP 5 - fire virtual page view to tag 11 only', function () {
  it('should fire the virtual view to tag 11', async function () {
    const button = await $(helper.selectors.specificViewButton11);
    await button.click();
    await browser.waitForTraffic(); // wait for any network calls
  });
});

describe('STEP 6 - fire virtual page view to tags 7 and 11 only', function () {
  it('should fire the virtual view to tags 7 and 11 only', async function () {
    const button = await $(helper.selectors.specificViewButton7and11);
    await button.click();
    await browser.waitForTraffic(); // wait for any network calls
  });
});

describe('FINALIZE - get Proxy logs to confirm tag firings', function () {
  it('finish the run and get the logs', async function () {
    proxyOutput = await proxyHelper.getLogs();
  });

  it('should verify step creation', async function () {
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step1').that.is.an('array');
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step2').that.is.an('array');
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step3').that.is.an('array');
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step4').that.is.an('array');
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step5').that.is.an('array');
    chai.expect(proxyOutput.logs).to.be.an('object').with.property('step6').that.is.an('array');
  });

  it('should generate the filtered logs', async function () {
    firedTagLogs = proxyOutput.getFilteredLogs(helper.testTagUrl);
    reporterHelper.logMessage(JSON.stringify(firedTagLogs, null, 2));
    chai.expect(firedTagLogs).to.be.an('object');
  });
});

describe('VERIFY - check the network logs to make sure no tags fired at any point in this test.', function () {
  it('basic log validation', async function () {
    chai.expect(firedTagLogs).to.be.an('object');
  });

  it('Tag 6 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Missing map should mean that no tags fire, no matter what.');
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(6));
  });

  it('Tag 7 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Missing map should mean that no tags fire, no matter what.');
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(7));
  });

  it('Tag 8 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Missing map should mean that no tags fire, no matter what.');
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(8));
  });

  it('Tag 9 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Missing map should mean that no tags fire, no matter what.');
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(9));
  });

  it('Tag 10 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Missing map should mean that no tags fire, no matter what.');
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(10));
  });

  it('Tag 11 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Missing map should mean that no tags fire, no matter what.');
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(11));
  });

  it('Tag 15 should NOT have fired at any point in this test', async function () {
    reporterHelper.logMessage('Tag 15 is not configured in the mapping, so it should never fire');
    chai.expect(firedTagLogs.allSteps).to.not.include.something.like(helper.getTestTagObject(15));
  });
});
