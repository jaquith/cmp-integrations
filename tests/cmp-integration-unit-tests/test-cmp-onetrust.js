/* global describe */
'use strict'
const stringFunctions = require('../helpers/stringFunctions.js')
const tests = require('../helpers/cmp-base-tests')

const cmpHelper = require('../helpers/cmp-specific/test-helper-onetrust.js')
const code = stringFunctions.getVanillaJsFile('extensions/extension-2-cmp-variants/extension-2-onetrust.js')

describe('the OneTrust integration', tests.getCmpTestSuite(code, cmpHelper))
