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
		},
		'color': {
			'type': 'string',
			'enum': ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']
		}
	},
	'required': ['id', 'name', 'price']
};

Tinytest.add('JSONSchema - convert a basic JSON schema object to a SimpleSchema object', function(test) {
	var jsonSchema = new JSONSchema(packageJsonSchema);
	var simpleSchema = jsonSchema.toSimpleSchema();

	//Make sure .toSimpleSchema returned a SimpleSchema object
	test.instanceOf(simpleSchema, SimpleSchema);

	var rawSchema = simpleSchema._schema;

	test.equal(rawSchema.id.type, Number);
	test.equal(rawSchema.id.optional, false);

	test.equal(rawSchema.name.type, String);
	test.equal(rawSchema.name.optional, false);

	test.equal(rawSchema.price.type, Number);
	test.equal(rawSchema.price.min, 0);
	test.equal(rawSchema.price.optional, false);
	test.equal(rawSchema.price.exclusiveMin, true);

	test.equal(rawSchema.tags.type, Array);
	test.equal(rawSchema.tags.minCount, 1);
	test.equal(rawSchema['tags.$'].type, String);

	test.equal(rawSchema.color.type, String);
	test.equal(rawSchema.color.allowedValues.length, 7);
});
