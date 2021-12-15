// Declare global variables for Standard JS (linter)
/* global describe, it */
'use strict'

const chai = require('chai')
chai.use(require('chai-like'))
chai.use(require('dirty-chai')) // appease the linter
chai.use(require('deep-equal-in-any-order'))

const stringFunctions = require('../helpers/stringFunctions.js')
const code = stringFunctions.getVanillaJsFile('extensions/extension-2-cmp-variants/extension-2-usercentrics-v2.js')

// to share among tests
let exported
let cmpSettings

const expectedFunctions = ['cmpFetchCurrentConsentDecision', 'cmpFetchCurrentLookupKey', 'cmpCheckForWellFormedDecision', 'cmpCheckForExplicitConsentDecision', 'cmpCheckForTiqConsent', 'cmpConvertResponseToGroupList']

describe('the usercentrics-v2 integration', function () {
  it('should export without error', function () {
    const before = 'function getWindowObject () {var window = {}\n'
    const after = 'return window\n}'
    exported = stringFunctions.exportNamedElements(code, ['getWindowObject'], before, after)
    chai.expect(exported).to.be.an('object').with.key('getWindowObject')
  })

  it('should have all the expected helper functions', function () {
    chai.expect(exported).to.be.an('object').with.key('getWindowObject')
    const output = exported.getWindowObject()
    cmpSettings = output.tealiumCmpIntegration
    chai.expect(output).to.be.an('object')
    expectedFunctions.forEach((name) => {
      chai.expect(cmpSettings, 'window.tealiumCmpIntegration').to.be.an('object')
      chai.expect(cmpSettings, name).to.have.property(name).that.is.a('function')
    })
  })

  describe('the cmpFetchCurrentConsentDecision function', function () {
    it.skip('should do all the right stuff', function () {
      chai.expect(cmpSettings).to.be.an('object').with.property('cmpFetchCurrentConsentDecision').that.is.a('function')
    })
  })
})
