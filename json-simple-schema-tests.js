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
    'arrayOfObjects': {
      'type': 'array',
      'items': {
        'type': 'object',
        'properties': {
          'foo': {'type': 'string'}
        }
      }
    },
    'color': {
      'type': 'string',
      'enum': ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']
    },
    'emailAddress': {
      'type': 'string',
      'format': 'email'
    }
  },
  'required': ['id', 'name', 'price']
};

Tinytest.add('JSONSchema - convert a basic JSON schema object to a SimpleSchema object', function(test) {
  var converter = new JsonSimpleSchema();
  converter.toSimpleSchemaInstance({json: packageJsonSchema}, function (err, simpleSchema) {
    //Make sure .toSimpleSchema returned a SimpleSchema object
    test.isNull(err);

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
    test.equal(rawSchema.price.decimal, true);

    test.equal(rawSchema.tags.type, Array);
    test.equal(rawSchema.tags.minCount, 1);
    test.equal(rawSchema['tags.$'].type, String);

    test.equal(rawSchema['arrayOfObjects.$.foo'].type, String);

    test.equal(rawSchema.color.type, String);
    test.equal(rawSchema.color.allowedValues.length, 7);

    test.equal(rawSchema.emailAddress.type, String);
    test.equal(rawSchema.emailAddress.regEx, SimpleSchema.RegEx.Email);
  });
});

// https://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-04
var packageJsonSchemaWithInternalRef = {
  '$schema': 'http://json-schema.org/draft-04/schema#',
  'title': 'Thing',
  'type': 'object',
  'properties': {
    'prop': {'$ref': '#/definitions/definitionWithSpecialChars~0~1%25'},
    'prop2': {'$ref': '#/definitions/arrayOfDefs/1'},
    'prop3': {'$ref': '#'},
    'refItems': {
      'type': 'array',
      'items': {'$ref': '#/definitions/arrayOfDefs/1'}
    }
  },
  'definitions': {
    'definitionWithSpecialChars~/%': {
      'type': 'string',
      'format': 'email'
    },
    'arrayOfDefs': [
      {'type': 'string'},
      {'type': 'number'}
    ]
  }
};

Tinytest.add('JSONSchema - convert a JSON schema object with internal references to a SimpleSchema object', function(test) {
  var converter = new JsonSimpleSchema();
  converter.toSimpleSchemaInstance({json: packageJsonSchemaWithInternalRef}, function (err, simpleSchema) {
    //Make sure .toSimpleSchema returned a SimpleSchema object
    test.isNull(err);

    test.instanceOf(simpleSchema, SimpleSchema);

    var rawSchema = simpleSchema._schema;

    test.equal(rawSchema.prop.type, String);
    test.equal(rawSchema.prop.regEx, SimpleSchema.RegEx.Email);
    test.equal(rawSchema.prop2.type, Number);
    test.equal(rawSchema.prop3.type, Object);

    test.equal(rawSchema.refItems.type, Array);
    test.equal(rawSchema['refItems.$'].type, Number);
  });
});
