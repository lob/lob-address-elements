
/**
 * Mock JQuery
 * @param {string} type - identifies the element in the UI by its type (primary, secondary, zip, form, etc)
 * @param {boolean} should_exist - true if the element is expected to be present in the UI
 */
function JQMock(type, should_exist) {

    /**
     * Mock JQuery Element
     * @param {string} type 
     * @param {boolean} should_exist 
     */
    function JQElm(type, should_exist) {
        this.state = {
            type: type,
            visible: true,
            value: undefined,
            submitted: undefined,
            text: undefined,
            html: undefined,
            parent: undefined,
            config: undefined,
            options: undefined,
            attrs: {},
            events: {}
        };
        this.length = should_exist !== false ? 1 : 0;
        return this;
    }

    JQElm.prototype.on = function (evt, fn) {
        this.state.events[evt] = fn;
        return this;
    };
    JQElm.prototype.off = function (evt) {
        delete this.events[evt];
        return this;
    };
    JQElm.prototype.val = function () {
        if (arguments.length === 0) {
            return this.state.value;
        } else {
            this.state.value = arguments[0];
        }
        return this;
    };
    JQElm.prototype.text = function () {
        if (arguments.length === 0) {
            return this.state.text;
        } else {
            this.state.text = arguments[0];
        }
        return this;
    };
    JQElm.prototype.autocomplete = function (config, options) {
        if (config === 'val') {
            this.state.value = options;
        } else {
            this.state.config = config;
            this.state.options = options;
        }
        return this;
    };
    JQElm.prototype.submit = function () {
        this.state.submitted = true;
        return this;
    };
    JQElm.prototype.prop = function () {
        if (arguments.length === 1) {
            return this.state.attrs[arguments[0]];
        } else {
            this.state.attrs[arguments[0]] = arguments[1];
        }
        return this;
    };
    JQElm.prototype.attr = function () {
        if (arguments.length === 1) {
            return this.state.attrs[arguments[0]];
        } else {
            this.state.attrs[arguments[0]] = arguments[1];
        }
        return this;
    };
    JQElm.prototype.html = function () {
        if (arguments.length === 0) {
            return this.state.html;
        } else {
            this.state.html = arguments[0];
        }
        return this;
    };
    JQElm.prototype.appendTo = function (elm) {
        this.state.parent = elm;
        return this;
    };
    JQElm.prototype.hide = function () {
        this.state.visible = false;
        return this;
    };
    JQElm.prototype.show = function () {
        this.state.visible = true;
        return this;
    };

    return new JQElm(type, should_exist);
};
//bind class methods and return
JQMock._data = function () { return { 'submit': [] }; };
JQMock.fn = { autocomplete: {} };
module.exports = JQMock;