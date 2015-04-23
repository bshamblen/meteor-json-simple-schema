var packageJsonSchema = {
	'$schema': 'http://json-schema.org/draft-04/schema#',
	'title': 'Product',
	'description': 'A product from Acme\'s catalog',
	'type': 'object',
	'properties': {
		'id': {
			'description': 'The unique identifier for a product',
			'type': 'integer'
		},
		'name': {
			'description': 'Name of the product',
			'type': 'string'
		},
		'price': {
			'type': 'number',
			'minimum': 0,
			'exclusiveMinimum': true
		},
		'tags': {
			'type': 'array',
			'items': {
				'type': 'string'
			},
			'minItems': 1,
			'uniqueItems': true
		}
	},
	'required': ['id', 'name', 'price']
};

Tinytest.add('JSONSchema - convert a basic JSON schema object to a SimpleSchema object', function(test) {
	var jsonSchema = new JSONSchema(packageJsonSchema);
	var simpleSchema = jsonSchema.toSimpleSchema();
	test.instanceOf(simpleSchema, SimpleSchema);
	test.equal(simpleSchema._schema.id.type, Number);
	test.equal(simpleSchema._schema.id.optional, false);
	test.equal(simpleSchema._schema.name.type, String);
	test.equal(simpleSchema._schema.name.optional, false);
	test.equal(simpleSchema._schema.price.type, Number);
	test.equal(simpleSchema._schema.price.min, 0);
	test.equal(simpleSchema._schema.price.optional, false);
	test.equal(simpleSchema._schema.price.exclusiveMin, true);
	test.equal(simpleSchema._schema.tags.type, Array);
	test.equal(simpleSchema._schema.tags.minCount, 1);
	test.equal(simpleSchema._schema['tags.$'].type, String);
});
