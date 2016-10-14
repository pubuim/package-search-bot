'use strict'

module.exports = function encodeString (str) {
  let strs = str.split(/ +/)

  if (strs.length === 1) {
    return encodeURIComponent(strs[0])
  }

  return strs.map(encodeString).join('+').trim()
}
