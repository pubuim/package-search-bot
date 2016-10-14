'use strict'

const fetch = require('node-fetch')
const Promise = require('bluebird')
const is = require('is')
const encodeString = require('./encode-string')

const npmUrl = 'http://npmsearch.com/query?fields=name,description,version,readme&q='

function formatDescription (item) {
  let desc = ''

  if (item.description[0]) {
    desc = `${desc}${item.description[0]}`
  }

  if (item.readme[0]) {
    desc = `${desc}\n${item.readme[0]}`
  }

  return desc
}

module.exports = {
  search: Promise.coroutine(function* (keywords, from) {
    if (is.string(keywords)) {
      keywords = [keywords]
    }

    const keyword = keywords.map(encodeString).join('+')

    let url = `${npmUrl}${keyword}`

    if (is.integer(from)) {
      url = `${url}&from=${from}`
    }

    const result = yield fetch(url)

    if (result.status !== 200) {
      throw new Error('npm search failed')
    }

    const data = yield result.json()

    const ret = {
      items: data.results.map(item => {
        const name = item.name[0]

        return {
          title: `${name} @ ${item.version[0]}`,
          description: formatDescription(item),
          url: `https://www.npmjs.com/package/${name}`
        }
      }),
      total: data.total
    }

    if (data.from < data.total) {
      ret.nextPage = data.from + 10
    }

    return ret
  })
}
