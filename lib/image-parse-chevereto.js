'use babel';

import {
    CompositeDisposable
} from 'atom'
import {
    clipboard
} from 'electron'
import fs from 'fs'
import path from 'path'
import getUploader from './getUploader'
import getConfig from './getConfig'
export default {

    imageParseCheveretoView: null,
    modalPanel: null,
    subscriptions: null,

    activate(state) {
        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable()

        // Register command that toggles this view
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'image-parse-chevereto:toggle': () => this.toggle()
        }))
    },

    getSuggestions(request) {
        // console.log('request', request)
    },

    deactivate() {
        // console.log('deactivate')
    },

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

    removeFile(filePath) {
        console.log('removeFile: %o', filePath)
        if (this.isEmpty(filePath)) return false
        // check is in subfolder or .tmp
        let dirName = this.dirName()
        let editor = atom.workspace.getActiveTextEditor()
        let pathDic = path.parse(filePath)
        let pathEditingDic = path.parse(editor.getPath())
        dirSub = path.join(pathEditingDic.dir, this.dirName())

        // 如果不是子文件夹下的文件，则不删除
        if (dirSub !== pathDic.dir) return

        console.log('pathDic: %o', pathDic)
        console.log('pathEditingDic: %o', pathEditingDic)

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

    toggle() {
        console.log('-------------toggletoggletoggle')
        let editor = atom.workspace.getActiveTextEditor()
        let tempFilePath = null

        let cheveretoUploadOn = getConfig("cheveretoUploadOn")
        let isTmp = !getConfig('localImageSave')
        if (!cheveretoUploadOn && isTmp) return

        // only supports markdown files
        if (editor.getPath().substr(-3) !== '.md' &&
            editor.getPath().substr(-9) !== '.markdown') return

        // not image
        if (clipboard.readImage().isEmpty()) return

        try {
            // get config subfolder name
            // get editing file path info

            let pathDic = path.parse(editor.getPath())
            let pathParent = pathDic['dir']

            tempFilePath = path.join(pathParent, this.dirName())
            // test if file exist
            try {

                dirStat = fs.statSync(tempFilePath);
                if (!dirStat.isDirectory()) {
                    atom.notifications.addWarning('Subfolder name ' + dirName + ' was occupied as a file', {
                        dismissable: true
                    })
                    return
                }
            } catch (e) {
                // create dir if not exist
                fs.mkdirSync(tempFilePath)
            }



            // get copied file path
            const rawFilePath = clipboard.read('FileNameW');
            let filePath = rawFilePath.replace(new RegExp(String.fromCharCode(0), 'g'), '');
            if (this.isEmpty(filePath)) {
                filePath = clipboard.read('public.file-url').replace('file://', '');
            }

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

            if (!this.isEmpty(filePath)) {
                // copy file to dest
                fs.copyFileSync(filePath, tempFilePath)
            } else {
                // write buffer to dest
                let buffer = clipboard.readImage().toPNG()
                fs.writeFileSync(tempFilePath, Buffer.from(buffer))
            }

            let placeHolderText = path.join(this.dirName(), randomFileName)
            // add placeholder

            let imageText = '![](' + placeHolderText + ')'
            console.log('-------------imageText: %o', imageText)
            editor.insertText(imageText, editor)
            console.log('-------------cheveretoUploadOn: %o', getConfig('cheveretoUploadOn'))

            this.uploadImageWithPath(placeHolderText)

        } catch (e) {
            console.error(e)
            this.processFileAfterUpload(tempFilePath)
        }

    },

    scanAndDelete() {
        let array = new Array()
        // (?<=\!\[[^\]]*]\((testmd/|\.\/testmd/))
        editor.scan(new RegExp("_uploading\\]\\(" + imagePath + "\\)",'g'), match => match.replace('](' + url + ')'))
    },

    scanAndUpload() {

    },

    uploadImageWithPath(imagePath) {
        if (this.isEmpty(imagePath)) return
        let cheveretoUploadOn = getConfig("cheveretoUploadOn")
        if (!cheveretoUploadOn) return
        let editor = atom.workspace.getActiveTextEditor()

        //atom.workspace.getActiveTextEditor().scan(/!\[.*\]\(\.\/asdf\.png\)/, (match) => match.replace('aaaa'))


        editor.scan(new RegExp("\\]\\(" + imagePath + "\\)"), match => match.replace('_uploading](' + imagePath + ')'))

        let pathDic = path.parse(editor.getPath())
        absolutePath = path.resolve(pathDic.dir, imagePath)
        if (this.isEmpty(absolutePath)) return

        let uploader = getUploader()
        if (cheveretoUploadOn && uploader) {
            // upload enabled
            uploader({
                path: absolutePath
            }).then(url => {
                // upload complete
                // replace placeholder
                editor.scan(new RegExp("_uploading\\]\\(" + imagePath + "\\)",'g'), match => match.replace('](' + url + ')'))
                this.processFileAfterUpload(imagePath)
            }, err => {
                editor.scan(new RegExp("_uploading\\]\\(" + imagePath + "\\)",'g'), match => match.replace('](' + imagePath + ')'))
                atom.notifications.addWarning('Upload image' + imagePath + ' error!', {
                    dismissable: true
                })
                if (this.processFileAfterUpload(imagePath)) {
                    console.log('-------------remove image text: %o', imagePath)
                    editor.scan(new RegExp("\\!\\[[^\\]]*]\\(" + imagePath + "\\)",'g'), match => match.replace(''))
                }
            })
        }
    }
}
