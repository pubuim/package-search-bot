'use strict'

global.Promise = require('bluebird')

const koa = require('koa')
const router = require('./routes')
const body = require('koa-better-body')

const app = koa()

app
  .use(body())
  .use(router.routes())
  .use(router.allowedMethods())

module.exports = app
