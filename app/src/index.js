var remote = require('remote'),
	ipcRenderer = require('electron').ipcRenderer,
	light = {},
	log = {};
//console.log(ipcRenderer.sendSync('light', { 'fuck' : true }) );

log.time = 'MM/DD/YY-HH:mm:ss';
log.count = 0;
log.init = function () {
	'use strict';
	$('#log').w2grid({ 
	    name   : 'log', 
	    columns: [                
	        { field: 'time', caption: 'Time', size: '22%' },
	        { field: 'action', caption: 'Action', size: '58%' },
	        { field: 'service', caption: 'Service', size: '20%' },
	        { field: 'status', caption: 'Status', size: '10%' },
	    ],
	    records: []
	});
	//{ recid: 1, time: moment().format(log.time), action: 'Started app', service: 'MAIN', status: true }
	log.info('Started app', 'MAIN', true);
	log.listen();
};

log.listen = function () {
	'use strict';
	ipcRenderer.on('log', function (event, arg) {
		log.display(arg.action, arg.service, arg.status, arg.time);
		return event.returnValue = true;
	});
};

log.display = function (action, service, status, time) {
	'use strict';
	var obj = {
		recid : log.count++,
		time : time,
		action : action,
		service : service,
		status : status
	}
	if (typeof time === 'undefined') {
		obj.time = moment().format(log.time);
	}
	w2ui['log'].add(obj);
	setTimeout(function () {
		$('#grid_log_table').animate({ 
			scrollTop: $('#grid_log_table').prop('scrollHeight')
		}, 0);
	}, 1);
	return obj;
};

log.report = function (obj) {
	'use strict';
	ipcRenderer.sendSync('log', obj);
};

log.info = function (action, service, status, time) {
	'use strict';
	var obj = log.display(action, service, status, time);
	log.report(obj);
	console.log(obj);
};

//LIGHT
light.preview = false;
light.color = [0, 0, 0]; //preview status
light.current = [0, 0, 0]; //last sent
light.init = function () {
	$('#colors-tabs').w2tabs({
		name: 'colors',
		active: 'rgb',
		tabs: [
			{ id: 'rgb', caption: 'RGB' },
			{ id: 'cmy', caption: 'CMY'},
			{ id: 'kelvin', caption: 'Kelvin'}
		],
		onClick: function (event) {
			$('#colors-content').html('Tab: ' + event.target);
		}
	});
	$('#preview').on('change', function () {
		light.preview = $(this).prop('checked');
	});
};
//color = [0,0,0]
light.set = function (rgb) {
	'use strict';
	light.current = rgb;
	console.log('color: ' + rgb.join(','));
	ipcRenderer.sendSync('light', rgb);
};

light.display = function (rgb) {
	'use strict';
	for (var i = 0; i < 3; i++) {
		rgb[i] = Math.floor(rgb[i]);
		$('#light-status form input').eq(i).val(rgb[i]);
	}
	light.color = rgb;
	$('#color').css('background-color', 'rgb(' + rgb.join(',') + ')');
	if (light.preview) {
		light.set(rgb);
	}
};

var init = function () {
	'use strict';
	$('#toolbar').w2toolbar({
		name: 'toolbar',
		items: [
			{ type: 'radio',  id: 'item1',  group: '1', caption: 'Sequence', icon: 'fa-star', checked: true },
			{ type: 'radio',  id: 'item2',  group: '1', caption: 'Script', icon: 'fa-star-empty' },
			{ type: 'radio',  id: 'item3',  group: '1', caption: 'Controls', icon: 'fa-star-empty' },
			{ type: 'radio',  id: 'item4',  group: '1', caption: 'Light', icon: 'fa-star-empty' },
			{ type: 'spacer' },
			{ type: 'button',  id: 'item5',  group: '1', caption: 'Settings', icon: 'fa-home' }
		],
		onClick : function (event) {

		}
	});
	log.init();
	light.init();
};