JSONEditor.Validator = Class.extend({
  init: function (jsoneditor, schema) {
    this.jsoneditor = jsoneditor;
    this.schema = schema || this.jsoneditor.schema;
    this.options = {};
    this.translate = this.jsoneditor.translate || JSONEditor.defaults.translate;
  },
  /**
   *
   * @param {object} obj - the object from which to get the value
   * @param {string} propString - a property string that describes the path to
   * the object's property value that we are interested in, separated by dots
   * @param {boolean} isRelativePropertyPath - true if the propString should be
   * treated as relative
   * @param {string} propertyPathContext - the current context from which
   * relative property paths should be calculated
   * @returns the value of the property, if it is found.
   */
  getPropByString: function (obj, propString, isRelativePropertyPath, propertyPathContext) {
    var i, iLen;
    //TODO: get the last 2 parameters to work.
    if (!propString)
      return obj;

    if (isRelativePropertyPath) {
      var stack = propertyPathContext.split("."),
        parts = propString.split("/");
      stack.pop(); // remove current file name (or empty string)
                   // (omit if "base" is the current folder without trailing slash)
      for (i = 0; i < parts.length; i++) {
        if (parts[i] == ".")
          continue;
        if (parts[i] == "..")
          stack.pop();
        else
          stack.push(parts[i]);
      }
      // get rid of the first item in stack if it is "root"
      var firstItem = stack.shift();
      if (firstItem !== "root") {
        stack.unshift(firstItem); // put it back again, it wasn't what we expected.
      }
      propString = stack.join("."); // overrides the function parameter with our newly-calculated absolute property string
    }
    // get the target property from obj, based on the path provided by propString.
    var prop, props = propString.split('.');

    for (iLen = props.length - 1, i = 0; i < iLen; i++) {
      prop = props[i];

      var candidate = obj[prop];
      if (candidate !== undefined) {
        obj = candidate;
      } else {
        break;
      }
    }
    return obj[props[i]];
  },
  validate: function (value) {
    return this._validateSchema(this.schema, value, 'root', value);
  },
  _validateSchema: function (schema, value, path, fullSchemaValue) {
    var errors = [];
    var valid, i, j, thisEditor;
    var stringified = JSON.stringify(value);

    path = path || 'root';

    // Work on a copy of the schema
    schema = $extend({}, this.jsoneditor.expandRefs(schema));

    /*
     * Type Agnostic Validation
     */
    /* "requiredIf" is for cross-dependencies, when one property is required only if
     * another property has a certain (specified) value.
     * E.g. a cross-references between an enum "Cheese" and a "cheeseDetails" array:
     *   "Cheese": {
     *     "type": "string",
     *      "title": "Do you like cheese?",
     *      "enum":["yes","no"]
     *    },
     *    "cheeseDetails": {
     *      "type": "array",
     *      "title": "Reason for liking cheese",
     *      "requiredIf": {
     *          "propertyPath": "Cheese",
     *          "propertyPathMatches": {
     *              "matchType": "string",
     *              "matchExpression": "yes"
     *          },
     *          "hideOtherwise": true,
     *          "disableOtherwise": true
     *      },
     *      "items": {
     *        "type": "string",
     *        "minLength": 3,
     *        "title": "Reason for liking cheese"
     *      }
     *    }
     *
     * In this case, "Cheese Details" is required only if Cheese is "yes", otherwise
     *  it is hidden and disabled.
     *
     *  Or, to test for a particular value in an array property:
     *        "requiredIf": {
     *        "propertyPath": "operation_type-7",
     *        "propertyPathMatches": {
     *          "matchType": "oneOfSelected",
     *          "matchExpression": [
     *            "other"
     *          ]
     *        }
     *
     *  To test for a particular value using a relative path
     *  (works with other matchTypes):
     *        "requiredIf": {
     *          "propertyPath": "../operation_type-7",
     *          "propertyPathMatches": {
     *            "matchType": "oneOfSelected",
     *            "matchExpression": [
     *              "other"
     *            ]
     *          },
     *          "propertyPathIsRelative":true
     *       }

     * This will test an array of strings, defined elsewhere, to see if any items in the array have value "other".
     */
    if (schema.requiredIf) {
      var hasError = true, // start by assuming that this is required and not supplied.
              valueMatch = false, // start by assuming the values DONT match
              showThisField = false; // start by assuming this field should be hidden

      // we have a cross-reference requirement. Check the value of the associated path. 
      //  schema.requiredIf.propertyPath
      if (fullSchemaValue && schema.requiredIf.propertyPath) { // make sure we have the full schema's value to validate against
        // what type is this value?
        var propPathIsRelative = schema.requiredIf.propertyPathIsRelative;
        var propValue = this.getPropByString(fullSchemaValue, schema.requiredIf.propertyPath, propPathIsRelative, path);
        var type = (typeof propValue);
        if (type) {
          // what type is specified in the cross-reference? Note this is a JAVASCRIPT type, or RegExp.
          if ((schema.requiredIf.propertyPathMatches.matchType === type) ||
                  (("RegExp" === schema.requiredIf.propertyPathMatches.matchType) &&
                          ("string" === type))
                  ) {

            if ("RegExp" === schema.requiredIf.propertyPathMatches.matchType) {
              var regexp = new RegExp(schema.requiredIf.propertyPathMatches.matchExpression);
              valueMatch = regexp.test(propValue);
            } else {
              // both the same type (probably string), now check values
              valueMatch = (schema.requiredIf.propertyPathMatches.matchExpression === propValue);
            }
            if (valueMatch === true) {
              // this one is definitely required. So check that we have it.
              showThisField = true;

              if (schema.type === "array") {
                // make sure we have at least one
                if (value && (value.length > 0)) {
                  // we're good. return.
                  hasError = false;
                } // else value is no good, will fall through to errors.push
              } else {
                // not an array. Check that value is "truthy".
                if (!!value || schema.type === "object") { // if it's an object, properties get validated.
                  // value is "truthy". We're good. return.
                  hasError = false;
                } // else value is no good, will fall through to errors.push
              }
            } else {
              // the value we have differs from the matchExpression. So it's not required. we're good. return.
              hasError = false;
            }
          } else if ((schema.requiredIf.propertyPathMatches.matchType === "oneOfSelected")) { // javascript arrays - testing for selected values


            // now check to see if the value we're looking for is in the set of selected values
            var testValuesArray = schema.requiredIf.propertyPathMatches.matchExpression;
            var actualValuesArray = propValue;

            if (Array.isArray(testValuesArray)) {
              if (Array.isArray(actualValuesArray)) {
                // test values are an array, actual selected values are also an array.
                // test each of our test values (defined in the schema) to see if any have been selected.
                valueMatch = testValuesArray.some(function (testValue, index, array) {
                  return (actualValuesArray.indexOf(testValue) !== -1);
                }, this);
              } else {
                // our test values are an array, but the actual values are not.
                var actualValue = actualValuesArray; // it's not actually an array.
                // test each of our test values (defined in the schema) to see if any match the selected value.
                valueMatch = (testValuesArray.indexOf(actualValue) !== -1);
              }
            }
            if (valueMatch === true) {
              // this one is definitely required. So display it.
              showThisField = true;
              if (schema.type === "array") {
                // make sure we have at least one
                if (value && (value.length > 0)) {
                  // we're good. return.
                  hasError = false;
                } // else value is no good, will fall through to errors.push
              } else {
                // not an array. Check that value is "truthy".
                if (!!value || schema.type === "object") { // if it's an object, properties get validated.
                  // value is "truthy". We're good. return.
                  hasError = false;
                } // else value is no good, will fall through to errors.push
              }

            } else { // the dependant value was not selected, so this field is not required.
              hasError = false;
            }
          }

        }
      }
      if (showThisField) {
        if (schema.requiredIf.hideOtherwise) {
          // make sure it's shown
          $("[data-schemapath=\"" + path + "\"]").show();
        }
        if (schema.requiredIf.disableOtherwise) {
          // make sure it's enabled
          this.jsoneditor.getEditor(path).enable();
        }
      } else {
        if (schema.requiredIf.hideOtherwise) {
          // We need to hide this one.
          $("[data-schemapath=\"" + path + "\"]").hide();
        }
        if (schema.requiredIf.disableOtherwise) {
          // we need to disable this one.
          this.jsoneditor.getEditor(path).disable();
        }
      }
      if (hasError) {
        // if we get to this point, it didn't work out.
        errors.push({
          path: path,
          property: 'requiredIf',
          message: this.translate("error_requiredIf", [schema.title])
        });
      }
    }
    thisEditor = this.jsoneditor.getEditor(path);
    if (thisEditor && !thisEditor.disabled) {
      // Version 3 `required`
      if (schema.required && schema.required === true) {
        if (typeof value === "undefined") {
          errors.push({
            path: path,
            property: 'required',
            message: this.translate("error_notset")
          });

          // Can't do any more validation at this point
          return errors;
        } else if (// signature is required
                schema.format &&
                (schema.format === "signature") &&
                typeof value === "string") {
          if (value.length === 0) {
            // hasn't been signed.
            errors.push({
              path: path,
              property: 'required',
              message: this.translate("error_notset")
            });
          } else {
            // we should be able to parse the value as JSON
            try {
              var sigVal = JSON.parse(value);
              if (sigVal && !sigVal.hasValue) {
                // hasn't been signed.
                errors.push({
                  path: path,
                  property: 'required',
                  message: this.translate("error_notset")
                });
              }
            } catch (e) {
              console.error(e);
            }
          }
        } else if (// array of strings (select with multiple) is required
                schema.format &&
                (schema.format === "string") &&
                (schema.type === "array") &&
                schema.multiple &&
                schema.multiple === true) {
          // value should be an array...
          if (value && value.length === 0) {
            // hasn't been selected.
            errors.push({
              path: path,
              property: 'required',
              message: this.translate("error_notset")
            });
          }
        } else if (schema.format &&
          (schema.format === "datetime-local") &&
          (schema.type === "string")) {
          if (!value) {
            // hasn't been selected.
            errors.push({
              path: path,
              property: 'required',
              message: this.translate("error_notset")
            });
          }
        }


      }
      // Value not defined
      else if (typeof value === "undefined") {
        // If required_by_default is set, all fields are required
        if (this.jsoneditor.options.required_by_default) {
          errors.push({
            path: path,
            property: 'required',
            message: this.translate("error_notset")
          });
        }
        // Not required, no further validation needed
        else {
          return errors;
        }
      }


      // `enum`
      if (schema.enum) {
        valid = false;
        if (Array.isArray(schema.enum) && Array.isArray(value)) {
          // check that every value appears in the schema's enum property
          valid = value.every(function (currentValue, index, array) {
            return (schema.enum.indexOf(currentValue) !== -1);
          }, this);
        } else {
          for (i = 0; i < schema.enum.length; i++) {
            if (stringified === JSON.stringify(schema.enum[i]))
              valid = true;

          }
        }
        if (!valid) {
          errors.push({
            path: path,
            property: 'enum',
            message: this.translate("error_enum")
          });
        }
      }

      // `extends` (version 3)
      if (schema.extends) {
        for (i = 0; i < schema.extends.length; i++) {
          errors = errors.concat(this._validateSchema(schema.extends[i], value, path, fullSchemaValue));
        }
      }

      // `allOf`
      if (schema.allOf) {
        for (i = 0; i < schema.allOf.length; i++) {
          errors = errors.concat(this._validateSchema(schema.allOf[i], value, path, fullSchemaValue));
        }
      }

      // `anyOf`
      if (schema.anyOf) {
        valid = false;
        for (i = 0; i < schema.anyOf.length; i++) {
          if (!this._validateSchema(schema.anyOf[i], value, path, fullSchemaValue).length) {
            valid = true;
            break;
          }
        }
        if (!valid) {
          errors.push({
            path: path,
            property: 'anyOf',
            message: this.translate('error_anyOf')
          });
        }
      }

      // `oneOf`
      if (schema.oneOf) {
        valid = 0;
        var oneof_errors = [];
        for (i = 0; i < schema.oneOf.length; i++) {
          // Set the error paths to be path.oneOf[i].rest.of.path
          var tmp = this._validateSchema(schema.oneOf[i], value, path, fullSchemaValue);
          if (!tmp.length) {
            valid++;
          }

          for (j = 0; j < tmp.length; j++) {
            tmp[j].path = path + '.oneOf[' + i + ']' + tmp[j].path.substr(path.length);
          }
          oneof_errors = oneof_errors.concat(tmp);

        }
        if (valid !== 1) {
          errors.push({
            path: path,
            property: 'oneOf',
            message: this.translate('error_oneOf', [valid])
          });
          errors = errors.concat(oneof_errors);
        }
      }

      // `not`
      if (schema.not) {
        if (!this._validateSchema(schema.not, value, path, fullSchemaValue).length) {
          errors.push({
            path: path,
            property: 'not',
            message: this.translate('error_not')
          });
        }
      }

      // `type` (both Version 3 and Version 4 support)
      if (schema.type) {
        // Union type
        if (Array.isArray(schema.type)) {
          valid = false;
          for (i = 0; i < schema.type.length; i++) {
            if (this._checkType(schema.type[i], value)) {
              valid = true;
              break;
            }
          }
          if (!valid) {
            errors.push({
              path: path,
              property: 'type',
              message: this.translate('error_type_union')
            });
          }
        }
        // Simple type
        else {
          if (!this._checkType(schema.type, value)) {
            errors.push({
              path: path,
              property: 'type',
              message: this.translate('error_type', [schema.type])
            });
          }
        }
      }


      // `disallow` (version 3)
      if (schema.disallow) {
        // Union type
        if (Array.isArray(schema.disallow)) {
          valid = true;
          for (i = 0; i < schema.disallow.length; i++) {
            if (this._checkType(schema.disallow[i], value)) {
              valid = false;
              break;
            }
          }
          if (!valid) {
            errors.push({
              path: path,
              property: 'disallow',
              message: this.translate('error_disallow_union')
            });
          }
        }
        // Simple type
        else {
          if (this._checkType(schema.disallow, value)) {
            errors.push({
              path: path,
              property: 'disallow',
              message: this.translate('error_disallow', [schema.disallow])
            });
          }
        }
      }

      /*
       * Type Specific Validation
       */

      // Number Specific Validation
      if (typeof value === "number" || schema.format === "number") {
        var valueToTest = value;
        // the format is a number but the type isn't...
        if (schema.format === "number" && typeof valueToTest !== "number") {
          // perform a type conversion
          // if value is empty, treat it as zero
          if (valueToTest === "") {
            valueToTest = 0;
          } else {
            valueToTest = 1 * valueToTest; // convert to a number
          }
        }
        // `multipleOf` and `divisibleBy`
        if (schema.multipleOf || schema.divisibleBy) {
          valid = valueToTest / (schema.multipleOf || schema.divisibleBy);
          if (valid !== Math.floor(valid)) {
            errors.push({
              path: path,
              property: schema.multipleOf ? 'multipleOf' : 'divisibleBy',
              message: this.translate('error_multipleOf', [schema.multipleOf || schema.divisibleBy])
            });
          }
        }

        // `maximum`
        if (schema.hasOwnProperty('maximum')) {
          if (schema.exclusiveMaximum && valueToTest >= schema.maximum) {
            errors.push({
              path: path,
              property: 'maximum',
              message: this.translate('error_maximum_excl', [schema.maximum])
            });
          }
          else if (!schema.exclusiveMaximum && valueToTest > schema.maximum) {
            errors.push({
              path: path,
              property: 'maximum',
              message: this.translate('error_maximum_incl', [schema.maximum])
            });
          }
        }

        // `minimum`
        if (schema.hasOwnProperty('minimum')) {
          if (schema.exclusiveMinimum && value <= schema.minimum) {
            errors.push({
              path: path,
              property: 'minimum',
              message: this.translate('error_minimum_excl', [schema.minimum])
            });
          }
          else if (!schema.exclusiveMinimum && value < schema.minimum) {
            errors.push({
              path: path,
              property: 'minimum',
              message: this.translate('error_minimum_incl', [schema.minimum])
            });
          }
        }
      }
      // String specific validation
      if (typeof value === "string") {
        // `maxLength`
        if (schema.maxLength) {
          if ((value + "").length > schema.maxLength) {
            errors.push({
              path: path,
              property: 'maxLength',
              message: this.translate('error_maxLength', [schema.maxLength])
            });
          }
        }

        // `minLength`
        if (schema.minLength) {
          if ((value + "").length < schema.minLength) {
            errors.push({
              path: path,
              property: 'minLength',
              message: this.translate((schema.minLength === 1 ? 'error_notempty' : 'error_minLength'), [schema.minLength])
            });
          }
        }

        // `pattern`
        if (schema.pattern) {
          if (!(new RegExp(schema.pattern)).test(value)) {
            errors.push({
              path: path,
              property: 'pattern',
              message: this.translate('error_pattern')
            });
          }
        }
      }
      // Array specific validation
      else if (typeof value === "object" && value !== null && Array.isArray(value)) {
        // `items` and `additionalItems`
        if (schema.items) {
          // `items` is an array
          if (Array.isArray(schema.items)) {
            for (i = 0; i < value.length; i++) {
              // If this item has a specific schema tied to it
              // Validate against it
              if (schema.items[i]) {
                errors = errors.concat(this._validateSchema(schema.items[i], value[i], path + '.' + i, fullSchemaValue));
              }
              // If all additional items are allowed
              else if (schema.additionalItems === true) {
                break;
              }
              // If additional items is a schema
              // TODO: Incompatibility between version 3 and 4 of the spec
              else if (schema.additionalItems) {
                errors = errors.concat(this._validateSchema(schema.additionalItems, value[i], path + '.' + i, fullSchemaValue));
              }
              // If no additional items are allowed
              else if (schema.additionalItems === false) {
                errors.push({
                  path: path,
                  property: 'additionalItems',
                  message: this.translate('error_additionalItems')
                });
                break;
              }
              // Default for `additionalItems` is an empty schema
              else {
                break;
              }
            }
          }
          // `items` is a schema
          else {
            // Each item in the array must validate against the schema
            for (i = 0; i < value.length; i++) {
              errors = errors.concat(this._validateSchema(schema.items, value[i], path + '.' + i, fullSchemaValue));
            }
          }
        }

        // `maxItems`
        if (schema.maxItems) {
          if (value.length > schema.maxItems) {
            errors.push({
              path: path,
              property: 'maxItems',
              message: this.translate('error_maxItems', [schema.maxItems])
            });
          }
        }

        // `minItems`
        if (schema.minItems) {
          if (value.length < schema.minItems) {
            errors.push({
              path: path,
              property: 'minItems',
              message: this.translate('error_minItems', [schema.minItems])
            });
          }
        }

        // `uniqueItems`
        if (schema.uniqueItems) {
          var seen = {};
          for (i = 0; i < value.length; i++) {
            valid = JSON.stringify(value[i]);
            if (seen[valid]) {
              errors.push({
                path: path,
                property: 'uniqueItems',
                message: this.translate('error_uniqueItems')
              });
              break;
            }
            seen[valid] = true;
          }
        }
      }
      // Object specific validation
      else if (typeof value === "object" && value !== null) {
        // `maxProperties`
        if (schema.maxProperties) {
          valid = 0;
          for (i in value) {
            if (!value.hasOwnProperty(i))
              continue;
            valid++;
          }
          if (valid > schema.maxProperties) {
            errors.push({
              path: path,
              property: 'maxProperties',
              message: this.translate('error_maxProperties', [schema.maxProperties])
            });
          }
        }

        // `minProperties`
        if (schema.minProperties) {
          valid = 0;
          for (i in value) {
            if (!value.hasOwnProperty(i))
              continue;
            valid++;
          }
          if (valid < schema.minProperties) {
            errors.push({
              path: path,
              property: 'minProperties',
              message: this.translate('error_minProperties', [schema.minProperties])
            });
          }
        }

        // Version 4 `required`
        if (schema.required && Array.isArray(schema.required)) {
          for (i = 0; i < schema.required.length; i++) {
            if (typeof value[schema.required[i]] === "undefined") {
              errors.push({
                path: path,
                property: 'required',
                message: this.translate('error_required', [schema.required[i]])
              });
            }
          }
        }

        // `properties`
        var validated_properties = {};
        if (schema.properties) {
          for (i in schema.properties) {
            if (!schema.properties.hasOwnProperty(i))
              continue;
            validated_properties[i] = true;
            errors = errors.concat(this._validateSchema(schema.properties[i], value[i], path + '.' + i, fullSchemaValue));
          }
        }

        // `patternProperties`
        if (schema.patternProperties) {
          for (i in schema.patternProperties) {
            if (!schema.patternProperties.hasOwnProperty(i))
              continue;

            var regex = new RegExp(i);

            // Check which properties match
            for (j in value) {
              if (!value.hasOwnProperty(j))
                continue;
              if (regex.test(j)) {
                validated_properties[j] = true;
                errors = errors.concat(this._validateSchema(schema.patternProperties[i], value[j], path + '.' + j, fullSchemaValue));
              }
            }
          }
        }

        // The no_additional_properties option currently doesn't work with extended schemas that use oneOf or anyOf
        if (typeof schema.additionalProperties === "undefined" && this.jsoneditor.options.no_additional_properties && !schema.oneOf && !schema.anyOf) {
          schema.additionalProperties = false;
        }

        // `additionalProperties`
        if (typeof schema.additionalProperties !== "undefined") {
          for (i in value) {
            if (!value.hasOwnProperty(i))
              continue;
            if (!validated_properties[i]) {
              // No extra properties allowed
              if (!schema.additionalProperties) {
                errors.push({
                  path: path,
                  property: 'additionalProperties',
                  message: this.translate('error_additional_properties', [i])
                });
                break;
              }
              // Allowed
              else if (schema.additionalProperties === true) {
                break;
              }
              // Must match schema
              // TODO: incompatibility between version 3 and 4 of the spec
              else {
                errors = errors.concat(this._validateSchema(schema.additionalProperties, value[i], path + '.' + i, fullSchemaValue));
              }
            }
          }
        }

        // `dependencies`
        if (schema.dependencies) {
          for (i in schema.dependencies) {
            if (!schema.dependencies.hasOwnProperty(i))
              continue;

            // Doesn't need to meet the dependency
            if (typeof value[i] === "undefined")
              continue;

            // Property dependency
            if (Array.isArray(schema.dependencies[i])) {
              for (j = 0; j < schema.dependencies[i].length; j++) {
                if (typeof value[schema.dependencies[i][j]] === "undefined") {
                  errors.push({
                    path: path,
                    property: 'dependencies',
                    message: this.translate('error_dependency', [schema.dependencies[i][j]])
                  });
                }
              }
            }
            // Schema dependency
            else {
              errors = errors.concat(this._validateSchema(schema.dependencies[i], value, path, fullSchemaValue));
            }
          }
        }
      }

      // Custom type validation
      $each(JSONEditor.defaults.custom_validators, function (i, validator) {
        errors = errors.concat(validator(schema, value, path, fullSchemaValue));
      });
    }
    return errors;
  },
  _checkType: function (type, value) {
    // Simple types
    if (typeof type === "string") {
      if (type === "string")
        return typeof value === "string";
      else if (type === "number")
        return typeof value === "number";
      else if (type === "integer")
        return typeof value === "number" && value === Math.floor(value);
      else if (type === "boolean")
        return typeof value === "boolean";
      else if (type === "array")
        return Array.isArray(value);
      else if (type === "object")
        return value !== null && !(Array.isArray(value)) && typeof value === "object";
      else if (type === "null")
        return value === null;
      else
        return true;
    }
    // Schema
    else {
      return !this._validateSchema(type, value).length;
    }
  }
});
