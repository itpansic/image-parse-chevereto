/*
const getConfig = require('./getConfig')
module.exports = function() {

    let cheveretoApi = getConfig("cheveretoApi")
    let cheveretoApiKey = getConfig("cheveretoApiKey")
    console.log('cheveretoApi: %o',cheveretoApi)
    console.log('cheveretoApiKey: %o',cheveretoApiKey)
    if (!cheveretoApi || !cheveretoApi) {
        atom.notifications.addWarning('can not found cheveretoApi or cheveretoApiKey', {
            dismissable: true
        })
        return false
    }

    return ({
        path
    }) => {
        return new Promise((resolve, reject) => {
            resolve('success')
            reject(new Error('upload error'))
        })
    }
}
*/
