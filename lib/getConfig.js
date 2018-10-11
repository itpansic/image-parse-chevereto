
const configPre = 'image-parse-chevereto.'

module.exports = function getConfig (key) {
  return atom.config.get(configPre + key)
}
