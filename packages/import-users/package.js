Package.describe({
	name: 'oakma:import-users',
	version: '0.0.1',
	summary: 'Import users',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'ecmascript',
		'check',
		'rocketchat:lib'
	]);

	api.use('templating', 'client');

	api.addFiles('client/client.js', 'client');
	api.addFiles('server/server.js', 'server');
});
