(function () {

    /**
     * Enriches a standard HTML form by adding two address-related behaviors to the form:
     * 1) US Address autocompletion
     * 2) US Address verification
     * @param {object} $ - jQuery
     * @param {object} cfg - user configuration passed as a JSON file (optional)
     */
    function LobAddressElements($, cfg) {
        var config = {
            api_key: cfg.api_key || $('*[data-lob-key]').attr('data-lob-key'),
            strictness: resolveStrictness(cfg.strictness),
            stylesheet: resolveStyleStrategy(cfg.stylesheet),
            styles: cfg.styles || {
                color: '#666666',
                bgcolor: '#fefefe',
                bordercolor: '#a8a8a8',
                activecolor: '#117ab8',
                activebgcolor: '#eeeeee'
            },
            elements: cfg.elements || {
                form: $('form[data-lob-verify]'),
                message: $('*[data-lob-verify-message]').hide(),
                primary: $('input[data-lob-primary]'),
                primaryMsg: $('*[data-lob-primary-message]').hide(),
                secondary: $('input[data-lob-secondary]'),
                secondaryMsg: $('*[data-lob-secondary-message]').hide(),
                city: $('input[data-lob-city]'),
                cityMsg: $('*[data-lob-city-message]').hide(),
                state: $('*[data-lob-state]'),
                stateMsg: $('*[data-lob-state-message]').hide(),
                zip: $('input[data-lob-zip]'),
                zipMsg: $('*[data-lob-zip-message]').hide()
            },
            messages: cfg.messages || {
                primary_line: 'Enter the Primary address.',
                city_state_zip: 'Enter City and State (or Zip).',
                zip: 'Enter a valid Zip.',
                undeliverable: 'The address could not be verified.',
                deliverable_missing_unit: 'Enter a Suite or Unit.',
                deliverable_unnecessary_unit: 'Suite or Unit unnecessary.',
                deliverable_incorrect_unit: 'Incorrect Unit. Please confirm.',
                notify: 'The address has been standardized.',
                confirm: 'The address has been standardized. Please confirm and resubmit.',
                DEFAULT: 'Unknown Error. The address could not be verified.'
            },
            apis: cfg.apis || {
                verify: 'https://api.lob.com/v1/us_verifications',
                autocomplete: 'https://api.lob.com/v1/us_autocompletions'
            },
            do: {
                init: function() {
                    LobAddressElements($, LobAddressElementsConfig);
                }
            }
        };

        function resolveStrictness(cfg) {
            var values = ['strict', 'normal', 'relaxed', 'passthrough'];
            if (cfg && values.indexOf(cfg) > -1) {
                return cfg;
            } else {
                var attr = $('form[data-lob-verify]').attr('data-lob-verify');
                return attr && values.indexOf(attr) > -1 ? attr : 'normal';
            }
        }

        function resolveStyleStrategy(cfg) {
            return typeof (cfg) !== 'undefined' ?
                !!cfg : $('*[data-lob-suggestion-stylesheet]').length > 0
        }

        function resolveInlineStyle(config, type) {
            return $('*[data-lob-suggestion-' + type + ']').attr('data-lob-suggestion-' + type) || config.styles[type];
        }

        function resolveErrorType(message) {
            if (message === 'primary_line is required or address is required') {
                return 'primary_line';
            } else if (message === 'zip_code is required or both city and state are required') {
                return 'city_state_zip';
            } else if (message === 'zip_code must be in a valid zip or zip+4 format') {
                return 'zip';
            } else if (message in config.messages) {
                return message
            } else {
                return 'DEFAULT';
            }
        }

        /**
         * jQuery event handlers execute in binding order. This prioritizes the most-recent 
         * @param {object} jqElm 
         * @param {*} event_type 
         */
        function prioritizeHandler(jqElm, event_type) {
            var eventList = $._data(jqElm[0], 'events');
            eventList[event_type].unshift(eventList[event_type].pop());
        }

        /**
         * Inject the CSS for styling the dropdown if not overridden
         */
        if (!config.stylesheet) {
            $('<style>')
                .prop('type', 'text/css')
                .html('\
                .algolia-autocomplete {\
                    width: 100%;\
                }\
                .aa-dropdown-menu {\
                    width: 100%;\
                    border: 1px solid ' + resolveInlineStyle(config, 'bordercolor') + ';\
                    border-top: 0;\
                    background-color: ' + resolveInlineStyle(config, 'bgcolor') + ';\
                    overflow: hidden;\
                    border-radius: 0 0 .25rem .25rem;\
                    margin-top:-5px;\
                }\
                .aa-suggestion {\
                    cursor: pointer;\
                    padding: 6px 12px;\
                    color: ' + resolveInlineStyle(config, 'color') + ';\
                }\
                .aa-suggestion:hover,\
                .aa-suggestion:active,\
                .aa-suggestion.aa-cursor  {\
                    color: ' + resolveInlineStyle(config, 'activecolor') + ';\
                    background-color: ' + resolveInlineStyle(config, 'activebgcolor') + ';\
                }\
                .aa-suggestion div {\
                    white-space: nowrap !important;\
                    overflow: hidden;\
                    text-overflow: ellipsis;\
                }\
                .aa-suggestion span {\
                    font-size: .8em;\
                }')
                .appendTo('head');
        }

        /**
         * Enable address autocompletion
         */
        if (config.elements.primary.length &&
            config.elements.primary.attr('data-lob-primary') !== 'false') {

            /**
             * query Lob for autocomplete suggestions
             * @param {string} query - what the user just keyed into the autocomplete input
             * @param {function} cb - callback
             */
            config.do.autocomplete = function (query, cb) {
                if (query.match(/[A-Za-z0-9]/)) {
                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', config.apis.autocomplete, true);
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    if (config.api_key) {
                        xhr.setRequestHeader('Authorization', 'Basic ' + btoa(config.api_key + ':'));
                    }
                    xhr.onreadystatechange = function () {
                        if (this.readyState === XMLHttpRequest.DONE) {
                            if (this.status === 200) {
                                try {
                                    var data = JSON.parse(xhr.responseText);
                                    cb(data.suggestions);
                                } catch (e) {
                                    cb(null);
                                }
                            } else {
                                cb(null);
                            }
                        }
                    }
                    xhr.send(JSON.stringify({
                        address_prefix: query,
                        city: config.elements.city.val(),
                        zip_code: config.elements.zip.val(),
                        state: config.elements.state.val(),
                        geo_ip_sort: true
                    }));
                }
                return false;
            }

            /**
             * Project the chosen suggested address into the UI
             * @param {object} suggestion - as returned from the Lob API
             */
            config.do.apply = function (suggestion) {
                config.elements.primary.autocomplete('val', suggestion.primary_line);
                config.elements.secondary.val('');
                config.elements.city.val(suggestion.city);
                config.elements.state.val(suggestion.state);
                config.elements.zip.val(suggestion.zip_code);
            }

            /**
             * configure the Algolia Autocomplete plugin
             */
            config.elements.primary.autocomplete(
                {
                    hint: false
                },
                {
                    source: config.do.autocomplete,
                    templates: {
                        suggestion: function (suggestion) {
                            var suggestionElement = $('<div></div>');
                            var suggestionSpan = $('<span></span>');
                            suggestionElement.text(suggestion.primary_line + ' ');
                            suggestionSpan.text(suggestion.city + ', ' + suggestion.state + ' ' + suggestion.zip_code);
                            suggestionElement.append(suggestionSpan);
                            return suggestionElement;
                        }
                    },
                    cache: false
                }).on('autocomplete:selected', function (event, suggestion) {
                    config.do.apply(suggestion);
                });
        }

        /**
         * Enable pre-submission address verification
         */
        if (config.elements.form.length && (config.strictness === 'passthrough' || config.elements.message.length)) {

            function plus4(components) {
                var parts = [];
                if (components.zip_code) {
                    parts.push(components.zip_code);
                }
                if (components.zip_code_plus_4) {
                    parts.push(components.zip_code_plus_4);
                }
                return parts.length ? parts.join("-") : '';
            }

            /**
             * Called after Lob verifies an address. Improves/updates and caches
             * @param {object} data - verified address object returned from Lob
             */
            function fixAndSave(data) {
                var didFix;
                var address = config.address = {
                    primary: data.primary_line,
                    secondary: data.secondary_line,
                    city: data.components && data.components.city || '',
                    state: data.components && data.components.state || '',
                    zip: plus4(data.components)
                }
                for (var p in address) {
                    if (address.hasOwnProperty(p)) {
                        if (address[p].toUpperCase() != config.elements[p].val().toUpperCase() &&
                            !(p === 'zip' && config.elements[p].val().length === 5 && address[p].indexOf(config.elements[p].val()) == 0)) {
                            didFix = true;
                        }
                        config.elements[p].val(address[p]);
                    }
                }
                return didFix;
            }

            /**
             * A user is assumed to have 'confirmed' an errant submission
             * when they submit the same form values twice in a row. If
             * passthrough mode, confirmation is unnecessary
             */
            function isConfirmation() {
                if (config.strictness !== 'passthrough' && config.address) {
                    for (var p in config.address) {
                        if (config.address.hasOwnProperty(p) &&
                            config.elements[p].val().toUpperCase() !== config.address[p].toUpperCase()) {
                            return false;
                        }
                    }
                    return true;
                }
                return false;
            }

            /**
             * Returns true if the verification check with Lob has succeeded.
             * NOTE: If the API endpoint is unavailable (status 0), return success.
             * @param {object} data - Lob API server response
             * @param {object} config - Address Element configuration
             * @param {number} status - HTTP status code
             */
            function isVerified(data, config, status) {
                var didImprove = fixAndSave(data);
                return !status ||
                    (data.deliverability === 'deliverable' && !didImprove) ||
                    (data.deliverability === 'undeliverable' && config.confirmed && config.strictness === 'relaxed') ||
                    (data.deliverability === 'deliverable_missing_unit' && config.confirmed && config.strictness !== 'strict') ||
                    (data.deliverability === 'deliverable_unnecessary_unit' && config.confirmed && config.strictness !== 'strict') ||
                    (data.deliverability === 'deliverable_incorrect_unit' && config.confirmed && config.strictness !== 'strict')
            }

            function parseJSON(s) {
                try {
                    return JSON.parse(s);
                } catch (e) {
                    console.log('ERR', e);
                    return { error: { message: 'DEFAULT' } };
                }
            }

            function hideMessages() {
                config.elements.message.hide();
                config.elements.primaryMsg.hide();
                config.elements.secondaryMsg.hide();
                config.elements.cityMsg.hide();
                config.elements.stateMsg.hide();
                config.elements.zipMsg.hide();
            }

            /**
             * Show form- and field-level error messages as cofigured. Verification did NOT succeed.
             * @param {object} err - Verification error object representing a Lob error type
             * @param {string} err.msg - Top-level message to show for the form
             * @param {string} err.type - Specific error type to apply at field level if relevant
             */
            config.do.message = function (err) {
                if (err) {
                    config.elements.message.text(err.msg).show('slow');
                    messageTypes[err.type] && messageTypes[err.type](config.messages[err.type]);
                }
            }

            var messageTypes = {
                primary_line: function (msg) {
                    config.elements.primaryMsg.text(msg).show('slow');
                },
                city_state_zip: function (msg) {
                    config.elements.cityMsg.text(msg).show('slow');
                    config.elements.stateMsg.text(msg).show('slow');
                    config.elements.zipMsg.text(msg).show('slow');
                },
                zip: function (msg) {
                    config.elements.zipMsg.text(msg).show('slow');
                },
                deliverable_missing_unit: function (msg) {
                    config.elements.primaryMsg.text(msg).show('slow');
                },
                deliverable_unnecessary_unit: function (msg) {
                    config.elements.primaryMsg.text(msg).show('slow');
                },
                deliverable_incorrect_unit: function (msg) {
                    config.elements.primaryMsg.text(msg).show('slow');
                }
            };

            /**
             * Calls the Lob.com US Verification API. If successful, the user's form will be submitted by 
             * the cb handler to its original endpoint. If unsuccessful, an error message will be shown.
             * @param {function} cb - process the response (submit the form or show an error message)
             */
            config.do.verify = function (cb) {
                config.submit = config.strictness === 'passthrough';
                config.confirmed = isConfirmation();
                var xhr = new XMLHttpRequest();
                xhr.open('POST', config.apis.verify, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                if (config.api_key) {
                    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(config.api_key + ':'));
                }
                xhr.onreadystatechange = function () {
                    if (this.readyState === XMLHttpRequest.DONE) {
                        var data = parseJSON(xhr.responseText);
                        if ((!this.status || this.status === 200) && (!data.statusCode || data.statusCode === 200)) {
                            data = data && data.body || data;
                            if (isVerified(data, config, this.status)) {
                                //SUCCESS (time for final submit)
                                cb(null, true);
                            } else if (data.deliverability === 'deliverable' && config.strictness === 'passthrough') {
                                //IMPROVEMENT (notify user of Lob's improvements)
                                cb({ msg: config.messages.notify, type: 'notify' });
                            } else if (data.deliverability === 'deliverable') {
                                //IMPROVEMENT (ask user to confirm Lob's improvements)
                                cb({ msg: config.messages.confirm, type: 'confirm' });
                            } else {
                                //KNOWN VERIFICATION ERROR (e.g., undeliverable)
                                var type = resolveErrorType(data.deliverability);
                                cb({ msg: config.messages[type], type: type });
                            }
                        } else {
                            data = data && data.body || data;
                            //KNOWN SYSTEM ERROR (e.g., rate limit exceeded, primary line missing)
                            var type = resolveErrorType(data.error.message);
                            cb({ msg: config.messages[type], type: type });
                        }
                    }
                }
                xhr.send(JSON.stringify({
                    primary_line: config.elements.primary.val(),
                    secondary_line: config.elements.secondary.val(),
                    city: config.elements.city.val(),
                    state: config.elements.state.val(),
                    zip_code: config.elements.zip.val()
                }));
                return false;
            }

            config.elements.form.on('submit', function preFlight(e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                hideMessages();
                return config.do.verify(function (err, success) {
                    if (config.submit) {
                        config.do.message(err);
                        config.elements.form.off('submit', preFlight);
                        config.submitted = true;
                        config.elements.form.submit();
                        config.elements.form.on('submit', preFlight);
                        prioritizeHandler(config.elements.form, 'submit');
                    } else {
                        if (success) {
                            config.elements.form.off('submit', preFlight);
                            config.elements.form.submit();
                        } else {
                            config.do.message(err);
                        }
                    }
                });
            });
            prioritizeHandler(config.elements.form, 'submit');
        }
        return config;
    }

    /**
     * CDN URLs for required dependencies
     */
    var paths = {
        jquery: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js',
        jquery_ac: 'https://cdnjs.cloudflare.com/ajax/libs/autocomplete.js/0.37.0/autocomplete.jquery.min.js',
    }

    /**
     * Dependency Loader
     */
    var BootStrapper = {
        load: function () {
            var args = Array.prototype.slice.call(arguments[0]);
            var next = BootStrapper[args.shift()];
            next && next.apply(this, args);
        },
        jquery: function () {
            if (!window.jQuery) {
                var args = arguments;
                var jq = document.createElement('script');
                jq.onload = function () {
                    BootStrapper.load(args);
                };
                jq.src = paths.jquery;
                document.getElementsByTagName('body')[0].appendChild(jq);
            } else {
                BootStrapper.load(arguments);
            }
        },
        jquery_autocomplete: function () {
            if (!window.jQuery.fn.autocomplete) {
                var jqac = document.createElement('script');
                var args = arguments;
                jqac.onload = function () {
                    BootStrapper.load(args);
                };
                jqac.src = paths.jquery_ac;
                document.getElementsByTagName('body')[0].appendChild(jqac);
            } else {
                BootStrapper.load(arguments);
            }
        },
        address_elements: function () {
            if (!window.LobAddressElements) {
                var config = window.LobAddressElementsConfig || {};
                window.LobAddressElements = new LobAddressElements(window.jQuery, config);
                BootStrapper.load(arguments);
            } else {
                BootStrapper.load(arguments);
            }
        }
    }
    BootStrapper.load(['jquery', 'jquery_autocomplete', 'address_elements']);
})();