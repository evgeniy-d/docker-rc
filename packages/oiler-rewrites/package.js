Package.describe({
	name: 'oiler:rewrites',
	version: '0.0.1',
	summary: 'Oiler Rewrites',
	git: ''
});

Package.onUse(function(api) {

	api.use([
		'ecmascript',
		'check',
		'rocketchat:lib',
		'rocketchat:ui-sidenav'
	]);

	api.addFiles('rocketchat-lib/server/methods/updateMessage.js', 'server');
});
