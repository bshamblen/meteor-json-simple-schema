JSONSchema = function(schema, options) {
	var root = this;

	if (typeof schema !== 'object') {
		throw new Error('schema parameter must be an object');
	}

	var jsonSchema = schema;

	this.toSimpleSchema = function toSimpleSchema() {
		var props = jsonSchema.properties || jsonSchema;
		var simpleSchema = translateProperties(props, getRequiredFromProperty(jsonSchema));
		return new SimpleSchema(simpleSchema);
	};

	function translateProperties(properties, required) {
		var schema = {};

		_.each(properties, function(prop, key) {
			var oldProp = prop;
			prop = resolveReference(prop);
			prop.title = oldProp.title;
			prop.description = oldProp.description;

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

	function getRequiredFromProperty(prop) {
		if (prop.type === 'object' && prop.properties) {
			return prop.required || [];
		} else if (prop.type === 'array' && prop.items && prop.items.type === 'object' && prop.items.properties) {
			return prop.items.required || [];
		}

		return [];
	}

	var translationMap = {
		title: {key: 'label'},
		minimum: {key: 'min', type: Number},
		maximum: {key: 'max', type: Number},
		exclusiveMinimum: {key: 'exclusiveMin', type: Number},
		exclusiveMaximum: {key: 'exclusiveMax', type: Number},
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

	// https://tools.ietf.org/id/draft-pbryan-zyp-json-ref-03.html
	// https://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-04
	function resolveReference(prop) {
		var $ref;
		if ($ref = prop.$ref) {
			if ($ref === '#') {
				// Prevent infinite recursion.
				return {type: jsonSchema.type || 'object'};
			} else if ($ref.substring(0, 2) === '#/') {
				var refParts = decodeURIComponent($ref).substring(2).split('/');
				var out = _.reduce(refParts, function(memo, refPart) {
					if (_.isArray(memo)) {
						return memo[parseInt(refPart)];
					} else {
						refPart = refPart.replace('~1', '/').replace('~0', '~');
						return memo[refPart];
					}
				}, jsonSchema);

				return resolveReference(out);
			} else {
				throw new Error('Non-internal or relative JSON references not yet implemented');
			}
		} else {
			if (prop.items && prop.items.$ref) {
				return _.defaults({items: resolveReference(prop.items)}, prop);
			}

			return prop;
		}
	}
};
