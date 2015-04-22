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
	}

	function translateProperties(properties, required) {
		var schema = {};

		_.each(properties, function(prop, key) {
			var sProp = {};
			addRules(sProp, prop, required.indexOf(key) !== -1);
			schema[key] = sProp;

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

		//TODO: Add support to get properties from $ref definition.

		return null;
	}

	function getRequiredFromProperty(prop) {
		if (prop.type === 'object' && prop.properties) {
			return prop.required || [];
		} else if (prop.type === 'array' && prop.items && prop.items.type === 'object' && prop.items.properties) {
			return prop.items.required || [];
		}

		//TODO: Add support to get required properties from $ref definition.

		return [];
	}

	var translationMap = {
		title: 'label',
		minimum: 'min',
		maximum: 'max',
		minLength: 'min',
		maxLength: 'max',
		emun: 'allowedValues',
		minItems: 'minCount',
		maxItems: 'maxCount',
		'default': 'defaultValue'
	}

	function addRules(target, source, isRequired) {
		target.type = getTypeFromProperty(source);

		_.each(translationMap, function(sKey, jKey) {
			if (source[jKey]) {
				target[sKey] = source[jKey];
			}
		});

		target.optional = !isRequired;

		if (source.pattern) {
			target.regEx = new RegExp(source.pattern);
		}

		if (target.type === Date && source.format === 'date-time') {
			target.autoform = {
				afFieldInput: {
					type: 'datetime'
				}
			}
		}
	}
};
