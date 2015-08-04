Meteor-Json-Simple-Schema
-------------------------

This is a fork of Yodata's <a href="https://github.com/Yodata/meteor-json-simple-schema">meteor-json-simple-schema</a>.

This fork is in the process of supporting external refs within JSON schemas.
Currently, external refs are supported, but not paths to nested objects inside the external ref.

```
/**
 * Supported
 */
// absolute url
{$ref: 'http://my-host.com/schemas/my-schema.json'}
// relative path
{$ref: 'my-other-schema.json#'}

/**
 * Not supported - paths inside of the external ref
 */
{$ref: 'my-other-schema.json#exampleProperty'}
```

Support for paths inside of internal refs is not something I need right now,
but I might find time for it, or you can do a pull request.



API
---

The API is a bit different from the original.

```
var spec = {url:  'http://my-host.com/schemas/my-schema.json'}
var altSpec = {json: schemaObject}

var converter = new JsonSimpleSchema();

converter.toSimpleSchema(spec, function (error, simpleSchema) {
  // simpleSchema is an instance of SimpleSchema
});
```

The spec object can contain:
  url:  a url string
  json: a schema represented as a JSON string or js object


The instance of JsonSimpleSchema caches the schemas that it fetches.  To clear the cache, call:
```
converter.clearCache();
```

For more info, please see:
<a href="https://github.com/Yodata/meteor-json-simple-schema">meteor-json-simple-schema</a>.