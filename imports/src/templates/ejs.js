JSONEditor.defaults.templates.ejs = function() {
  if(!window.EJS) return false;

  return {
    compile: function(template) {
      // we need to also handle handlebars-like templates e.g.:
      // template = "blah blah {{self}} blah", context = { self: "value" }
      // we can use lodash for that.

      // first, check if the template doesn't have any "<%" string and has a "{{" string
      if (window._ && template.indexOf("<%") === -1 && template.indexOf("{{") !== -1) {
        _.templateSettings = {
          interpolate: /\{\{(.+?)\}\}/g
        };
        return _.template(template);
      } else {
        // use EJS
        var compiled = window.EJS.compile(template);

        return function (context) {
          // console.log("EJS: template: " + template + ", context: " + JSON.stringify(context) );
          context.__now = new Date();
          context._ = window._;
          context.moment = window.moment;
          return compiled(context);
        };
      }
    }
  };
};
