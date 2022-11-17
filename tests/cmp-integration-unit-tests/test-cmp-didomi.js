/* global describe */
'use strict'
const stringFunctions = require('../helpers/stringFunctions.js')
const tests = require('../helpers/cmp-base-tests')

const cmpHelperOptIn = require('../helpers/cmp-specific/test-helper-didomi-opt-in.js')
const cmpHelperOptOut = require('../helpers/cmp-specific/test-helper-didomi-opt-out.js')

const code = stringFunctions.getVanillaJsFile('extensions/extension-2-cmp-variants/extension-2-didomi.js')

describe('Didomi Integration', function () {
  // need to restructure these tests some or something, it's not quite built for the way Didomi is written
  describe.skip('Opt-in Model tests', tests.getCmpTestSuite(code, cmpHelperOptIn, true))
  describe.skip('Opt-out Model tests', tests.getCmpTestSuite(code, cmpHelperOptOut, false))
})
