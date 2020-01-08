JSONEditor.defaults.templates.jexl = function() {
  if(!window.jexl) return false;
  window.jexl.addTransform("_", function (inputObj, lodashFuncName) { // , ...args as 3rd param
    if (window._) {
      if (_.hasOwnProperty(lodashFuncName)) {
        var args = Array.prototype.slice.call(arguments,2);
        return _[lodashFuncName].apply(this, [inputObj].concat(args));
      }
    } else {
      throw new Error("json-editor jexl template: Lodash not found");
    }
  });

  window.jexl.addTransform("moment", function (inputObj, momentFnName) { // , ...args as 3rd param
    if (window.moment) {
      var momentInst = window.moment(inputObj);
      if (momentInst.isValid() &&
        momentInst[momentFnName] &&
        typeof momentInst[momentFnName] === "function") {

        var args = Array.prototype.slice.call(arguments,2);
        return momentInst[momentFnName].apply(momentInst, args);
      }
    } else {
      throw new Error("json-editor jexl template: moment not found");
    }
  });

  return {
    compile: function(template) {
      // console.log(`called jexl compile(${JSON.stringify(template)})`);
      var compiled = window.jexl.compile(template);

      return function(context) {
        // add '__now' to the context
        // console.log(`called jexl evalSync(${template}, ${JSON.stringify(context)})`);
        var newContext = Object.assign({
          __now: new Date()
        }, context);
        return compiled.evalSync(newContext);
      };
    }
  };
};
