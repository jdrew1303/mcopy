'use strict'

async function delay (ms) {
	return new Promise(resolve => {
		return setTimeout(resolve, ms)
	})
}

module.exports = delay