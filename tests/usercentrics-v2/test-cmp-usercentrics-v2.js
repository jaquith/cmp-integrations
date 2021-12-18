// Declare global variables for Standard JS (linter)
/* global describe */
'use strict'

const chai = require('chai')
chai.use(require('chai-like'))
chai.use(require('dirty-chai')) // appease the linter
chai.use(require('deep-equal-in-any-order'))

const tests = require('../helpers/cmp-base-tests')

const cmpHelper = require('../helpers/cmp-specific/test-helper-usercentrics-v2.js')

describe('the usercentrics-v2 integration', function () {
  describe('implicit case', tests.basicTests({
    isExplicit: false,
    rawDecision: cmpHelper.implicitResponse,
    expectedGroups: cmpHelper.expectedImplicitList,
    decisionFunctionPath: 'window.UC_UI.getServicesBaseInfo'
  }))

  describe('explicit opt-in case', tests.basicTests({
    isExplicit: true,
    rawDecision: cmpHelper.explicitOptIn,
    expectedGroups: cmpHelper.expectedExplicitOptInList,
    decisionFunctionPath: 'window.UC_UI.getServicesBaseInfo'
  }))

  describe('explicit opt-out case', tests.basicTests({
    isExplicit: true,
    rawDecision: cmpHelper.explicitOptOut,
    expectedGroups: cmpHelper.expectedImplicitList, // not a typo, these should always be the same
    decisionFunctionPath: 'window.UC_UI.getServicesBaseInfo'
  }))
})
