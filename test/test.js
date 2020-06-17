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
                zip: 'zip',
                undeliverable: 'undeliverable',
                deliverable_missing_unit: 'deliverable_missing_unit',
                deliverable_incorrect_unit: 'deliverable_incorrect_unit',
                deliverable_unnecessary_unit: 'deliverable_unnecessary_unit',
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
        LobAddressElements.strictness = 'normal';
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

        it('should immediately submit a deliverable address requiring no fixes', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.elements.primary.val('185 Berry St Ste 6100');
            LobAddressElements.elements.secondary.val('');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94107-1741');
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(err, null);
                assert.equal(success, true);
            });
        });

        it('should immediately submit a deliverable address when plus4 is the only fix', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.elements.primary.val('185 Berry St Ste 6100');
            LobAddressElements.elements.secondary.val('');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94107');
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(err, null);
                assert.equal(success, true);
            });
        });

        it('should prompt confirmation of a fixed, deliverable address', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.elements.primary.val('185 Berry St Ste 6100');
            LobAddressElements.elements.secondary.val('');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94106'); //this will be changed to 94107-1741
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(success, undefined);
                assert.equal(err.type, 'confirm');
            });
        });

       it('should submit a fixed, deliverable address once confirmed', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.elements.primary.val('185 Berry St Ste 6100');
            LobAddressElements.elements.secondary.val('');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94106'); //this will be changed to 94107-1741
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(success, undefined);
                assert.equal(err.type, 'confirm');
                LobAddressElements.do.verify(function (err, success) {
                    assert.equal(err, null);
                    assert.equal(success, true);
                });
            });
        });

        it('should fix zip, city, and state using the verification object', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_missing_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.elements.primary.val('185 Berry St');
            LobAddressElements.elements.city.val(''); //this will change to San Francisco
            LobAddressElements.elements.state.val(''); //this will change to CA
            LobAddressElements.elements.zip.val('94106'); //this will change to 94107-5705
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(LobAddressElements.elements.zip.val(), APIMock.deliverable_missing_unit.components.zip_code + "-" + APIMock.deliverable_missing_unit.components.zip_code_plus_4);
                assert.equal(LobAddressElements.elements.city.val(), APIMock.deliverable_missing_unit.components.city);
                assert.equal(LobAddressElements.elements.state.val(), APIMock.deliverable_missing_unit.components.state);
            });
        });
    });


    describe('#US Verification | Strict Mode', function () {

        it('should never allow an undeliverable address to be submitted', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.undeliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'strict';
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
            LobAddressElements.strictness = 'strict';
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

        it('should never allow a deliverable address with an incorrect unit to be submitted', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_incorrect_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'strict';
            //configure a deliverable address with an incorrect unit
            LobAddressElements.elements.primary.val('185 Berry St');
            LobAddressElements.elements.secondary.val('Apt 1');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94107');
            //verify
            LobAddressElements.do.verify(function (err, success) {
                //error
                assert.equal(success, undefined);
                assert.equal(err.type, 'deliverable_incorrect_unit');
                //warn
                LobAddressElements.do.message(err);
                assert.equal(LobAddressElements.elements.message.text(), 'deliverable_incorrect_unit');
                //verify once more
                LobAddressElements.do.verify(function (err, success) {
                    //still error
                    assert.equal(success, undefined);
                    assert.equal(err.type, 'deliverable_incorrect_unit');
                    //try one last time
                    LobAddressElements.do.verify(function (err, success) {
                        //still error
                        assert.equal(success, undefined);
                        assert.equal(err.type, 'deliverable_incorrect_unit');
                    });
                });
            });
        });

        it('should never allow a deliverable address with an unnecessary unit to be submitted', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_unnecessary_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'strict';
            //configure a deliverable address with an unnecessary unit
            LobAddressElements.elements.primary.val('3230 P ST NW');
            LobAddressElements.elements.secondary.val('APT 2');
            LobAddressElements.elements.city.val('Washington');
            LobAddressElements.elements.state.val('DC');
            LobAddressElements.elements.zip.val('20007');
            //verify
            LobAddressElements.do.verify(function (err, success) {
                //error
                assert.equal(success, undefined);
                assert.equal(err.type, 'deliverable_unnecessary_unit');
                //warn
                LobAddressElements.do.message(err);
                assert.equal(LobAddressElements.elements.message.text(), 'deliverable_unnecessary_unit');
                //verify once more
                LobAddressElements.do.verify(function (err, success) {
                    //still error
                    assert.equal(success, undefined);
                    assert.equal(err.type, 'deliverable_unnecessary_unit');
                    //try one last time
                    LobAddressElements.do.verify(function (err, success) {
                        //still error
                        assert.equal(success, undefined);
                        assert.equal(err.type, 'deliverable_unnecessary_unit');
                    });
                });
            });
        });
    });


    describe('#US Verification | Normal Mode', function () {

        it('should never allow an undeliverable address to be submitted', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.undeliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'normal'; //(default)
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

        it('should warn then allow a deliverable address with a missing unit to be submitted', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_missing_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'normal'; //(default)
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
 
        it('should warn then allow a deliverable address with an incorrect unit to be submitted', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_incorrect_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'normal'; //(default)
            //configure a deliverable address with an incorrect unit
            LobAddressElements.elements.primary.val('185 Berry St');
            LobAddressElements.elements.secondary.val('Apt 1');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94107');
            //verify
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(success, undefined);
                assert.equal(err.type, 'deliverable_incorrect_unit');
                //warn
                LobAddressElements.do.message(err);
                assert.equal(LobAddressElements.elements.message.text(), 'deliverable_incorrect_unit');
                //verify once more
                LobAddressElements.do.verify(function (err, success) {
                    //success
                    assert.equal(success, true);
                    assert.equal(err, null);
                });
            });
        });
 
        it('should warn then allow a deliverable address with an unnecessary unit to be submitted', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_unnecessary_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'normal'; //(default)
            //configure a deliverable address with an unnecessary unit
            LobAddressElements.elements.primary.val('3230 P ST NW');
            LobAddressElements.elements.secondary.val('APT 2');
            LobAddressElements.elements.city.val('Washington');
            LobAddressElements.elements.state.val('DC');
            LobAddressElements.elements.zip.val('20007');
            //verify
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(success, undefined);
                assert.equal(err.type, 'deliverable_unnecessary_unit');
                //warn
                LobAddressElements.do.message(err);
                assert.equal(LobAddressElements.elements.message.text(), 'deliverable_unnecessary_unit');
                //verify once more
                LobAddressElements.do.verify(function (err, success) {
                    //success
                    assert.equal(success, true);
                    assert.equal(err, null);
                });
            });
        });
    });


    describe('#US Verification | Relaxed Mode', function () {

        it('should warn then allow an undeliverable address to be submitted', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.undeliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'relaxed';
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
            LobAddressElements.strictness = 'relaxed';
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
 
        it('should warn then allow a deliverable address with an incorrect unit to be submitted', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_incorrect_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'relaxed';
            //configure a deliverable address with an incorrect unit
            LobAddressElements.elements.primary.val('185 Berry St');
            LobAddressElements.elements.secondary.val('Apt 1');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94107');
            //verify
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(success, undefined);
                assert.equal(err.type, 'deliverable_incorrect_unit');
                //warn
                LobAddressElements.do.message(err);
                assert.equal(LobAddressElements.elements.message.text(), 'deliverable_incorrect_unit');
                //verify once more
                LobAddressElements.do.verify(function (err, success) {
                    //success
                    assert.equal(success, true);
                    assert.equal(err, null);
                });
            });
        });
 
        it('should warn then allow a deliverable address with an unnecessary unit to be submitted', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_unnecessary_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'relaxed';
            //configure a deliverable address with an unnecessary unit
            LobAddressElements.elements.primary.val('3230 P ST NW');
            LobAddressElements.elements.secondary.val('APT 2');
            LobAddressElements.elements.city.val('Washington');
            LobAddressElements.elements.state.val('DC');
            LobAddressElements.elements.zip.val('20007');
            //verify
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(success, undefined);
                assert.equal(err.type, 'deliverable_unnecessary_unit');
                //warn
                LobAddressElements.do.message(err);
                assert.equal(LobAddressElements.elements.message.text(), 'deliverable_unnecessary_unit');
                //verify once more
                LobAddressElements.do.verify(function (err, success) {
                    //success
                    assert.equal(success, true);
                    assert.equal(err, null);
                });
            });
        });
    });


    describe('#US Verification | Passthrough Mode', function () {

        it('should warn and immediately submit an undeliverable address', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.undeliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'passthrough';
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
                //submit
                assert.equal(LobAddressElements.submit, true);
            });
        });

        it('should warn and immediately submit a deliverable address with a missing unit', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_missing_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'passthrough';
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
                //submit
                assert.equal(LobAddressElements.submit, true);
            });
        });
 
        it('should warn and immediately submit a deliverable address with an incorrect unit', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_incorrect_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'passthrough';
            //configure a deliverable address with an incorrect unit
            LobAddressElements.elements.primary.val('185 Berry St');
            LobAddressElements.elements.secondary.val('Apt 1');
            LobAddressElements.elements.city.val('San Francisco');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94107');
            //verify
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(success, undefined);
                assert.equal(err.type, 'deliverable_incorrect_unit');
                //warn
                LobAddressElements.do.message(err);
                assert.equal(LobAddressElements.elements.message.text(), 'deliverable_incorrect_unit');
                //submit
                assert.equal(LobAddressElements.submit, true);
            });
        });
 
        it('should warn and immediately submit a deliverable address with an unnecessary unit', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_unnecessary_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'passthrough';
            //configure a deliverable address with an unnecessary unit
            LobAddressElements.elements.primary.val('3230 P ST NW');
            LobAddressElements.elements.secondary.val('APT 2');
            LobAddressElements.elements.city.val('Washington');
            LobAddressElements.elements.state.val('DC');
            LobAddressElements.elements.zip.val('20007');
            //verify
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(success, undefined);
                assert.equal(err.type, 'deliverable_unnecessary_unit');
                //warn
                LobAddressElements.do.message(err);
                assert.equal(LobAddressElements.elements.message.text(), 'deliverable_unnecessary_unit');
                //submit
                assert.equal(LobAddressElements.submit, true);
            });
        });
    });


    describe('#US Verification | Lob.com Proxy', function () {

        it('should parse a successful response when proxied through Lob.com', function () {
            var xhr_config = { responseText: JSON.stringify(APIMock.deliverable_proxied) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'strict';
            LobAddressElements.elements.primary.val('210 KING ST');
            LobAddressElements.elements.secondary.val('');
            LobAddressElements.elements.city.val('SAN FRANCISCO');
            LobAddressElements.elements.state.val('CA');
            LobAddressElements.elements.zip.val('94107-1702');
            //verify
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(success, true);
                assert.equal(err, null);
            });
        });

        it('should parse an unsuccessful response when proxied through Lob.com', function () {
            //the proxy always returns a 200 status error code
            var xhr_config = { responseText: JSON.stringify(APIMock.invalid_proxied) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.strictness = 'passthrough';
            //configure a deliverable address with a missing unit
            LobAddressElements.elements.primary.val('185 Berry St');
            LobAddressElements.elements.secondary.val('');
            LobAddressElements.elements.city.val('');
            LobAddressElements.elements.state.val('');
            LobAddressElements.elements.zip.val('');
            //verify
            LobAddressElements.do.verify(function (err, success) {
                assert.equal(success, undefined);
                assert.equal(err.type, 'city_state_zip');
                //warn
                LobAddressElements.do.message(err);
                assert.equal(LobAddressElements.elements.message.text(), 'city_state_zip');
            });
        });
    });
});