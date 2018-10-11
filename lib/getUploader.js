
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
            resolve('https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1539257107907&di=07f611bb4556e0e593d0a745c09d76ae&imgtype=0&src=http%3A%2F%2F09imgmini.eastday.com%2Fmobile%2F20180916%2F20180916053239_d41d8cd98f00b204e9800998ecf8427e_3.jpeg')
            //reject(new Error('upload error'))
        })
    }
}
