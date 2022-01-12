/* global describe */
'use strict'
const stringFunctions = require('../helpers/stringFunctions.js')
const tests = require('../helpers/cmp-base-tests')

const cmpHelperOptIn = require('../helpers/cmp-specific/test-helper-usercentrics-opt-in.js')
const cmpHelperOptOut = require('../helpers/cmp-specific/test-helper-usercentrics-opt-out.js')

const code = stringFunctions.getVanillaJsFile('extensions/extension-2-cmp-variants/extension-2-usercentrics.js')

describe('Usercentrics V2 Integration', function () {
  describe('Opt-in Model tests', tests.getCmpTestSuite(code, cmpHelperOptIn, true))
  // haven't added this support yet - opt-in model covers this case as well, but is wasteful (unneeded polling)
  describe.skip('Opt-out Model tests', tests.getCmpTestSuite(code, cmpHelperOptOut, false))
})
