/* global it */

'use strict'

const chai = require('chai')
chai.use(require('chai-like'))
chai.use(require('dirty-chai')) // appease the linter
chai.use(require('deep-equal-in-any-order'))

const stringFunctions = require('../helpers/stringFunctions.js')
const code = stringFunctions.getVanillaJsFile('extensions/extension-2-cmp-variants/extension-2-usercentrics-v2.js')

const expectedFunctions = ['cmpFetchCurrentConsentDecision', 'cmpFetchCurrentLookupKey', 'cmpCheckForWellFormedDecision', 'cmpCheckForExplicitConsentDecision', 'cmpCheckForTiqConsent', 'cmpConvertResponseToGroupList']

exports.basicTests = function (settings) {
  let cmpSettings
  settings = settings || {}
  settings.decisionFunctionPath = (typeof settings.decisionFunctionPath === 'string' && settings.decisionFunctionPath) || ''

  const windowSpoof = {}
  let parent = windowSpoof
  settings.decisionFunctionPath.split('.').forEach(function (child, i, arr) {
    if (child === 'window' || child === 'self') return // skip top-level references
    if (i === arr.length - 1) {
      // the end, define the spoofed function
      parent[child] = function () {
        return settings.rawDecision || 'missing - issue with spoofed function in test'
      }
      return
    }
    // not the end yet, keep making parents
    parent[child] = {}
    parent = parent[child]
  })

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

    it('cmpFetchCurrentConsentDecision should return the raw response', function () {
      chai.expect(cmpSettings).to.be.an('object').with.property('cmpFetchCurrentConsentDecision').that.is.a('function')
      chai.expect(cmpSettings.cmpFetchCurrentConsentDecision()).to.deep.equal(settings.rawDecision)
    })

    it('cmpCheckForWellFormedDecision should be true', function () {
      chai.expect(cmpSettings.cmpCheckForWellFormedDecision(settings.rawDecision)).to.equal(true)
    })

    it('cmpCheckForExplicitConsentDecision should be true', function () {
      chai.expect(cmpSettings.cmpCheckForExplicitConsentDecision(settings.rawDecision)).to.equal(settings.isExplicit)
    })

    it('cmpCheckForTiqConsent should be true', function () {
      chai.expect(cmpSettings.cmpCheckForTiqConsent(settings.rawDecision)).to.equal(true)
    })

    it('cmpConvertResponseToGroupList should return the correct group list', function () {
      chai.expect(cmpSettings.cmpConvertResponseToGroupList(settings.rawDecision)).to.deep.equalInAnyOrder(settings.expectedGroups)
    })
  }
}
