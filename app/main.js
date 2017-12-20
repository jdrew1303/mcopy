'use strict'

const electron = require('electron')
const { Menu, MenuItem, ipcMain, BrowserWindow, app } = electron
const fs = require('fs')
const winston = require('winston')
const moment = require('moment')
const uuid = require('uuid')
const Q = require('q')
const events = require('events')
const ee = new events.EventEmitter()
const capture = require('./lib/capture-report.js')(ee)
	
const mcopy = {}

let mainWindow
let mscript
let arduino
let projector
let camera
let log = {}

//console.log(process.version)

mcopy.cfg = {}
mcopy.cfgFile = './data/cfg.json'
mcopy.cfgInit = function () {
	if (!fs.existsSync(mcopy.cfgFile)) {
		console.log('Using default configuration...')
		fs.writeFileSync(mcopy.cfgFile, fs.readFileSync('./data/cfg.json.default'))
	}
	mcopy.cfg = JSON.parse(fs.readFileSync(mcopy.cfgFile, 'utf8'))
}
mcopy.cfgStore = function () {
	var data = JSON.stringify(mcopy.cfg)
	fs.writeFileSync(mcopy.cfgFile, data, 'utf8')
}

var enumerateDevices = function (err, devices) {
	if (err) {
		log.info(err, 'SERIAL', false, true)
		arduino.fakeConnect('projector', () => {
			log.info('Connected to fake PROJECTOR device', 'SERIAL', true, true)
		})
		arduino.fakeConnect('camera', () => {
			log.info('Connected to fake CAMERA device', 'SERIAL', true, true)
		})
		devicesReady('fake', 'fake')
	} else {
		log.info('Found ' + devices.length + ' USB devices', 'SERIAL', true, true)
		distinguishDevices(devices)
	}
}

var distinguishDevice = function (device, callback) {
	var connectCb = function (err, device) {
		if (err) {
			return console.error(err)
		}
		setTimeout(function () {
			arduino.verify(verifyCb)
		}, 2000);
	},
	verifyCb = function (err, success) {
		if (err) {
			return console.error(err)
		}
		setTimeout(function () {
			arduino.distinguish(distinguishCb);
		}, 1000);
	},
	distinguishCb = function (err, type) {
		if (err) {
			return console.error(err)
		}
		if (callback) { callback(err, type); }
	}
	arduino.connect('connect', device, true, connectCb)
};

//Cases for 1 or 2 arduinos connected
var distinguishDevices = function (devices) {
	var distinguishOne = function (err, type) {
		arduino.close(() => {
			if (type === 'projector') {
				arduino.connect('projector', devices[0], false, () => {
					log.info('Connected to ' + devices[0] + ' as PROJECTOR', 'SERIAL', true, true)
				});
				if (devices.length === 1) {
					arduino.fakeConnect('camera', () => {
						log.info('Connected to fake CAMERA device', 'SERIAL', true, true)
						devicesReady(devices[0], 'fake')
					});
				}
			} else if (type === 'camera') {
				arduino.connect('camera', devices[0], false, () => {
					log.info('Connected to ' + devices[0] + ' as CAMERA', 'SERIAL', true, true)
				});
				if (devices.length === 1) {
					arduino.fakeConnect('projector', () => {
						log.info('Connected to fake PROJECTOR device', 'SERIAL', true, true)
						devicesReady('fake', devices[0])
					})
				}
			}
			if (devices.length > 1) {
				distinguishDevice(devices[1], distinguishTwo)
			}
		})
	},
	distinguishTwo = function (err, type) {
		arduino.close(() => {
			if (type === 'projector') {
				arduino.connect('projector', devices[1], false, () => {
					log.info('Connected to ' + devices[1] + ' as PROJECTOR', 'SERIAL', true, true)
					devicesReady(devices[1], devices[0])
				});
			} else if (type === 'camera') {
				arduino.connect('camera', devices[1], false, () => {
					log.info('Connected to ' + devices[1] + ' as CAMERA', 'SERIAL', true, true)
					devicesReady(devices[0], devices[1])
				});
			}
		});
	};
	distinguishDevice(devices[0], distinguishOne)
};

var devicesReady = function (camera, projector) {
	mainWindow.webContents.send('ready', {camera: camera, projector: projector })
};

var createMenu = function () {
	var template = [
	  {
	    label: 'mcopy',
	    submenu: [
	      {
	        label: 'About mcopy',
	        selector: 'orderFrontStandardAboutPanel:'
	      },
	      {
	        type: 'separator'
	      },
	      {
	        label: 'Services',
	        submenu: []
	      },
	      {
	        type: 'separator'
	      },
	      {
	        label: 'Hide mcopy',
	        accelerator: 'Command+H',
	        selector: 'hide:'
	      },
	      {
	        label: 'Hide Others',
	        accelerator: 'Command+Shift+H',
	        selector: 'hideOtherApplications:'
	      },
	      {
	        label: 'Show All',
	        selector: 'unhideAllApplications:'
	      },
	      {
	        type: 'separator'
	      },
	      {
	        label: 'Quit',
	        accelerator: 'Command+Q',
	        selector: 'terminate:'
	      },
	    ]
	  },
	  {
	    label: 'Edit',
	    submenu: [
	      {
	        label: 'Undo',
	        accelerator: 'Command+Z',
	        selector: 'undo:'
	      },
	      {
	        label: 'Redo',
	        accelerator: 'Shift+Command+Z',
	        selector: 'redo:'
	      },
	      {
	        type: 'separator'
	      },
	      {
	        label: 'Cut',
	        accelerator: 'Command+X',
	        selector: 'cut:'
	      },
	      {
	        label: 'Copy',
	        accelerator: 'Command+C',
	        selector: 'copy:'
	      },
	      {
	        label: 'Paste',
	        accelerator: 'Command+V',
	        selector: 'paste:'
	      },
	      {
	        label: 'Select All',
	        accelerator: 'Command+A',
	        selector: 'selectAll:'
	      }
	    ]
	  },
	  {
	    label: 'View',
	    submenu: [
	      {
	        label: 'Reload',
	        accelerator: 'Command+R',
	        click: function() { getCurrentWindow().reload(); }
	      },
	      {
	        label: 'Toggle DevTools',
	        accelerator: 'Alt+Command+I',
	        click: function() { getCurrentWindow().toggleDevTools(); }
	      },
	    ]
	  },
	  {
	    label: 'Window',
	    submenu: [
	      {
	        label: 'Minimize',
	        accelerator: 'Command+M',
	        selector: 'performMiniaturize:'
	      },
	      {
	        label: 'Close',
	        accelerator: 'Command+W',
	        selector: 'performClose:'
	      },
	      {
	        type: 'separator'
	      },
	      {
	        label: 'Bring All to Front',
	        selector: 'arrangeInFront:'
	      }
	    ]
	  },
	  {
	    label: 'Help',
	    submenu: []
	  }
	]

	menu = Menu.buildFromTemplate(template)

	Menu.setApplicationMenu(menu)
}

var createWindow = function () {
	mainWindow = new BrowserWindow({
		width: 800, 
		height: 600,
		minWidth : 800,
		minHeight : 600
	})
	mainWindow.loadURL('file://' + __dirname + '/index.html')
	//mainWindow.webContents.openDevTools()
	mainWindow.on('closed', () => {
		mainWindow = null
	});
}

var light = {}
light.init = function () {
	light.listen()
};
light.listen = function () {
	ipcMain.on('light', (event, arg) => {
		light.set(arg.rgb, arg.id)
		event.returnValue = true
	})
};
light.set = function (rgb, id) {
	var str = rgb.join(',');
	arduino.send('projector', mcopy.cfg.arduino.cmd.light, (ms) => {
		light.end(rgb, id, ms)
	})
	arduino.string('projector', str)
};
light.end = function (rgb, id, ms) {
	log.info('Light set to ' + rgb.join(','), 'LIGHT', true, true)
	mainWindow.webContents.send('light', {rgb: rgb, id : id, ms: ms})
};

var proj = {}
proj.state = {
	dir : true //default dir
};
proj.init = function () {
	proj.listen()
}
proj.set = function (dir, id) {
	var cmd
	if (dir) {
		cmd = mcopy.cfg.arduino.cmd.proj_forward
	} else {
		cmd = mcopy.cfg.arduino.cmd.proj_backward
	}
	proj.state.dir = dir
	arduino.send('projector', cmd, (ms) => {
		proj.end(cmd, id, ms)
	})
}
proj.move = function (frame, id) {
	arduino.send('projector', mcopy.cfg.arduino.cmd.projector, (ms) => {
		proj.end(mcopy.cfg.arduino.cmd.projector, id, ms)
	})
}
proj.listen = function () {
	ipcMain.on('proj', (event, arg) => {
		if (typeof arg.dir !== 'undefined') {
			proj.set(arg.dir, arg.id)
		} else if (typeof arg.frame !== 'undefined') {
			proj.move(arg.frame, arg.id)
		}
		event.returnValue = true
	})
}
proj.end = function (cmd, id, ms) {
	var message = ''
	if (cmd === mcopy.cfg.arduino.cmd.proj_forward) {
		message = 'Projector set to FORWARD'
	} else if (cmd === mcopy.cfg.arduino.cmd.proj_backward) {
		message = 'Projector set to BACKWARD'
	} else if (cmd === mcopy.cfg.arduino.cmd.projector) {
		message = 'Projector '
		if (proj.state.dir) {
			message += 'ADVANCED'
		} else {
			message += 'REWOUND'
		}
		message += ' 1 frame'
	}
	log.info(message, 'PROJECTOR', true, true)
	mainWindow.webContents.send('proj', {cmd: cmd, id : id, ms: ms})
}

var cam = {}
cam.state = {
	dir : true //default dir
}
cam.init = function () {
	cam.listen()
}
cam.set = function (dir, id) {
	var cmd
	if (dir) {
		cmd = mcopy.cfg.arduino.cmd.cam_forward
	} else {
		cmd = mcopy.cfg.arduino.cmd.cam_backward
	}
	cam.state.dir = dir
	arduino.send('camera', cmd, (ms) => {
		cam.end(cmd, id, ms)
	})
}
cam.move = function (frame, id) {
	arduino.send('camera', mcopy.cfg.arduino.cmd.camera, (ms) => {
		cam.end(mcopy.cfg.arduino.cmd.camera, id, ms)
	})
}
cam.listen = function () {
	ipcMain.on('cam', (event, arg) => {
		if (typeof arg.dir !== 'undefined') {
			cam.set(arg.dir, arg.id)
		} else if (typeof arg.frame !== 'undefined') {
			cam.move(arg.frame, arg.id)
		}
		event.returnValue = true
	});
};
cam.end = function (cmd, id, ms) {
	var message = ''
	if (cmd === mcopy.cfg.arduino.cmd.cam_forward) {
		message = 'Camera set to FORWARD'
	} else if (cmd === mcopy.cfg.arduino.cmd.cam_backward) {
		message = 'Camera set to BACKWARD'
	} else if (cmd === mcopy.cfg.arduino.cmd.camera) {
		message = 'Camera '
		if (cam.state.dir) {
			message += 'ADVANCED'
		} else {
			message += 'REWOUND'
		}
		message += ' 1 frame'
	}
	log.info(message, 'CAMERA', true, true)
	mainWindow.webContents.send('cam', {cmd: cmd, id : id, ms: ms})
};

log.time = 'MM/DD/YY-HH:mm:ss'
log.transport = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)(),
		new (winston.transports.File)({ filename: './logs/mcopy.log' })
	]
})
log.init = function () {
	log.listen()
};
log.display = function (obj) {
	mainWindow.webContents.send('log', obj)
};
log.listen = function () {
	ipcMain.on('log', (event, arg) => {
		log.transport.info('renderer', arg)
		event.returnValue = true
	})
};
log.info = function (action, service, status, display) {
	var obj = {
		time : moment().format(log.time),
		action : action,
		service : service,
		status : status
	}
	log.transport.info('main', obj)
	if (display) {
		log.display(obj)
	}
};

var transfer = {}

transfer.init = function () {
	transfer.listen()
};
transfer.listen = function () {
	ipcMain.on('transfer', (event, arg) => {
		var res = '';
		//also turn on and off
		if (arg.action === 'enable') {
			capture.active = true
			res = capture.active
		} else if (arg.action === 'disable') {
			capture.active = false
			res = capture.active
		} else if (arg.action === 'start') {
			capture.start()
		} else if (arg.action === 'end') {
			res = capture.end()
		}
		event.returnValue = res
	})
}

var init = function () {
	
	mcopy.cfgInit()
	createWindow()
	//createMenu()
	log.init()
	light.init()
	proj.init()
	cam.init()

	transfer.init()
	capture.init()

	arduino = require('./lib/mcopy-arduino.js')(mcopy.cfg, ee)
	mscript = require('./lib/mscript.js')

	setTimeout( () => {
		arduino.enumerate(enumerateDevices)
	}, 1000)
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
