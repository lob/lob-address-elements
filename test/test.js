const chai = require('chai');
const jsdom = require('jsdom');
const spies = require('chai-spies');
const { expect } = require('chai');
const XHRMock = require('./mock/XHR.js');
const APIMock = require('./mock/LobAPIs.js');

chai.use(spies);

describe('Address Elements', () => {
    let emit, refs, LobAddressElements, spy;

    before(() => {
        const { JSDOM } = jsdom;
        refs = {
            window: global.window,
            XMLHttpRequest: global.XMLHttpRequest,
            btoa: global.btoa
        };
        return JSDOM.fromFile('examples/vanilla_css_styles.html', { url: 'http://localhost'}).then(dom => {
            global.window = { ...dom.window };
            global.document = dom.window.document;
            global.btoa = function () { };

            global.$ = global.jQuery = require('jquery');
            global.window.jQuery = global.jQuery;
            global.window.jQuery.fn.autocomplete = require('jquery-ui');

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
            require('../src/main.js');
            LobAddressElements = global.window.LobAddressElements;

            ({ emit } = window._virtualConsole);
        });
    });

    beforeEach(() => {
        spy = chai.spy.on(LobAddressElements, 'verifyCallback');
        // Disable warnings about submit function missing
        // https://github.com/jsdom/jsdom/issues/1937#issuecomment-526162324
        window._virtualConsole.emit = () => {};
    });

    after(() => {
        window._virtualConsole.emit = emit;
        for (let p in refs) {
            global[p] = refs[p];
        }
    });

    afterEach(() => {
        delete LobAddressElements.confirmed;
        delete LobAddressElements.address;
        LobAddressElements.config.strictness = 'normal';
        LobAddressElements.config.elements.primary.val('');
        LobAddressElements.config.elements.secondary.val('');
        LobAddressElements.config.elements.city.val('');
        LobAddressElements.config.elements.state.val('');
        LobAddressElements.config.elements.zip.val('');
        chai.spy.restore();
    });

    describe('#US Autocompletion', () => {
        it('should return a suggestion for alphanumeric entries', () => {
            const xhr_config = { responseText: JSON.stringify(APIMock.suggestions) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.autocomplete('185 Berry', suggestions => {
                expect(suggestions).to.have.lengthOf(1);
            });
        });

        it('should return a suggestion for numeric entries', () => {
            const xhr_config = { responseText: JSON.stringify(APIMock.suggestions) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.autocomplete('185', suggestions => {
                expect(suggestions).to.have.lengthOf(1);
            });
        });

        it('should return a suggestion for alpha entries', () => {
            const xhr_config = { responseText: JSON.stringify(APIMock.suggestions) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.autocomplete('Berry', suggestions => {
                expect(suggestions).to.have.lengthOf(1);
            });
        });

        it('should return no suggestions for empty entries', () => {
            LobAddressElements.autocomplete('', suggestions => {
                expect(suggestions).equals(null);
            });
        });

        it('should return no suggestions when x-rate-limit is exceeded', () => {
            const xhr_config = { status: 401 };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.autocomplete('185 Berry', suggestions => {
                expect(suggestions).equals(null);
            });
        });

        it('should update primary, city, state, and zip fields when applying the suggestion', () => {
            //the suggestion object structure as returned from Lob
            const suggestion = {
                primary_line: 'primary_line_response',
                city: 'city_response',
                state: 'state_response',
                zip_code: 'zip_code_response'
            }
            LobAddressElements.applySuggestion(suggestion);
            expect(LobAddressElements.config.elements.primary.val()).equals('primary_line_response');
            expect(LobAddressElements.config.elements.city.val()).equals('city_response');
            expect(LobAddressElements.config.elements.state.val()).equals('state_response');
            expect(LobAddressElements.config.elements.zip.val()).equals('zip_code_response');
        });

        it('should clear the secondary field when applying the suggestion', () => {
            //the suggestion object structure as returned from Lob
            const suggestion = {
                primary_line: 'primary_line_response',
                city: 'city_response',
                state: 'state_response',
                zip_code: 'zip_code_response'
            }
            LobAddressElements.config.elements.secondary.val("STALE VALUE");
            expect(LobAddressElements.config.elements.secondary.val()).equals('STALE VALUE');
            LobAddressElements.applySuggestion(suggestion);
            expect(LobAddressElements.config.elements.secondary.val()).equals('');
        });
    });


    describe('#US Verification', () => {

        it('should submit the form if Lob returns a 401 Invalid Key',()  =>{
          const xhr_config = { status: 401, responseText: JSON.stringify(APIMock.e401) };
          global.XMLHttpRequest = XHRMock(xhr_config);
          LobAddressElements.config.elements.primary.val('185 Berry St Ste 6100');
          LobAddressElements.config.elements.secondary.val('');
          LobAddressElements.config.elements.city.val('San Francisco');
          LobAddressElements.config.elements.state.val('CA');
          LobAddressElements.config.elements.zip.val('94107-1741');
          LobAddressElements.verify((err, success) => {
            expect(err).equals(null);
            expect(success).equals(true);
          });
        });

        it('should immediately submit a deliverable address requiring no fixes', () => {
            const xhr_config = { responseText: JSON.stringify(APIMock.deliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.config.elements.primary.val('185 Berry St Ste 6100');
            LobAddressElements.config.elements.secondary.val('');
            LobAddressElements.config.elements.city.val('San Francisco');
            LobAddressElements.config.elements.state.val('CA');
            LobAddressElements.config.elements.zip.val('94107-1741');
            LobAddressElements.verify((err, success) => {
                expect(err).equals(null);
                expect(success).equals(true);
            });
        });

        it('should immediately submit a deliverable address when plus4 is the only fix', () => {
            const xhr_config = { responseText: JSON.stringify(APIMock.deliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.config.elements.primary.val('185 Berry St Ste 6100');
            LobAddressElements.config.elements.secondary.val('');
            LobAddressElements.config.elements.city.val('San Francisco');
            LobAddressElements.config.elements.state.val('CA');
            LobAddressElements.config.elements.zip.val('94107');
            LobAddressElements.verify((err, success) => {
                expect(err).equals(null);
                expect(success).equals(true);
            });
        });

        it('should prompt confirmation of a fixed, deliverable address', () => {
            const xhr_config = { responseText: JSON.stringify(APIMock.deliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.config.elements.primary.val('185 Berry St Ste 6100');
            LobAddressElements.config.elements.secondary.val('');
            LobAddressElements.config.elements.city.val('San Francisco');
            LobAddressElements.config.elements.state.val('CA');
            LobAddressElements.config.elements.zip.val('94106'); //this will be changed to 94107-1741
            LobAddressElements.verify((err, success) => {
                expect(success).equals(undefined);
                expect(err.type).equals('confirm');
            });
        });

        describe('Did you mean?', () => {
            it('should suggest a deliverable address once confirmed', () => {
                const xhr_config = { responseText: JSON.stringify(APIMock.deliverable) };
                global.XMLHttpRequest = XHRMock(xhr_config);
                LobAddressElements.config.elements.primary.val('185 Berry St Ste 6100');
                LobAddressElements.config.elements.secondary.val('');
                LobAddressElements.config.elements.city.val('San Francisco');
                LobAddressElements.config.elements.state.val('CA');
                LobAddressElements.config.elements.zip.val('94106'); //this will be changed to 94107-1741
                LobAddressElements.verify((err, success) => {
                    expect(success).equals(undefined);
                    expect(err.type).equals('confirm');
                    expect(err.msg).matches(/94107-1741/);

                    LobAddressElements.config.elements.message.click();
                    LobAddressElements.verify((err, success) => {
                        expect(err).equals(null);
                        expect(success).equals(true);
                    });
                });
            });
        });
    });

    /**
     * 
     * @param {String} errorCode - the value returned from the API for an invalid address
     */
    const assertWarningPresentedAndAllAttemptsBlocked = errorCode => {
        // submit form - triggering verification process
        LobAddressElements.config.elements.form.submit();
        expect(spy).to.have.been.called.with({ type: errorCode, msg: errorCode });
        // confirm warning was presented
        expect(LobAddressElements.config.elements.message.text()).equals(errorCode);
        // verify once more
        LobAddressElements.config.elements.form.submit();
        // confirm there is still an error
        expect(spy).to.have.been.called.with({ type: errorCode, msg: errorCode });
        // try verifiing one last time
        LobAddressElements.config.elements.form.submit();
        // still error
        expect(spy).to.have.been.called.with({ type: errorCode, msg: errorCode });

        expect(LobAddressElements.config.submitted).equals(undefined);
    };

    const assertWarningPresentedAndFirstAttemptBlocked = (errorCode, testOverride = true) => {
        // submit form - triggering verification process
        LobAddressElements.config.elements.form.submit();
        expect(spy).to.have.been.called.with({ type: errorCode, msg: errorCode });
        // confirm warning was presented
        expect(LobAddressElements.config.elements.message.text()).equals(errorCode);

        if (testOverride) {
            expect(LobAddressElements.config.override).to.be.true;
        }
        // verify once more
        LobAddressElements.config.elements.form.submit();
        expect(spy).to.have.been.called.with({ type: errorCode, msg: errorCode });
        // confirm submission came to completion
        expect(LobAddressElements.config.submitted).to.be.true;
    };


    describe('#US Verification | Strict Mode', () => {
        it('should never allow a deliverable address with a missing unit to be submitted', () => {
            const errorCode = 'deliverable_missing_unit';
            const xhr_config = { responseText: JSON.stringify(APIMock.deliverable_missing_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.config.strictness = 'strict';
            //configure a deliverable address with a missing unit
            LobAddressElements.config.elements.primary.val('185 Berry S');
            LobAddressElements.config.elements.secondary.val('');
            LobAddressElements.config.elements.city.val('San Francisco');
            LobAddressElements.config.elements.state.val('CA');
            LobAddressElements.config.elements.zip.val('94107');
            
            assertWarningPresentedAndAllAttemptsBlocked(errorCode);
        });
    
        it('should never allow a deliverable address with an incorrect unit to be submitted', () => {
            const errorCode = 'deliverable_incorrect_unit';
            const xhr_config = { responseText: JSON.stringify(APIMock.deliverable_incorrect_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.config.strictness = 'strict';
            //configure a deliverable address with an incorrect unit
            LobAddressElements.config.elements.primary.val('185 Berry St');
            LobAddressElements.config.elements.secondary.val('Apt 1');
            LobAddressElements.config.elements.city.val('San Francisco');
            LobAddressElements.config.elements.state.val('CA');
            LobAddressElements.config.elements.zip.val('94107');
    
            assertWarningPresentedAndAllAttemptsBlocked(errorCode);
        });
    
        it('should never allow a deliverable address with an unnecessary unit to be submitted', () => {
            const errorCode = 'deliverable_unnecessary_unit';
            const xhr_config = { responseText: JSON.stringify(APIMock.deliverable_unnecessary_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.config.strictness = 'strict';
            //configure a deliverable address with an unnecessary unit
            LobAddressElements.config.elements.primary.val('3230 P ST NW');
            LobAddressElements.config.elements.secondary.val('APT 2');
            LobAddressElements.config.elements.city.val('Washington');
            LobAddressElements.config.elements.state.val('DC');
            LobAddressElements.config.elements.zip.val('20007');
    
            assertWarningPresentedAndAllAttemptsBlocked(errorCode);
        });
    });


    /**
     * These are common API responses where the address needs a small modification to be deliverable
     * @param {string} strictnessMode - Lob's degree of acceptance for a given address
     */
    const testAlmostDeliverableCases = strictnessMode => {
        // In passthrough mode, the verification response will always be a success so there is
        // nothing to override. We disable the check of the override flag.
        const testOverride = strictnessMode !== 'passthrough';

        it('should warn then allow a deliverable address with a missing unit to be submitted', () => {
            const errorCode = 'deliverable_missing_unit';
            const xhr_config = { responseText: JSON.stringify(APIMock.deliverable_missing_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.config.strictness = strictnessMode;
            //configure a deliverable address with a missing unit
            LobAddressElements.config.elements.primary.val('185 Berry St');
            LobAddressElements.config.elements.secondary.val('');
            LobAddressElements.config.elements.city.val('San Francisco');
            LobAddressElements.config.elements.state.val('CA');
            LobAddressElements.config.elements.zip.val('94107');
            assertWarningPresentedAndFirstAttemptBlocked(errorCode, testOverride);
        });
 
        it('should warn then allow a deliverable address with an incorrect unit to be submitted', () => {
            const errorCode = 'deliverable_incorrect_unit';
            const xhr_config = { responseText: JSON.stringify(APIMock.deliverable_incorrect_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.config.strictness = strictnessMode;
            //configure a deliverable address with an incorrect unit
            LobAddressElements.config.elements.primary.val('185 Berry St');
            LobAddressElements.config.elements.secondary.val('Apt 1');
            LobAddressElements.config.elements.city.val('San Francisco');
            LobAddressElements.config.elements.state.val('CA');
            LobAddressElements.config.elements.zip.val('94107');
            assertWarningPresentedAndFirstAttemptBlocked(errorCode, testOverride);
        });
 
        it('should warn then allow a deliverable address with an unnecessary unit to be submitted', () => {
            const errorCode = 'deliverable_unnecessary_unit';
            const xhr_config = { responseText: JSON.stringify(APIMock.deliverable_unnecessary_unit) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.config.strictness = strictnessMode;
            //configure a deliverable address with an unnecessary unit
            LobAddressElements.config.elements.primary.val('3230 P ST NW');
            LobAddressElements.config.elements.secondary.val('APT 2');
            LobAddressElements.config.elements.city.val('Washington');
            LobAddressElements.config.elements.state.val('DC');
            LobAddressElements.config.elements.zip.val('20007');
            assertWarningPresentedAndFirstAttemptBlocked(errorCode, testOverride);
        });
    } 


    describe('#US Verification | Normal Mode', () => {

        it('should never allow an undeliverable address to be submitted', () => {
            const errorCode = 'undeliverable';
            const xhr_config = { responseText: JSON.stringify(APIMock.undeliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.config.strictness = 'normal';
            //configure an undeliverable address
            LobAddressElements.config.elements.primary.val('55XXX AVE');
            LobAddressElements.config.elements.secondary.val('');
            LobAddressElements.config.elements.city.val('San Francisco');
            LobAddressElements.config.elements.state.val('CA');
            LobAddressElements.config.elements.zip.val('94107');

            assertWarningPresentedAndAllAttemptsBlocked(errorCode);
        });

        testAlmostDeliverableCases('normal');
    });


    describe('#US Verification | Relaxed Mode', () => {
        it('should warn then allow an undeliverable address to be submitted', () => {
            const errorCode = 'undeliverable';
            const xhr_config = { responseText: JSON.stringify(APIMock.undeliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.config.strictness = 'relaxed';
            LobAddressElements.config.elements.primary.val('55XXX AVE');
            LobAddressElements.config.elements.secondary.val('');
            LobAddressElements.config.elements.city.val('San Francisco');
            LobAddressElements.config.elements.state.val('CA');
            LobAddressElements.config.elements.zip.val('94107');
            assertWarningPresentedAndFirstAttemptBlocked(errorCode);
        });

        testAlmostDeliverableCases('relaxed');
    });


    describe('#US Verification | Passthrough Mode', () => {
        it('should warn then allow an undeliverable address to be submitted', () => {
            const errorCode = 'undeliverable';
            const xhr_config = { responseText: JSON.stringify(APIMock.undeliverable) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.config.strictness = 'passthrough';
            LobAddressElements.config.elements.primary.val('55XXX AVE');
            LobAddressElements.config.elements.secondary.val('');
            LobAddressElements.config.elements.city.val('San Francisco');
            LobAddressElements.config.elements.state.val('CA');
            LobAddressElements.config.elements.zip.val('94107');
            assertWarningPresentedAndFirstAttemptBlocked(errorCode, false /* testOverride */);
        });

        testAlmostDeliverableCases('passthrough');
    });


    describe('#US Verification | Lob.com Proxy', () => {

        it('should parse a successful response when proxied through Lob.com', () => {
            const xhr_config = { responseText: JSON.stringify(APIMock.deliverable_proxied) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.config.strictness = 'strict';
            LobAddressElements.config.elements.primary.val('210 KING ST');
            LobAddressElements.config.elements.secondary.val('');
            LobAddressElements.config.elements.city.val('SAN FRANCISCO');
            LobAddressElements.config.elements.state.val('CA');
            LobAddressElements.config.elements.zip.val('94107-1702');
            //verify
            LobAddressElements.verify((err, success) => {
                expect(success).equals(true);
                expect(err).equals(null);
            });
        });

        it('should parse an unsuccessful response when proxied through Lob.com', () => {
            //the proxy always returns a 200 status error code
            const xhr_config = { responseText: JSON.stringify(APIMock.invalid_proxied) };
            global.XMLHttpRequest = XHRMock(xhr_config);
            LobAddressElements.config.strictness = 'passthrough';
            //configure a deliverable address with a missing unit
            LobAddressElements.config.elements.primary.val('185 Berry St');
            LobAddressElements.config.elements.secondary.val('');
            LobAddressElements.config.elements.city.val('');
            LobAddressElements.config.elements.state.val('');
            LobAddressElements.config.elements.zip.val('');
            //verify
            LobAddressElements.verify((err, success) => {
                expect(success).equals(undefined);
                expect(err.type).equals('city_state_zip');
                //warn
                LobAddressElements.showMessage(err);
                expect(LobAddressElements.config.elements.message.text()).equals('city_state_zip');
            });
        });
    });
});