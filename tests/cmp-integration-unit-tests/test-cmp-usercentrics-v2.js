/* global describe */
'use strict'
const stringFunctions = require('../helpers/stringFunctions.js')
const tests = require('../helpers/cmp-base-tests')

const cmpHelper = require('../helpers/cmp-specific/test-helper-usercentrics-v2.js')
const code = stringFunctions.getVanillaJsFile('extensions/extension-2-cmp-variants/extension-2-usercentrics-v2.js')

describe('the Usercentrics V2 integration', tests.getCmpTestSuite(code, cmpHelper))
