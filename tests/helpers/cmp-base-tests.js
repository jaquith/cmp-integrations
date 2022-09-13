/* global describe it */

'use strict'

const chai = require('chai')
chai.use(require('chai-like'))
chai.use(require('dirty-chai')) // appease the linter
chai.use(require('deep-equal-in-any-order'))

const stringFunctions = require('../helpers/stringFunctions.js')

const expectedFunctions = ['cmpFetchCurrentConsentDecision', 'cmpFetchCurrentLookupKey', 'cmpCheckIfOptInModel', 'cmpCheckForWellFormedDecision', 'cmpCheckForExplicitConsentDecision', 'cmpCheckForTiqConsent', 'cmpConvertResponseToGroupList']

exports.getCmpTestSuite = function (code, cmpHelper, expectOptInModel) {
  return function () {
    describe('no CMP / not loaded', basicTests(code, {
      isExplicit: false,
      expectedSettingLookupKey: false,
      expectOptInModel: true,
      isWellFormed: false,
      hasTiqConsent: false,
      rawDecision: false,
      expectedGroups: [],
      windowSpoof: {},
      tiqGroupName: cmpHelper.tiqGroupName
    }))

    describe('implicit case', basicTests(code, {
      isExplicit: false,
      expectedSettingLookupKey: cmpHelper.expectedSettingLookupKey,
      expectOptInModel: expectOptInModel,
      isWellFormed: true,
      hasTiqConsent: true,
      rawDecision: cmpHelper.implicitRaw,
      expectedGroups: cmpHelper.expectedImplicitList,
      windowSpoof: cmpHelper.getWindowSpoof(cmpHelper.implicitRaw, expectOptInModel),
      tiqGroupName: cmpHelper.tiqGroupName
    }))

    describe('explicit opt-in case', basicTests(code, {
      isExplicit: true,
      expectedSettingLookupKey: cmpHelper.expectedSettingLookupKey,
      expectOptInModel: expectOptInModel,
      isWellFormed: true,
      hasTiqConsent: true,
      rawDecision: cmpHelper.explicitOptInRaw,
      expectedGroups: cmpHelper.expectedExplicitOptInList,
      windowSpoof: cmpHelper.getWindowSpoof(cmpHelper.explicitOptInRaw, expectOptInModel),
      tiqGroupName: cmpHelper.tiqGroupName
    }))

    describe('explicit opt-out case', basicTests(code, {
      isExplicit: true,
      expectedSettingLookupKey: cmpHelper.expectedSettingLookupKey,
      expectOptInModel: expectOptInModel,
      isWellFormed: true,
      hasTiqConsent: true,
      rawDecision: cmpHelper.explicitOptOutRaw,
      expectedGroups: cmpHelper.expectedExplicitOptOutList,
      windowSpoof: cmpHelper.getWindowSpoof(cmpHelper.explicitOptOutRaw, expectOptInModel),
      tiqGroupName: cmpHelper.tiqGroupName
    }))
  }
}

function basicTests (code, settings) {
  let cmpSettings
  settings = settings || {}
  settings.decisionFunctionPath = (typeof settings.decisionFunctionPath === 'string' && settings.decisionFunctionPath) || ''

  const windowSpoof = settings.windowSpoof || {}

  return function () {
    it('should export without error', function () {
      const before = 'function getWindowObject (window) {\nvar window = window || {}\n'
      const after = 'return window\n}'

      const exported = stringFunctions.exportNamedElements(code, ['getWindowObject'], before, after)

      chai.expect(exported).to.be.an('object').with.key('getWindowObject')
      const output = exported.getWindowObject(windowSpoof)
      cmpSettings = output.tealiumCmpIntegration
    })

    it('should have all the expected helper functions', function () {
      expectedFunctions.forEach((name) => {
        chai.expect(cmpSettings, 'window.tealiumCmpIntegration').to.be.an('object')
        chai.expect(cmpSettings, name).to.have.property(name).that.is.a('function')
      })
    })

    it('should have a name', function () {
      chai.expect(cmpSettings).to.be.an('object')
      chai.expect(cmpSettings).to.have.property('cmpName').that.is.a('string')
    })

    it('should have a version', function () {
      chai.expect(cmpSettings).to.be.an('object')
      chai.expect(cmpSettings).to.have.property('cmpIntegrationVersion').that.is.a('string')
    })

    it(`cmpFetchCurrentConsentDecision should return ${typeof settings.rawDecision === 'object' ? 'the expected (spoofed) raw response object' : settings.rawDecision}`, function () {
      chai.expect(cmpSettings).to.be.an('object').with.property('cmpFetchCurrentConsentDecision').that.is.a('function')
      chai.expect(cmpSettings.cmpFetchCurrentConsentDecision()).to.deep.equal(settings.rawDecision)
    })

    it(`cmpCheckIfOptInModel should return ${typeof settings.expectOptInModel === 'boolean' ? settings.expectOptInModel : '(missing from CMP test config)'}`, function () {
      chai.expect(cmpSettings.cmpCheckIfOptInModel()).to.equal(typeof settings.expectOptInModel === 'boolean' ? settings.expectOptInModel : '(missing from CMP test config)')
    })

    it(`cmpFetchCurrentLookupKey should return ${settings.expectedSettingLookupKey ? settings.expectedSettingLookupKey : 'an empty string'}`, function () {
      chai.expect(cmpSettings.cmpFetchCurrentLookupKey()).to.equal(settings.expectedSettingLookupKey ? settings.expectedSettingLookupKey : '')
    })

    it(`cmpCheckForWellFormedDecision should be ${settings.isWellFormed}`, function () {
      chai.expect(cmpSettings.cmpCheckForWellFormedDecision(settings.rawDecision)).to.equal(settings.isWellFormed)
    })

    it(`cmpCheckForExplicitConsentDecision should be ${settings.isExplicit}`, function () {
      chai.expect(cmpSettings.cmpCheckForExplicitConsentDecision(settings.rawDecision)).to.equal(settings.isExplicit)
    })

    it(`cmpCheckForTiqConsent should be ${settings.hasTiqConsent}`, function () {
      chai.expect(cmpSettings.cmpCheckForTiqConsent(settings.rawDecision, settings.tiqGroupName)).to.equal(settings.hasTiqConsent)
    })

    it(`cmpConvertResponseToGroupList should return the expected consented purpose list with ${settings.expectedGroups && settings.expectedGroups.length} members`, function () {
      chai.expect(settings.expectedGroups.length).to.be.a('number')
      chai.expect(cmpSettings.cmpConvertResponseToGroupList(settings.rawDecision)).to.deep.equalInAnyOrder(settings.expectedGroups)
    })
  }
}
