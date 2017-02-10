JSONEditor.defaults.editors.number = JSONEditor.defaults.editors.string.extend({
    sanitize: function (value) {
        return (value + "").replace(/[^0-9\.\-eE]/g, '');
    },
    getNumColumns: function () {
        return 2;
    },
    getValue: function () {
        return this.value * 1;
    },
    build: function () {
        this._super();
        var self = this;

        var eventName = 'focus'; // use onchange for select events, onclick for checkbox
        this.input.addEventListener(eventName, function (e) {
            e.preventDefault();
            e.stopPropagation();
            //When a numeric input is given focus, select all so new values don't prefix the redundant 0, default value
            if (self.schema.format === "number") {
                self.input.select();
            }
        });

    }
});
