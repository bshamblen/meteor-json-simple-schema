[![Build Status](https://travis-ci.org/bshamblen/meteor-json-simple-schema.svg)](https://travis-ci.org/bshamblen/meteor-json-simple-schema)

# JSON Schema to SimpleSchema Converter

Converts a JSON schema document to a SimpleSchema object, for use with Collection2 and AutoForm.

## Install
```cli
meteor add bshamblen:json-simple-schema
```

## Use
Simply load the contents of your JSON schema document from your local file system, or from a URL, and pass the parsed JSON object to the JSONSchema constructor:

#### toSimpleSchema

Generates an instance of `SimpleSchema`, ready to attach to your Meteor collection. 

```javascript
var jsonSchemaDoc = JSON.parse($.ajax({
	type: 'GET',
	url: 'http://example.com/path-to-json-schema-file',
	async: false
}).responseText);

var jsonSchema = new JSONSchema(jsonSchemaDoc);
var simpleSchema = jsonSchema.toSimpleSchema();

YourModel = new Mongo.Collection('somecollection');
YourModel.attachSchema(simpleSchema);
```

#### toSimpleSchemaProps

Generates just the schema properties object, which can be modified prior to manually creating an instance of `SimpleSchema`.

```javascript
var jsonSchemaDoc = JSON.parse($.ajax({
	type: 'GET',
	url: 'http://example.com/path-to-json-schema-file',
	async: false
}).responseText);

var jsonSchema = new JSONSchema(jsonSchemaDoc);
var props = jsonSchema.toSimpleSchemaProps();

props.extraProperty = {
	type: String,
	optional: true
}

var simpleSchema = new SimpleSchema(props);

YourModel = new Mongo.Collection('somecollection');
YourModel.attachSchema(simpleSchema);
```

## Disclaimer
This is the first iteration of this project, with minimal functionality. It currently supports base data types (including arrays), inline sub-objects and many of the validation options:
* title
* minimum
* maximum
* exclusiveMinimum
* exclusiveMaximum
* minLength
* maxLength
* enum
* minItems
* maxItems
* default
* pattern
* required
* Now supports internal `$ref` (thanks [@bpatridge](https://github.com/bpartridge))

## TODO
* Add support for external `$ref` schemas, from a URI.

## Contributing
Please feel free to contribute by sumbitting a pull request.
