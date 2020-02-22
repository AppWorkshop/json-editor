JSONEditor.defaults.templates.jexl = function() {
  if(!window.jexl) return false;
  window.jexl.addTransform("_", function (inputObj, lodashFuncName) { // , ...args as 3rd param
    if (window._) {
      if (_.hasOwnProperty(lodashFuncName)) {
        var args = Array.prototype.slice.call(arguments,2);
        return _[lodashFuncName].apply(this, [inputObj].concat(args));
      } else {
        throw new Error("json-editor jexl template: lodash function name '" + lodashFuncName + "' not valid");
      }
    } else {
      throw new Error("json-editor jexl template: Lodash not found");
    }
  });

  // allows 0|moment('new') or "<DateObj>|moment('format','DD MMM YYYY')"
  window.jexl.addTransform("moment", function (inputObj, momentFnName) { // , ...args as 3rd param
    if (window.moment) {
      if ("new" === momentFnName) {
        if (typeof inputObj === "number") {
          return window.moment(inputObj);
        } else if ((typeof inputObj === "string" || typeof inputObj === "object") && inputObj.length > 0) {
          return window.moment(inputObj);
        } else {
          return window.moment();
        }
      } else { // lets assume the input is a valid moment (or something we can pass to moment constructor)
        var momentInst = window.moment(inputObj);
        if (momentInst.isValid() &&
          momentInst[momentFnName] &&
          typeof momentInst[momentFnName] === "function") {

          var args = Array.prototype.slice.call(arguments, 2);
          return momentInst[momentFnName].apply(momentInst, args);
        } else {
          throw new Error("json-editor jexl template: moment function name '" + momentFnName + "' not valid");
        }
      }
    } else {
      throw new Error("json-editor jexl template: moment not found");
    }
  });

  // parses HH:mm string as a JS time value (like Date.now()) set to 1/1/1970, with the hours and minutes set (secs and
  // ms as 00).
  window.jexl.addTransform("timeToEpochHHmm", function (HHmmString) { // , ...args as 3rd param
    if (window.moment) {
      if (typeof window.moment.prototype.transform === "function") {
        if (/^[0-2][0-9]:[0-5][0-9]$/.test(HHmmString)) { // if it's a sort-of-valid HH:mm string
          return window.moment(0)
            .transform(HHmmString, "HH:mm")
            .valueOf();
        } // else return undefined
      } else {
        throw new Error("json-editor jexl template: parseHHMAsJSDate requires moment-transform plugin");
      }
    } else {
      throw new Error("json-editor jexl template: parseHHMAsJSDate : moment not found");
    }
  });

  return {
    compile: function(template) {
      // console.log(`called jexl compile(${JSON.stringify(template)})`);
      var compiled = window.jexl.compile(template);

      return function(context) {
        // add '__now' to the context
        var newContext = Object.assign({
          __now: new Date()
        }, context);
        return compiled.evalSync(newContext);
      };
    }
  };
};
