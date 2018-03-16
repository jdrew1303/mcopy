'use strict'

const path = require('path')

const delay = require('../delay')
const exec = require('../exec')

const { ipcMain, BrowserWindow} = require('electron')

let digitalWindow

class Digital {
	constructor() {

	}
	async open () {
		digitalWindow = new BrowserWindow({
			width: 800, 
			height: 600,
			minWidth : 800,
			minHeight : 600,
			icon: path.join(__dirname, '../../assets/icons/icon.png')
		})
		digitalWindow.loadURL('file://' + __dirname + '../../../views/digital.html')
		if (process.argv.indexOf('-d') !== -1 || process.argv.indexOf('--dev') !== -1) {
			digitalWindow.webContents.openDevTools()
		}
		digitalWindow.on('closed', () => {
			digitalWindow = null
		})
	}
	fullScreen () {
		digitalWindow.setFullScreen(true)
	}
	setImage (src, delay) {
		digitalWindow.webContents.send('digital', { src })
	}
	close () {
		digitalWindow.close()
	}
	async frame () {
		
	}
}

module.exports = Digital