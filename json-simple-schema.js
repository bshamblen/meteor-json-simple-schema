/**
 * Json Simple Schema
 * properties:
 *   _cache: holds fetched/parsed json schema objects
 * instance methods:
 *   emtpyCache
 *   toSimpleSchema - convert json schema to simple schema
 */

/**
 * Json Simple Schema constructor
 */
JsonSimpleSchema = function JsonSimpleSchema() {
  this._cache = {};
};

/**
 * Empty Cache
 */
JsonSimpleSchema.prototype.emptyCache = function emptyCache() {
  this._cache = {};
};

/**
 * Get Json Schema
 * Get Json schema with all internal and external refs dereferenced
 * @param {object} spec
 * @param {string|object} spec.json - json schema
 * @param {string} spec.url - url where json schema can be fetched
 * @param {function} callback - standard fn(error, result) style callback
 */
function getJsonSchema(spec, callback) {
  checkToSimpleSchemaSpec(spec);
  getJsonSchemaInternal.bind(this)(spec, callback);
}
JsonSimpleSchema.prototype.getJsonSchema = getJsonSchema;

/**
 * To Simple Schema
 */
JsonSimpleSchema.prototype.toSimpleSchema = function toSimpleSchema(spec, callback) {
  getJsonSchema.bind(this)(spec, function (error, jsonSchema) {
    if (error) { return callback(error); }
    var simpleSchema;
    try {
      simpleSchema = convertSchema(jsonSchema);
      simpleSchema = new SimpleSchema(simpleSchema);
    } catch(e) {
      return callback(e);
    }
    return callback(null, simpleSchema);
  });
};

/**
 * Check To Simple Schema Spec
 */
function checkToSimpleSchemaSpec(spec) {
  check(spec, { url: Match.Optional(String), json: Match.Optional(Object) });
  if (!(spec.url || spec.json)) {
    throw new Meteor.Error('toSimpleSchema object must contain a json object or a url');
  }
  if (spec.url) {
    spec.url = isAbsoluteUrl(spec.url) ? spec.url : Meteor.absoluteUrl(spec.url);
  }
}

/**
 * Get Json Schema Internal
 * @param {object} spec - same spec object from 'toSimpleSchema'
 */
function getJsonSchemaInternal(spec, callback) {
  // return schema from cache, if available
  if (spec.url && this._cache[spec.url]) {
    return callback(null, this._cache[spec.url]);
  } else {
    //fetch schema will return spec.json if available, or do HTTP.get on spec.url
    fetchSchema.bind(this)(spec, function (error, jsonSchema) {
      if (error) { return callback(error); }
      spec.json = jsonSchema;
      //find external refs, fetch and convert, then resolve current schema
      resolveExternalRefs.bind(this)(spec, callback);
    }.bind(this));
  }
}

/**
 * Fetch Schema
 * @param {object} spec - same spec object from 'toSimpleSchema'
 */
function fetchSchema(spec, callback) {
  var self = this;
  if (typeof spec.json === 'object') {
    return callback(null, spec.json);
  } else if (typeof spec.json === 'string') {
    return parseJson(spec.json, callback);
  } else {
    HTTP.get(spec.url, function (error, result) {
      if (error) { return callback(error); }
      return parseJson(result.content, callback);
    });
  }
}

/**
 * Parse JSON
 */
function parseJson(json, callback) {
  try {
    json = JSON.parse(json);
  } catch (error) {
    return callback(error);
  }
  return callback(null, json);
}

/**
 * Resolve External Refs
 */
function resolveExternalRefs(spec, callback) {
  var cache = this._cache;
  // get url, internal schema path, and flattened key path for each external ref
  spec.externalRefs = getExternalRefInfo(spec);

  if (spec.externalRefs.length) {
    var resolvedCount = 0;
    spec.externalRefs.forEach(function (refItem) {
      getJsonSchema.bind(this)({url: refItem.url}, function (err, result) {
        insertExternalRef(spec.json, refItem, result);
        if (++resolvedCount === spec.externalRefs.length) {
          callback(null, resolveInteralRefs(spec, cache));
        }
      });
    }, this);
  } else {
    return callback(null, resolveInteralRefs(spec, cache));
  }
}

/**
 * Get External Ref Info
 */
function getExternalRefInfo(spec) {
  // flatten function is imported from flatten.js
  var flatSchema = flatten(spec.json);
  return _.keys(flatSchema).filter(function (key) {
    return (key.indexOf('$ref') > -1) && (flatSchema[key].charAt(0) !== '#');
  })
  .map(function (key) {
    // split the ref on # to get [externalUrl, internalObjectPath]
    var ref = flatSchema[key].split('#');
    return {
      // absolute url of exernal reference
      url: isAbsoluteUrl(ref[0]) ? ref[0] : getRefAbsoluteUrl(spec.url, flatSchema, key),
      // relative path in schema to insert external schema
      relativePath: ref.length > 1 && ref[1],
      // flattened key path of external ref inside of schema
      key: key
    };
  });
}

/**
 * Insert External Ref
 * Replace ref with the actual schema
 */
function insertExternalRef(schema, refItem, refSchema) {
  var path = refItem.key.split('.');
  var pointer = schema;
  var key = path[0];
  for (var i = 1; i < path.length - 1; i++) {
    pointer = pointer[key];
    key = path[i];
  }
  var display = getDisplayValues(pointer[key]);
  pointer[key] = _.extend(refSchema, display);
}

/**
 * Resolve Internal Refs
 * Replace refs to definitions with actual schema
 */
function resolveInteralRefs(spec, cache) {
  var schema = spec.json;
  _.each(schema.properties, function(prop, key) {
    var display = getDisplayValues(prop);
    schema.properties[key] = _.extend(resolveInternalReference(prop, schema), display);
  });
  if (spec.url) {
    cache[spec.url] = schema;
  }
  return schema;
}

/**
 * Get Display Values
 * Return a new object with any display-related values from property (title, description)
 */
function getDisplayValues(property) {
  var result = {};
  if (property.title) { result.title = property.title; }
  if (property.description) { result.description = property.description; }
  return result;
}

/**
 * Get Ref Absolute Url
 * Look for id properties in the refs ancestor nodes
 * If the id is an absolute Url, use it to construct the ref's url
 * Otherwise, use the Url that the schema was fetched from
 */
function getRefAbsoluteUrl(schemaUrl, flatSchema, refKey) {
  var refPath = refKey.split('.');
  var relativeUrl = flatSchema[refKey].split('#')[0];
  var rootUrl = schemaUrl;
  while(refPath.length) {
    refPath.pop();
    var idKey = refPath.join('.')+'id';
    if (flatSchema[idKey] && isAbsoluteUrl(flatSchema[idKey])) {
      rootUrl = flatSchema[idKey];
      break;
    }
  }
  if (!rootUrl) {
    throw new Error('Unable to construct URL for external ref '+flatSchema[refKey]);
  }
  rootUrl = rootUrl.slice(0, rootUrl.lastIndexOf('/')+1);
  return rootUrl + relativeUrl;
}

/**
 * Is Absolute Url
 */
function isAbsoluteUrl(url) {
  return /^(?:[a-z]+:)?\/\//.test(url);
}

/**
 * Resolve Internal Reference
 */
function resolveInternalReference(prop, schema) {
  var $ref = prop.$ref;
  if ($ref) {
    if ($ref === '#') {
      // Prevent infinite recursion.
      return {type: schema.type || 'object'};
    } else if ($ref.substring(0, 2) === '#/') {
      var refParts = decodeURIComponent($ref).substring(2).split('/');
      var out = _.reduce(refParts, function(memo, refPart) {
        if (_.isArray(memo)) {
          return memo[parseInt(refPart)];
        } else {
          refPart = refPart.replace('~1', '/').replace('~0', '~');
          return memo[refPart];
        }
      }, schema);
      return resolveInternalReference(out);
    } else {
      throw new Error('Uncaught external reference '+$ref+'.');
    }
  } else {
    if (prop.items && prop.items.$ref) {
      return _.defaults({items: resolveInternalReference(prop.items, schema)}, prop);
    }
    return prop;
  }
}

/**
 * Convert Schema
 */
function convertSchema(jsonSchema) {
  var props = jsonSchema.properties || jsonSchema;
  return translateProperties(props, getRequiredFromProperty(jsonSchema));
}


function translateProperties(properties, required) {
  var schema = {};

  _.each(properties, function(prop, key) {

    var ssProp = {};
    addRules(ssProp, prop, required.indexOf(key) !== -1);

    if (Meteor.isClient) {
      addAutoformAttributes(ssProp, prop);
    }

    schema[key] = ssProp;
    var subProps = getSubPropertiesFromProperty(prop);

    if (subProps) {
      var subSchema = translateProperties(subProps, getRequiredFromProperty(prop));

      _.each(subSchema, function(subProp, subKey) {
        schema[key + '.' + (prop.type === 'array' ? '$.' : '') + subKey] = subProp;
      });
    }
  });

  return schema;
}

/**
 * Get Required From Property
 */
function getRequiredFromProperty(prop) {
  prop = (prop.type === 'array' && prop.items) ? prop.items : prop;
  return (prop.type === 'object' && prop.properties && prop.required) || [];
}


function getTypeFromProperty(prop) {
  var propType = prop.type === 'array' ? prop.items.type : prop.type;
  var format = prop.format;
  var ssType = String;

  switch (propType) {
    case 'integer':
    case 'number':
      ssType = Number;
      break;
    case 'boolean':
      ssType = Boolean;
      break;
    case 'object':
      ssType = Object;
      break;
    default:
      if (format === 'date' || format === 'date-time') {
        ssType = Date;
      } else {
        ssType = String;
      }
      break;
  }

  return (prop.type === 'array' ? [ssType] : ssType);
}

function getSubPropertiesFromProperty(prop) {
  if (prop.type === 'object' && prop.properties) {
    return prop.properties;
  } else if (prop.type === 'array' && prop.items && prop.items.type === 'object' && prop.items.properties) {
    return prop.items.properties;
  }

  return null;
}

var translationMap = {
  title: {key: 'label'},
  minimum: {key: 'min', type: Number},
  maximum: {key: 'max', type: Number},
  exclusiveMinimum: {key: 'exclusiveMin', type: Boolean},
  exclusiveMaximum: {key: 'exclusiveMax', type: Boolean},
  minLength: {key: 'min', type: Number},
  maxLength: {key: 'max', type: Number},
  minItems: {key: 'minCount', type: Number},
  maxItems: {key: 'maxCount', type: Number},
  'default': {key: 'defaultValue'}
};

function addRules(target, source, isRequired) {
  target.type = getTypeFromProperty(source);

  _.each(translationMap, function(spec, jKey) {
    if (typeof source[jKey] !== 'undefined') {
      target[spec.key] = spec.type ? spec.type(source[jKey]) : source[jKey];
    }
  });

  target.optional = !isRequired;

  if (source.pattern) {
    target.regEx = new RegExp(source.pattern);
  }

  if (source.enum) {
    target.allowedValues = source.enum.filter(function (item) {return item !== null; });
  }

  if (!source.pattern && source.format === 'email') {
    target.regEx = SimpleSchema.RegEx.Email;
  } else if (!source.pattern && (source.format === 'host-name' || source.format === 'hostname')) {
    target.regEx = SimpleSchema.RegEx.Domain;
  } else if (!source.pattern && source.format === 'ipv4') {
    target.rexEx = SimpleSchema.RegEx.IPv4;
  } else if (!source.pattern && source.format === 'ipv6') {
    target.rexEx = SimpleSchema.RegEx.IPv6;
  } else if (source.type === 'number' || (source.type === 'array' && source.items && source.items.type === 'number')) {
    target.decimal = true;
  }
}

function attachAutoformObject(target) {
  if (!target.autoform) {
    target.autoform = {};
  }

  if (!target.autoform.afFieldInput) {
    target.autoform.afFieldInput = {};
  }
}

function addAutoformAttributes(target, source) {
  if (source.description) {
    attachAutoformObject(target);
    target.autoform.afFieldInput.title = source.description;
  }

  if (source.format === 'date-time') {
    attachAutoformObject(target);
    target.autoform.afFieldInput.type = 'datetime';
  }

  if (source.enum && source.enum.some(function (item) { return item === null; })) {
    attachAutoformObject(target);
    target.autoform.afFieldInput.firstOption = '(None)';
  }
}


