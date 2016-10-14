'use strict'

const router = require('koa-router')()
const npmSearch = require('../libs/npm-search')
const githubSearch = require('../libs/github-search')
const is = require('is')
const config = require('config')
const Promise = require('bluebird')

const searchCallback = `${config.host}/search`

const handles = {
  npm: npmSearch,
  github: githubSearch
}

const search = Promise.coroutine(function* (type, q, page) {
  const handle = handles[type]
  const result = yield handle.search(q, page)

  const ret = {
    text: `找到了 ${result.items.length} 个结果`,
    attachments: result.items
  }

  if (result.nextPage) {
    ret.buttons = [
      {
        text: '下一页',
        action: JSON.stringify({
          type, q, nextPage: result.nextPage
        }),
        callbackUrl: searchCallback
      }
    ]
  }

  return ret
})

router.post('/start', function* (next) {
  const body = this.request.fields
  let text = body.text

  if (is.string(body.trigger_word)) {
    text = text.replace(body.trigger_word, '')
  }

  text = text.trim()

  const match = text.match(/^(npm|github) ([\s\S]+)/i)

  if (match) {
    this.body = yield search(match[1].toLowerCase(), match[2])
    return yield next
  }

  this.body = {
    text: `请问要在哪里搜索 \`${text}\``,
    buttons: [
      {
        text: 'npm',
        action: JSON.stringify({ type: 'npm', q: text }),
        callbackUrl: searchCallback
      },
      {
        text: 'GitHub',
        action: JSON.stringify({ type: 'github', q: text }),
        callbackUrl: searchCallback
      }
    ]
  }

  yield next
})

router.post('/search', function* (next) {
  const body = this.request.fields

  const action = JSON.parse(body.action)

  this.body = yield search(action.type, action.q, action.nextPage)

  yield next
})

module.exports = router
