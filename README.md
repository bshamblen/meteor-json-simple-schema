[![Build Status](https://travis-ci.org/Yodata/meteor-json-simple-schema.svg)](https://travis-ci.org/Yodata/meteor-json-simple-schema)

# JSON Schema to SimpleSchema Converter

Converts a JSON schema document to a SimpleSchema object, for use with Collection2 and AutoForm.

## Install
```cli
meteor add bshamblen:json-simple-schema
```

## Use
Simply load the contents of your JSON schema document from your local file system, or from a URL, and pass the parsed JSON object to the JSONSchema constructor:

```javascript
var jsonSchemaDoc = JSON.parse($.ajax({
	ype: 'GET',
	url: 'http://example.com/path-to-json-schema-file',
	async: false
}).responseText);
var jsonSchema = new JSONSchema(jsonSchemaDoc);
var simpleSchema = jsonSchema.toSimpleSchema();
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

## TODO
* Add support for internal `$ref` schemas, from `definitions`
* Add support for external `$ref` schemas, from a URI.

## Contributing
Please feel free to contribute by sumbitting a pull request.