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

    toggle() {
        console.error('-------------toggletoggletoggletoggletoggle')
        let editor = atom.workspace.getActiveTextEditor()
        // only supports markdown files

        if (editor.getPath().substr(-3) !== '.md' ||
            editor.getPath().substr(-9) !== '.markdown') return

        // get config subfolder name
        let dirName = getConfig('localSubfolderName')
        if (this.isEmpty(dirName)) {
            // localSubfolderName is empty, use editing file name as subfolder name

        }
        let tempFilePath = null
        let removeFile = () => tempFilePath && fs.unlinkSync(tempFilePath)
        try {
            // not image
            if (clipboard.readImage().isEmpty()) return

            // get file path
            const rawFilePath = clipboard.read('FileNameW');
            let filePath = rawFilePath.replace(new RegExp(String.fromCharCode(0), 'g'), '');
            if (this.isEmpty(filePath)) {
                filePath = clipboard.read('public.file-url').replace('file://', '');
            }

            // random file name
            let suffix = clipboard.readText().replace(/(.*)+(?=\.)/, '')
            console.log('suffix: %o', suffix)
            if (!suffix || suffix == '') {
                suffix = '.png'
            }
            console.log('suffix: %o', suffix)

            if (suffix !== '.jpg' &&
                suffix !== '.JPG' &&
                suffix !== '.jpeg' &&
                suffix !== '.JPEG' &&
                suffix !== '.png' &&
                suffix !== '.PNG') {
                return
            }
            console.log('suffix: %o', suffix)
            let randomFileName = (Math.random() * 1e6 | 0).toString(32) + (suffix || '.png')

            //tmp file path
            tempFilePath = path.join(__dirname, randomFileName)

            if (!this.isEmpty(filePath)) {
                // copy file to dest
                fs.copyFileSync(filePath, tempFilePath)
            } else {
                // write buffer to dest
                let buffer = clipboard.readImage().toPNG()
                fs.writeFileSync(tempFilePath, Buffer.from(buffer))
            }

            let placeHolderText = `uploading-${randomFileName}`
            // add placeholder
            editor.insertText(`![](${placeHolderText})`, editor)
            console.log('-------------cheveretoUploadOn: %o', getConfig('cheveretoUploadOn'))

            let uploader = getUploader()
            let cheveretoUploadOn = getConfig("cheveretoUploadOn")

            if (cheveretoUploadOn && uploader) {
                // upload enabled
                uploader({
                    path: tempFilePath
                }).then(url => {
                    // upload complete
                    // replace placeholder
                    editor.scan(new RegExp(placeHolderText), tools => tools.replace(url))

                    // remove temp files
                    //removeFile()
                }, err => {
                    console.error('--------err')
                    editor.scan(new RegExp(placeHolderText), tools => tools.replace('upload error'))
                    removeFile()
                })
            }

        } catch (e) {
            console.error(e)
            removeFile()
        }

    }
}
