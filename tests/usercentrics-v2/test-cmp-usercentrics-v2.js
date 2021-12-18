// Declare global variables for Standard JS (linter)
/* global describe */
'use strict'

const chai = require('chai')
chai.use(require('chai-like'))
chai.use(require('dirty-chai')) // appease the linter
chai.use(require('deep-equal-in-any-order'))

const tests = require('../helpers/cmp-base-tests')

const cmpHelper = require('../helpers/cmp-specific/test-helper-usercentrics-v2.js')

describe('the Usercentrics V2 integration', tests.getCmpTestSuite(cmpHelper))
