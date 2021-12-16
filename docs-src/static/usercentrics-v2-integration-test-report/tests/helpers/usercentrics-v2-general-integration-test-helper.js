
'use strict'

// const environmentQueryParam = 'tealium_environment=qa'

const environmentQueryParam = ''

module.exports.currentVersion = 'v1.0.0-alpha-1'

// const environmentQueryParam = 'tealium_environment=qa'

module.exports.standardTestPage = addEnvironmentSwitch('https://solutions.tealium.net/hosted/usercentrics-v2/test-page-standard.html', environmentQueryParam)
module.exports.noviewTestPage = addEnvironmentSwitch('https://solutions.tealium.net/hosted/usercentrics-v2/test-page-noview.html', environmentQueryParam)
module.exports.nocookieTestPage = addEnvironmentSwitch('https://solutions.tealium.net/hosted/usercentrics-v2/test-page-nocookie.html', environmentQueryParam)
module.exports.standardNoMapTestPage = addEnvironmentSwitch('https://solutions.tealium.net/hosted/usercentrics-v2/test-page-standard-no-map.html', environmentQueryParam)
module.exports.standardNoUtagEditTestPage = addEnvironmentSwitch('https://solutions.tealium.net/hosted/usercentrics-v2/test-page-standard-no-utag-edit.html', environmentQueryParam)
module.exports.standardNoUsercentricsTestPage = addEnvironmentSwitch('https://solutions.tealium.net/hosted/usercentrics-v2/test-page-standard-no-usercentrics.html', environmentQueryParam)
module.exports.noviewNoUtagEditTestPage = addEnvironmentSwitch('https://solutions.tealium.net/hosted/usercentrics-v2/test-page-noview-no-utag-edit.html', environmentQueryParam)
module.exports.datalayerListenerTestPage = addEnvironmentSwitch('https://solutions.tealium.net/hosted/usercentrics-v2/test-page-datalayer-listener.html', environmentQueryParam)

function addEnvironmentSwitch (url, environmentString) {
  if (typeof url !== 'string' || url === '') {
    return url
  }
  if (typeof environmentString === 'string' && environmentString !== '') {
    if (url.indexOf('?') === -1) url = url + '?'
    return url + environmentString
  }
  return url
}

module.exports.tagValidationObjects = {
  initialView: {
    ut_event: 'view',
    page_type: 'usercentrics_test'
  },
  event1: {
    ut_event: 'link',
    event: 'event1',
    event_value: 'eventOne'
  },
  event2: {
    ut_event: 'link',
    event: 'event2',
    event_value: 'eventTwo'
  },
  event3: {
    ut_event: 'link',
    event: 'event3',
    event_value: 'eventThree'
  },
  virtualView: {
    ut_event: 'view',
    page_type: 'test_virtual_view'
  }
}

module.exports.testTagUrl = 'https://solutions.tealium.net/hosted/i.gif'

module.exports.selectors = {
  ucShadow: '#usercentrics-root',
  acceptAllButton: '>>>[data-testid="uc-accept-all-button"]',
  denyAllButton: '>>>[data-testid="uc-deny-all-button"]',
  usercentricsBanner: '>>>[data-testid="uc-default-banner"]',
  standardViewButton: '#standard-virtual-view',
  specificViewButton10: '#specific-virtual-view-10',
  specificViewButton11: '#specific-virtual-view-11',
  specificViewButton7and11: '#specific-virtual-view-7-and-11',
  specificViewButton6and7: '#specific-virtual-view-6-and-7'
}

module.exports.getTestTagObject = (tagUid, extraQueryParams) => {
  if (typeof tagUid === 'number') tagUid = tagUid.toString()
  const qps = {
    taguid: tagUid
  }
  if (typeof extraQueryParams === 'object') {
    const lowercased = {}
    // lowercase the qp keys (but not the values), since mitmproxy records them lowercased
    const keys = Object.keys(extraQueryParams)
    const values = Object.values(extraQueryParams)
    keys.forEach((key, i) => {
      lowercased[key.toLowerCase()] = values[i]
    })
    Object.assign(qps, lowercased)
  }
  return {
    request: {
      urlWithoutQueryString: this.testTagUrl,
      queryString: qps
    },
    response: {
      status: 200
    }
  }
}
