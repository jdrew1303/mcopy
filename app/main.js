/* jshint esversion: 6, asi: true, strict: true*/
/* global require, setTimeout, process, console*/

'use strict'

const electron = require('electron')
const { Menu, MenuItem, ipcMain, BrowserWindow, app } = electron
const fs = require('fs')
const os = require('os')
const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf, colorize, prettyPrint, simple } = format
const moment = require('moment')
const uuid = require('uuid')
const events = require('events')
const path = require('path')

const ee = new events.EventEmitter()
const settings = require('settings')
const system = require('system')
const Server = require('server')
const Intval = require('intval')
const delay = require('delay')

//Objects
const mcopy = {}

let SYSTEM;
let log;
let mainWindow;
let mscript;
let arduino;
let server;
let menu;
let display;
let ffmpeg;
let ffprobe;
let cam;
let cam2;
let proj;
let proj2;
let light;
let dig;
let dev;

const cfg = require('./data/cfg.json')

var createMenu = function () {
	const template = require('./data/menu.json')
	menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)
}

var createWindow = function () {
	mainWindow = new BrowserWindow({
		width: 800, 
		height: 600,
		minWidth : 800,
		minHeight : 600,
		icon: path.join(__dirname, 'assets/icons/icon.png')
	})
	mainWindow.loadURL('file://' + __dirname + '/index.html')
	if (process.argv.indexOf('-d') !== -1 || process.argv.indexOf('--dev') !== -1) {
		mainWindow.webContents.openDevTools()
	}
	mainWindow.on('closed', () => {
		mainWindow = null
	})
}

const seq = {};
seq.init = function () {
	seq.listen();
}

seq.listen = function () {
	ipcMain.on('seq', async (evt, arg) => {
		if (arg.action === 'stop' && proj.digital) {
			display.close()
		} else if (arg.action === 'start' && proj.digital) {
			display.open()
		}
	})
}

var init = async function () {

	log = await require('log')({})

	try {
		SYSTEM = await system()
	} catch (err) {
		console.error(err)
	}

	createWindow()
	createMenu()

	await settings.restore()

	//dev.init()
	seq.init()

	display = require('display')(SYSTEM)
	ffmpeg = require('ffmpeg')(SYSTEM)
	ffprobe = require('ffprobe')(SYSTEM)
	arduino = require('arduino')(cfg, ee)
	mscript = require('mscript')

	dev = require('devices')(arduino, settings, mainWindow, cam)

	await delay(2000)

	try {
		await dev.enumerate()
	} catch (err) {
		console.error(err)
		log.error('Error enumerating connected devices', err)
	}


	light = require('light')(arduino, cfg, mainWindow.webContents)
	dig = require('digital')(display, ffmpeg, ffprobe, mainWindow.webContents, light)
	cam = require('cam')(arduino, cfg, mainWindow.webContents, dig)
	proj = require('proj')(arduino, cfg, mainWindow.webContents, dig)

	console.dir(dev.state)
	//cmd
	//seq
}

app.on('ready', init)

app.on('window-all-closed', () => {
	//if (process.platform !== 'darwin') {
		app.quit();
	//}
});

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow();
	}
});

mcopy.relaunch = function () {
	app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])})
	app.exit(0)
}