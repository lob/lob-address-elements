const assert = require('assert');
const JQMock = require('./mock/JQuery.js');
const XHRMock = require('./mock/XHR.js');
const APIMock = require('./mock/LobAPIs.js');

describe('Address Elements', function () {
    let refs, LobAddressElements;

    before(function () {
        refs = {
            window: global.window,
            XMLHttpRequest: global.XMLHttpRequest,
            btoa: global.btoa
        };
        global.window = { jQuery: JQMock };
        global.btoa = function () { };
        //NOTE: `elements` and `styles` can also be tested by mocking here as well
        global.window.LobAddressElementsConfig = {
            messages: {
                primary_line: 'primary_line',
                city_state_zip: 'city_state_zip',
                undeliverable: 'undeliverable',
                deliverable_missing_unit: 'deliverable_missing_unit',
                confirm: 'confirm',
                DEFAULT: 'DEFAULT'
            }
        }
        require('../src/lob-address-elements.js');
        LobAddressElements = global.window.LobAddressElements;
    });

    after(function () {
        for (var p in refs) {
            global[p] = refs[p];
        }
    });

    afterEach(function () {
        delete LobAddressElements.confirmed;
        delete LobAddressElements.address;
        LobAddressElements.strict = true;
        LobAddressElements.elements.primary.val('');
        LobAddressElements.elements.secondary.val('');
        LobAddressElements.elements.city.val('');
        LobAddressElements.elements.state.val('');
        LobAddressElements.elements.zip.val('');
    });

    describe('#US Autocompletion', function () {

        it('should return a suggestion for alphanumeric entries', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.suggestions) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.do.autocomplete('185 Berry', function (suggestions) {
                assert.equal(suggestions.length, 1);
            });
        });

        it('should return a suggestion for numeric entries', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.suggestions) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.do.autocomplete('185', function (suggestions) {
                assert.equal(suggestions.length, 1);
            });
        });

        it('should return a suggestion for alpha entries', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.suggestions) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.do.autocomplete('Berry', function (suggestions) {
                assert.equal(suggestions.length, 1);
            });
        });

        it('should return no suggestions for empty entries', function () {
            LobAddressElements.do.autocomplete('', function (suggestions) {
                assert.equal(suggestions, null);
            });
        });

        it('should return no suggestions when x-rate-limit is exceeded', function () {
            var xhr_config = { status: 401 };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.do.autocomplete('185 Berry', function (suggestions) {
                assert.equal(suggestions, null);
            });
        });

        it('should update primary, city, state, and zip fields when applying the suggestion', function () {
            //the suggestion object structure as returned from Lob
            const suggestion = {
                primary_line: 'primary_line_response',
                city: 'city_response',
                state: 'state_response',
                zip_code: 'zip_code_response'
            }
            LobAddressElements.do.apply(suggestion);
            assert.equal(LobAddressElements.elements.primary.val(), 'primary_line_response');
            assert.equal(LobAddressElements.elements.city.val(), 'city_response');
            assert.equal(LobAddressElements.elements.state.val(), 'state_response');
            assert.equal(LobAddressElements.elements.zip.val(), 'zip_code_response');
        });

        it('should clear the secondary field when applying the suggestion', function () {
            //the suggestion object structure as returned from Lob
            const suggestion = {
                primary_line: 'primary_line_response',
                city: 'city_response',
                state: 'state_response',
                zip_code: 'zip_code_response'
            }
            LobAddressElements.elements.secondary.val("STALE VALUE");
            assert.equal(LobAddressElements.elements.secondary.val(), 'STALE VALUE');
            LobAddressElements.do.apply(suggestion);
            assert.equal(LobAddressElements.elements.secondary.val(), '');
        });
    });


    describe('#US Verification', function () {

        it('should update the zip using the verification object', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_missing_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.elements.primary.val('185 Berry St');
            LobAddressElements.elements.zip.val('94106'); //this will change to 94107
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(LobAddressElements.elements.zip.val(), APIMock.deliverable_missing_unit.components.zip_code);
            });
        });

        it('should update city and state using the verification object', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_missing_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.elements.primary.val('185 Berry St');
            LobAddressElements.elements.city.val(''); //this will change to San Francisco
            LobAddressElements.elements.state.val(''); //this will change to CA
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(LobAddressElements.elements.city.val(), APIMock.deliverable_missing_unit.components.city);
                assert.equal(LobAddressElements.elements.state.val(), APIMock.deliverable_missing_unit.components.state);
            });
        });

        it('should immediately submit a deliverable address requiring no updates', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.elements.primary.val('185 Berry St');
            LobAddressElements.elements.secondary.val('Ste 6100');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94107');
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(err, null);
                assert.equal(success, true);
            });
        });

       it('should prompt confirmation of an updated, deliverable address', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.elements.primary.val('185 Berry St');
            LobAddressElements.elements.secondary.val('Ste 6100');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94106'); //this will be changed to 94107, requirig confirmation
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(success, undefined);
                assert.equal(err.type, 'confirm');
            });
        });

        it('should submit an updated, deliverable address once confirmed', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.elements.primary.val('185 Berry St');
            LobAddressElements.elements.secondary.val('Ste 6100');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94106'); //this will be changed to 94107, requirig confirmation
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(success, undefined);
                assert.equal(err.type, 'confirm');
                LobAddressElements.do.verify(function (err, success) {
                    assert.equal(err, null);
                    assert.equal(success, true);
                });
            });
        });
    });


    describe('#US Verification | Strict Mode', function () {

        it('should never allow an undeliverable address to be submitted', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.undeliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            //enforce strict mode
            LobAddressElements.strict = true;
            //configure an undeliverable address
            LobAddressElements.elements.primary.val('55XXX AVE');
            LobAddressElements.elements.secondary.val('');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94107');
            //verify
            LobAddressElements.do.verify(function (err, success) {
                //error
                assert.equal(success, undefined);
                assert.equal(err.type, 'undeliverable');
                //warn
                LobAddressElements.do.message(err);
                assert.equal(LobAddressElements.elements.message.text(), 'undeliverable');
                //verify once more
                LobAddressElements.do.verify(function (err, success) {
                    //still error
                    assert.equal(success, undefined);
                    assert.equal(err.type, 'undeliverable');
                    //try one last time
                    LobAddressElements.do.verify(function (err, success) {
                        //still error
                        assert.equal(success, undefined);
                        assert.equal(err.type, 'undeliverable');
                    });
                });
            });
        });

        it('should never allow a deliverable address with a missing unit to be submitted', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_missing_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            //enforce strict mode
            LobAddressElements.strict = true;
            //configure a deliverable address with a missing unit
            LobAddressElements.elements.primary.val('185 Berry S');
            LobAddressElements.elements.secondary.val('');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94107');
            //verify
            LobAddressElements.do.verify(function (err, success) {
                //error
                assert.equal(success, undefined);
                assert.equal(err.type, 'deliverable_missing_unit');
                //warn
                LobAddressElements.do.message(err);
                assert.equal(LobAddressElements.elements.message.text(), 'deliverable_missing_unit');
                //verify once more
                LobAddressElements.do.verify(function (err, success) {
                    //still error
                    assert.equal(success, undefined);
                    assert.equal(err.type, 'deliverable_missing_unit');
                    //try one last time
                    LobAddressElements.do.verify(function (err, success) {
                        //still error
                        assert.equal(success, undefined);
                        assert.equal(err.type, 'deliverable_missing_unit');
                    });
                });
            });
        });
    });


    describe('#US Verification | Warn Mode', function () {

        it('should warn, then allow an undeliverable address to be submitted', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.undeliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            //disable strict mode and configure an undeliverale address
            LobAddressElements.strict = false;
            LobAddressElements.elements.primary.val('55XXX AVE');
            LobAddressElements.elements.secondary.val('');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94107');
            //verify
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(success, undefined);
                assert.equal(err.type, 'undeliverable');
                //warn
                LobAddressElements.do.message(err);
                assert.equal(LobAddressElements.elements.message.text(), 'undeliverable');
                //verify once more
                LobAddressElements.do.verify(function (err, success) {
                    //success
                    assert.equal(success, true);
                    assert.equal(err, null);
                });
            });
        });

        it('should warn then allow a deliverable address with a missing unit to be submitted', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_missing_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            //disable strict mode
            LobAddressElements.strict = false;
            //configure a deliverable address with a missing unit
            LobAddressElements.elements.primary.val('185 Berry St');
            LobAddressElements.elements.secondary.val('');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94107');
            //verify
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(success, undefined);
                assert.equal(err.type, 'deliverable_missing_unit');
                //warn
                LobAddressElements.do.message(err);
                assert.equal(LobAddressElements.elements.message.text(), 'deliverable_missing_unit');
                //verify once more
                LobAddressElements.do.verify(function (err, success) {
                    //success
                    assert.equal(success, true);
                    assert.equal(err, null);
                });
            });
        });
    });
});