JSONEditor.defaults.editors.integer = JSONEditor.defaults.editors.number.extend({
  build: function () {
    this._super();
    this.input.setAttribute("inputmode","numeric");
  },
  sanitize: function(value) {
    value = value + "";
    return value.replace(/[^0-9\-]/g,'');
  },
  getNumColumns: function() {
    return 2;
  }
});
