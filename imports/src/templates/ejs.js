JSONEditor.defaults.templates.ejs = function() {
  if(!window.EJS) return false;

  return {
    compile: function(template) {
      var compiled = window.EJS.compile(template);

      return function(context) {
        context.__now = new Date();
        context._ = window._;
        context.moment = window.moment;
        return compiled(context);
      };
    }
  };
};
