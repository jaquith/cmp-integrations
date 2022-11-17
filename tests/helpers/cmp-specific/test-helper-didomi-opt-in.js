exports.implicitRaw = {
  purposes: {
    enabled: [
      'usodecoo-qidXjmq8'
    ],
    disabled: []
  },
  vendors: {
    enabled: [],
    disabled: []
  }
}

exports.explicitOptInRaw = {
  purposes: {
    enabled: [
      'analytics-HpBJrrK7',
      'cookies',
      'select_basic_ads',
      'create_ads_profile',
      'select_personalized_ads',
      'measure_ad_performance',
      'improve_products',
      'geolocation_data',
      'create_content_profile',
      'select_personalized_content',
      'market_research',
      'measure_content_performance',
      'usodecoo-qidXjmq8'
    ],
    disabled: []
  },
  vendors: {
    enabled: [
      91,
      16,
      45,
      'google',
      'facebook',
      'c:linkedin-marketing-solutions',
      'c:mixpanel',
      'c:abtasty-LLkECCj8',
      'c:hotjar',
      'c:yandexmetrics',
      'c:beamer-H7tr7Hix',
      'c:appsflyer-GUVPLpYY',
      'c:tealiumco-DVDCd8ZP',
      'c:idealista-LztBeqE3',
      'c:idealista-feREje2c'
    ],
    disabled: []
  }
}

exports.explicitOptOutRaw = {
  purposes: {
    enabled: [
      'usodecoo-qidXjmq8'
    ],
    disabled: [
      'cookies',
      'select_basic_ads',
      'create_ads_profile',
      'select_personalized_ads',
      'measure_ad_performance',
      'improve_products',
      'geolocation_data',
      'create_content_profile',
      'select_personalized_content',
      'market_research',
      'measure_content_performance',
      'analytics-HpBJrrK7'
    ]
  },
  vendors: {
    enabled: [],
    disabled: [
      91,
      16,
      45,
      'google',
      'facebook',
      'c:linkedin-marketing-solutions',
      'c:mixpanel',
      'c:abtasty-LLkECCj8',
      'c:hotjar',
      'c:yandexmetrics',
      'c:beamer-H7tr7Hix',
      'c:appsflyer-GUVPLpYY',
      'c:tealiumco-DVDCd8ZP',
      'c:idealista-LztBeqE3',
      'c:idealista-feREje2c'
    ]
  }
}

var implicitList = ['Strictly Necessary Cookies']
exports.expectedImplicitList = implicitList

exports.tiqGroupName = 'Strictly Necessary Cookies'

exports.expectedExplicitOptInList = ['Strictly Necessary Cookies', 'Analytics Cookies', 'Functional Cookies', 'Targeting Cookies']

exports.expectedExplicitOptOutList = implicitList // expected to be the same for GDPR cases

exports.expectedSettingLookupKey = 'fff8df06-1dd2-491b-88f6-01cae248cd17'

exports.expectOptInModel = true

exports.getWindowSpoof = function (rawDecision) {
  return {
    Didomi: {
      GetDomainData: function () {
        return rawDecision
      }
    }
  }
}
