const getConfig = require('./getConfig')
module.exports = function() {

    let cheveretoApi = getConfig("cheveretoApi")
    let cheveretoApiKey = getConfig("cheveretoApiKey")
    let cheveretoImageSize = getConfig("cheveretoImageSize")

    if (!cheveretoApi || !cheveretoApi || !cheveretoImageSize) {
        atom.notifications.addWarning('can not found cheveretoApi or cheveretoApiKey or cheveretoImageSize', {
            dismissable: true
        })
        return false
    }

    return ({
        path
    }) => {
        return new Promise((resolve, reject) => {

            var request = require('request');
            var formData = {
                key: cheveretoApiKey,
                format: 'json',
                source: fs.createReadStream(path)
            };

            function callback(error, response, body) {
                console.log(error, response)
                if (error) {
                    atom.notifications.addWarning(String(error), {
                        dismissable: true
                    })
                    reject(new Error('upload error'))
                }
                else if (!response) {
                    atom.notifications.addWarning('Upload failed: ' + path, {
                        dismissable: true
                    })
                    reject(new Error('upload error'))
                }
                else if (response.statusCode != 200) {
                    atom.notifications.addWarning('Upload failed: ' + response.body && response.body, {
                        dismissable: true
                    })
                    reject(new Error('upload error'))
                }
                else {
                    result = JSON.parse(response.body)
                    url = result.image.display_url
                    if (cheveretoImageSize === 'medium' && !result.image.medium) cheveretoImageSize = 'thumb'
                    if (cheveretoImageSize === 'thumb' && !result.image.thumb) cheveretoImageSize = 'origin'
                    if (cheveretoImageSize === 'origin') {
                        url = result.image.url
                    }
                    else if (cheveretoImageSize === 'default') {
                        url = result.image.display_url
                    }
                    else if (cheveretoImageSize === 'medium') {
                        url = result.image.medium.url
                    }
                    else if (cheveretoImageSize === 'thumb') {
                        url = result.image.thumb.url
                    }

                    resolve(url)

                }

            }
            request.post({
                url: cheveretoApi,
                formData: formData
            }, callback)

        })
    }
}
