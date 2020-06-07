

/**
 * Mock XMLHTTP requests
 */
function XHRMockConfig(config) {

    function XHRMock() {
        this.readyState = config.readyState || 4;
        this.status = config.status || 200;
        this.responseText = config.responseText || "";
        this.responseHeaders = config.responseHeaders || [];
        this.requestHeaders = [];
    }

    XHRMock.DONE = 4;

    XHRMock.prototype.open = function (url, async) {
        this.url = url;
        this.async = async || true;
    }

    XHRMock.prototype.setRequestHeader = function (nam, val) {
        this.requestHeaders[nam] = val;
    }
    XHRMock.prototype.getResponseHeader = function (nam) {
        return this.responseHeaders[nam];
    }

    XHRMock.prototype.getAllResponseHeaders = function () {
        return this.responseHeaders;
    }

    XHRMock.prototype.send = function (data) {
        this.requestText = data;
        this.onreadystatechange();
    }

    return XHRMock;
}

module.exports = XHRMockConfig;