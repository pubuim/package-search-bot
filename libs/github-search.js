'use strict'

const fetch = require('node-fetch')
const Promise = require('bluebird')
const is = require('is')
const encodeString = require('./encode-string')

const perPage = 15
const githubUrl = `https://api.github.com/search/repositories?per_page=${perPage}&sort=stars&q=`

function formatDescription (item) {
  let desc = ''

  if (is.string(item.description)) {
    desc = `${desc}${item.description}`
  }

  return desc
}

module.exports = {
  search: Promise.coroutine(function* (keywords, page) {
    if (is.string(keywords)) {
      keywords = [keywords]
    }

    const keyword = keywords.map(encodeString).join('+')
    let url = `${githubUrl}${keyword}`

    if (is.integer(page)) {
      url = `${url}&page=${page}`
    } else {
      page = 1
    }

    const result = yield fetch(url)

    if (result.status !== 200) {
      throw new Error('github search failed')
    }

    const data = yield result.json()

    const ret = {
      items: data.items.map(item => {
        const name = `${item.full_name} &#9733; ${item.stargazers_count}`

        return {
          title: name,
          description: formatDescription(item),
          url: item.html_url
        }
      }),
      total: data.total_count
    }

    if (
      ret.total > perPage &&
      perPage * (page - 1) + ret.items.length < ret.total
    ) {
      ret.nextPage = page + 1
    }

    return ret
  })
}
