Package.describe({
	name: 'bshamblen:json-simple-schema',
	version: '0.1.1',
	summary: 'Converts a JSON Schema to a SimpleSchema, for use with Collection2 and AutoForm.',
	git: 'https://github.com/yodata/meteor-json-simple-schema.git',
	documentation: 'README.md'
});

Package.onUse(function(api) {
	api.versionsFrom(['METEOR@0.9.3', 'METEOR@0.9.4', 'METEOR@1.0']);
	api.use(['aldeed:simple-schema@1.3.2', 'aldeed:autoform@5.3.1']);
	api.use('underscore');
	api.addFiles('json-simple-schema.js');
	api.export(['JSONSchema'], ['client', 'server']);
});

Package.onTest(function(api) {
	api.use('bshamblen:json-simple-schema', ['client', 'server']);
	api.use(['tinytest', 'underscore', 'aldeed:simple-schema@1.3.2']);
	api.addFiles('json-simple-schema-tests.js');
});
