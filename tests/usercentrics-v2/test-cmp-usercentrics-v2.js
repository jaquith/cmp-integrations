/* global describe */
'use strict'

const tests = require('../helpers/cmp-base-tests')
const cmpHelper = require('../helpers/cmp-specific/test-helper-usercentrics-v2.js')

describe('the Usercentrics V2 integration', tests.getCmpTestSuite(cmpHelper))
