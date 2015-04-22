# JSON Schema to SimpleSchema Converter

Converts a JSON schema document to a SimpleSchema object, for use with Collection2 and AutoForm.

## Install
```cli
meteor install bshamblen:json-simple-schema
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