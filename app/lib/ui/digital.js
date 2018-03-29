const digital = {}

digital.openFile = async function (options) {
	'use strict';
	return new Promise((resolve, reject) => {
		return dialog.showOpenDialog(options, async (filePaths, bookmarks) => {
			console.dir(filePaths)
			console.dir(bookmarks)
			return resolve(true)
		})
	})
}

digital.openVideo = async function () {
	'use strict';
	let options = {
		title : 'Open Video',
		buttonLabel : 'Open',
		filters : [
    		{ name: 'Videos', extensions: ['mkv', 'avi', 'mp4', 'mov'] }
		],
		properties : [
			'openFile'
		]
	}
	return await digital.openFile(options)
}

digital.openImage = async function () {
	'use strict';
	let options = {
		title : 'Open Image',
		buttonLabel : 'Open',
		filters : [
    		{ name: 'Images', extensions: ['jpg', 'jpeg', 'gif', 'png'] }
		],
		properties : [
			'openFile'
		]
	}
	return await digital.openFile(options)
}

digital.openDirectory = async function () {
	'use strict';
	let options = {
		title : 'Open Directory',
		buttonLabel : 'Open',
		filters : [],
		properties : [
			'openDirectory'
		]
	}
	return await digital.openFile(options)
}

module.exports = digital