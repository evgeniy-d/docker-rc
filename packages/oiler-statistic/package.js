Package.describe({
	name: 'oiler:statistic',
	version: '0.0.1',
	summary: 'Display statistic',
	git: ''
});

Package.onUse(function(api) {

	api.use([
		'ecmascript',
		'check',
		'rocketchat:lib',
		'rocketchat:ui-sidenav'
	]);

	api.use('templating', 'client');

	api.addFiles('client/roomList.js', 'client');
	api.addFiles('server/server.js', 'server');
});
