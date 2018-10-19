'use babel';

import {
    CompositeDisposable
} from 'atom'
import {
    clipboard
} from 'electron'
import fs from 'fs'
import path from 'path'
import getConfig from './getConfig'
export default {

    imageParseCheveretoView: null,
    modalPanel: null,
    subscriptions: null,

    activate(state) {
        var os = require("os")
        var isMac = false
        if (os.platform === 'darwin') isMac = true
        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable()

        // Register command that toggles this view
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'image-parse-chevereto:upload in use': () => this.uploadInUse()
        }))
        var _this = this
        let workspaceElement = atom.views.getView(atom.workspace)
        workspaceElement.addEventListener('keydown', function(e) {
            if (isMac && e.metaKey && e.keyCode == 86 ||
                !isMac && e.ctrlKey && e.keyCode == 86) {
                _this.toggle()
            }
        })

    },

    getSuggestions(request) {},

    deactivate() {},

    serialize() {},

    //判断字符是否为空的方法
    isEmpty(obj) {
        if (typeof obj == "undefined" || obj == null || obj == "") {
            return true;
        } else {
            return false;
        }
    },


    processFileAfterUpload(filePath) {
        let editor = atom.workspace.getActiveTextEditor()
        let pathDic = path.parse(editor.getPath())
        absolutePath = path.resolve(pathDic.dir, filePath)

        let isTmp = !getConfig('localImageSave')
        let autoRemove = getConfig('localImageAutoremove')
        console.log('isTmp: %o', isTmp)
        console.log('autoRemove: %o', autoRemove)
        if (isTmp || autoRemove) {
            // delete current file if "localImageSave" is Off or "localImageAutoremove" is On
            return this.removeFile(absolutePath)
        }
        console.log('processFileAfterUpload return false')
        return false
    },

    pathSubfolder() {
        let dirName = this.dirName()
        let editor = atom.workspace.getActiveTextEditor()
        let pathDicEditing = path.parse(editor.getPath())
        dirSub = path.resolve(pathDicEditing.dir, dirName)
        return dirSub
    },

    removeFile(filePath) {
        console.log('removeFile: %o', filePath)

        // check is in subfolder or .tmp
        let dirName = this.dirName()
        let editor = atom.workspace.getActiveTextEditor()

        let pathDic = path.parse(filePath)
        dirSub = this.pathSubfolder()

        // 如果不是子文件夹下的文件，则不删除
        if (dirSub !== pathDic.dir) return

        console.log('pathDic: %o', pathDic)

        try {
            console.log('fs.unlinkSync(filePath)')
            fs.unlinkSync(filePath)
        } catch (e) {
            console.log('errrrrrrrrrrrr   fs.unlinkSync(filePath)')
            return false
        }
        // remove dir if dir is empty
        let dir = pathDic.dir
        console.log('rm path: %o', dir)
        try {
            fs.rmdirSync(dir)
        } catch (e) {
            return true
        }
        return true
    },

    dirName() {
        let isTmp = !getConfig('localImageSave')
        let editor = atom.workspace.getActiveTextEditor()
        let dirName = getConfig('localSubfolderName')
        if (this.isEmpty(dirName)) {
            // localSubfolderName is empty, use editing file name as subfolder name
            let pathDic = path.parse(editor.getPath())
            dirName = pathDic['name']
            if (this.isEmpty(dirName)) {
                dirName = "images"
            }
        }
        if (isTmp) {
            dirName = ".tmp"
        }
        return dirName
    },

    createDirForPath(dir) {
        try {
            console.log('to create %o', dir)
            var pathinfo = path.parse(dir)
            if (fs.existsSync(dir)) {
                dirStat = fs.statSync(dir);
                if (!dirStat.isDirectory()) {
                    console.log('%o is a file', dir)
                    atom.notifications.addWarning('Subfolder name ' + dir + ' was occupied as a file', {
                        dismissable: true
                    })
                    return false
                } else {
                    console.log('%o exist', pathinfo.dir)
                    return true
                }
            } else if (fs.existsSync(pathinfo.dir)) {
                dirStat = fs.statSync(pathinfo.dir);
                if (!dirStat.isDirectory()) {
                    console.log('%o is a file', pathinfo.dir)
                    atom.notifications.addWarning('Subfolder name ' + pathinfo.dir + ' was occupied as a file', {
                        dismissable: true
                    })
                    return false
                } else {
                    console.log('%o exist as a dir, makedir %o', pathinfo.dir, dir)
                    fs.mkdirSync(dir)
                    return true
                }

            } else {
                console.log('%o not exist, to create %o ', pathinfo.dir, pathinfo.dir)
                if (this.createDirForPath(pathinfo.dir)) {
                    fs.mkdirSync(dir)
                    return true
                } else {
                    console.log('%o can not create, cb', pathinfo.dir)
                    return false
                }

            }
        } catch (e) {
            console.log('err %o', e)
            return false
        }
    },

    toggle() {
        console.log('------------toggle')

        let editor = atom.workspace.getActiveTextEditor()
        let tempFilePath = null

        let cheveretoUploadOnParse = getConfig("cheveretoUploadOnParse")
        let isTmp = !getConfig('localImageSave')
        if (!cheveretoUploadOnParse && isTmp) return
        console.log('------------toggle 1')
        // only supports markdown files
        if (editor.getPath().substr(-3) !== '.md' &&
            editor.getPath().substr(-9) !== '.markdown') return
        console.log('------------toggle 2')
        // not image

        console.log('------------toggle 3')
        try {
            // get config subfolder name
            // get editing file path info

            let pathDic = path.parse(editor.getPath())
            let pathParent = pathDic['dir']
            tempFilePath = path.resolve(pathParent, this.dirName())
            let resultCreateDirForPath = this.createDirForPath(tempFilePath)
            console.log('-------------222222222:%o', resultCreateDirForPath)
            if (!resultCreateDirForPath) return

            // get copied file path
            let fileName = clipboard.readBuffer('FileNameW').toString('ucs2');
            console.log('fileName: %o', fileName)
            fileName = fileName.replace(new RegExp(String.fromCharCode(0), 'g'), '');

            console.log('fileName: %o', fileName)
            if (this.isEmpty(fileName)) {
                fileName = clipboard.read('public.file-url').replace('file://', '');
            }
            console.log('fileName: %o', fileName)
            // return if neither a file or a image
            if (this.isEmpty(fileName) && clipboard.readImage().isEmpty()) return

            // random file name
            let suffix = clipboard.readText().replace(/(.*)+(?=\.)/, '')
            if (!suffix || suffix == '') {
                suffix = '.png'
            } 

            if (suffix !== '.jpg' &&
                suffix !== '.JPG' &&
                suffix !== '.jpeg' &&
                suffix !== '.JPEG' &&
                suffix !== '.png' &&
                suffix !== '.PNG') {
                return
            }
            let randomFileName = (Math.random() * 1e6 | 0).toString(32) + (suffix || '.png')

            //tmp file path
            tempFilePath = path.join(tempFilePath, randomFileName)

            if (!this.isEmpty(fileName)) {
                // copy file to dest
                fs.copyFileSync(fileName, tempFilePath)
            } else {
                // write buffer to dest
                let buffer = clipboard.readImage().toPNG()
                fs.writeFileSync(tempFilePath, Buffer.from(buffer))
            }

            let placeHolderText = path.join(this.dirName(), randomFileName)
            // add placeholder

            let imageText = '![](' + placeHolderText + ')'


            editor.insertText(imageText, editor)
            let cheveretoUploadOnParse = getConfig("cheveretoUploadOnParse")
            if (cheveretoUploadOnParse) {
                this.uploadImageWithPath(placeHolderText)
            }

        } catch (e) {
            console.error(e)
            console.log('to remove file: %o', tempFilePath)
            this.processFileAfterUpload(tempFilePath)
        }

    },

    // remove all unused image in subfolder
    scanAndDelete() {


    },

    arrayInUse() {
        let editor = atom.workspace.getActiveTextEditor()
        let array = new Array()
        let arrayInUse = new Array()
        let pathDicEditing = path.parse(editor.getPath())
        let pathSubfolder = this.pathSubfolder()
        editor.scan(new RegExp("\\!\\[[^\\]]*?\\]\\((?!http).*?\\)", 'g'), function(match) {
            if (match) {
                array = array.concat(match.match)
            }
        })
        console.log('----------%o', array)
        array.forEach(function(element, index, array) {

            let indexStart = element.indexOf('](');
            if (indexStart > 0) {
                imagePath = element.substring(indexStart + 2, element.length - 1);
                let absolutePath = path.resolve(pathDicEditing.dir, imagePath)
                let pathDicFile = path.parse(absolutePath)
                if (pathDicFile.dir.length >= pathSubfolder.length &&
                    pathSubfolder === pathDicFile.dir.substring(0, pathSubfolder.length)) {
                    arrayInUse.push(imagePath)
                }
            }
        });
        console.log('-------inuse---%o', arrayInUse)
        return arrayInUse
    },

    uploadInUse() {
        var _this = this

        this.arrayInUse().forEach(function(element, index, array) {
            _this.uploadImageWithPath(element)
        });
    },

    uploadImageWithPath(tmpPath) {
        if (this.isEmpty(tmpPath)) return
        var _this = this
        let editor = atom.workspace.getActiveTextEditor()

        let pathDicEditing = path.parse(editor.getPath())
        let absolutePath = path.resolve(pathDicEditing.dir, tmpPath)
        console.log('tmpPath: %o', tmpPath)
        console.log('absolutePath: %o', absolutePath)
        if (this.isEmpty(absolutePath)) return

        let regTmp = new RegExp(/\\/g);
        let tmpPathReplaced = tmpPath.replace(regTmp, "\\\\");

        editor.scan(new RegExp("\\]\\(" + tmpPathReplaced + "\\)", 'g'), match => match.replace('_uploading](' + tmpPath + ')'))

        let cheveretoApi = getConfig("cheveretoApi")
        let cheveretoApiKey = getConfig("cheveretoApiKey")
        let cheveretoImageSize = getConfig("cheveretoImageSize")

        if (!cheveretoApi || !cheveretoApi || !cheveretoImageSize) {
            atom.notifications.addWarning('can not found cheveretoApi or cheveretoApiKey or cheveretoImageSize', {
                dismissable: true
            })
            return false
        }

        var request = require('request');
        var formData = {
            key: cheveretoApiKey,
            format: 'json',
            source: fs.createReadStream(absolutePath)
        };

        function callback(error, response, body) {
            let url = null
            let isOk = false;
            console.log(error, response)

            if (error) {
                atom.notifications.addWarning(String(error), {
                    dismissable: true
                })
                //reject(new Error('upload error'))
            } else if (!response) {
                atom.notifications.addWarning('Upload failed: ' + path, {
                    dismissable: true
                })
                //reject(new Error('upload error'))
            } else if (response.statusCode != 200) {
                atom.notifications.addWarning('Upload failed: ' + response.body && response.body, {
                    dismissable: true
                })
                //reject(new Error('upload error'))
            } else {
                isOk = true
                result = JSON.parse(response.body)
                console.log('result %o', result)
                url = result.image.url
                if (cheveretoImageSize === 'medium' && !result.image.medium) cheveretoImageSize = 'thumb'
                if (cheveretoImageSize === 'thumb' && !result.image.thumb) cheveretoImageSize = 'origin'
                if (cheveretoImageSize === 'origin') {
                    url = result.image.url
                } else if (cheveretoImageSize === 'default') {
                    url = result.image.display_url
                } else if (cheveretoImageSize === 'medium') {
                    url = result.image.medium.url
                } else if (cheveretoImageSize === 'thumb') {
                    url = result.image.thumb.url
                }


            }
            if (isOk) {

                editor.scan(new RegExp("_uploading\\]\\(" + tmpPathReplaced + "\\)", 'g'), match => match.replace('](' + url + ')'))
                _this.processFileAfterUpload(tmpPath)
            } else {

                if (_this.processFileAfterUpload(tmpPath)) {
                    console.log('-------------remove image text: %o', tmpPath)
                    editor.scan(new RegExp("\\!\\[[^\\]]*]\\(" + tmpPathReplaced + "\\)", 'g'), match => match.replace(''))
                } else {
                    editor.scan(new RegExp("_uploading\\]\\(" + tmpPathReplaced + "\\)", 'g'), match => match.replace('](' + tmpPath + ')'))
                }
            }
        };

        request.post({
            url: cheveretoApi,
            formData: formData
        }, callback)

    }
}
