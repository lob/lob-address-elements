(function () {


    /**
     * Enriches a standard HTML form by adding two address-related behaviors to the form:
     * 1) US Address autocompletion
     * 2) US Address verification
     * 
     * @param {object} $ - jQuery
     * @param {object} cfg - user configuration passed as a JSON file (optional)
     */
    function LobAddressElements($, cfg) {
        //merge user configuration to create the baseline configuration
        var config = {
            api_key: $('*[data-lob-key]').attr('data-lob-key') || cfg.api_key,
            strict: $('form[data-lob-verify]').attr('data-lob-verify') === 'strict',
            styles: {
                color: cfg.color || '#666666',
                bgcolor: cfg.bgcolor || '#fefefe',
                bordercolor: cfg.bordercolor || '#a8a8a8',
                activecolor: cfg.activecolor || '#117ab8',
                activebgcolor: cfg.activebgcolor || '#eeeeee',
                stylesheet: $('*[data-lob-suggestion-stylesheet]')
            },
            elements: {
                form: $('form[data-lob-verify]'),
                primary: $('input[data-lob-primary]'),
                secondary: $('input[data-lob-secondary]'),
                city: $('input[data-lob-city]'),
                state: $('*[data-lob-state]'),
                zip: $('input[data-lob-zip]'),
                message: $('*[data-lob-verify-message]').hide() //initialize in hidden state
            },
            messages: {
                primary_line: 'The primary street address is required.',
                city_state_zip: 'You must provide a Zip Code or a valid City and State.',
                undeliverable: 'The address could not be verified. Please reconfirm your input.',
                deliverable_missing_unit: 'The address should include additional information such as a SUITE or UNIT number. Please update and then resubmit.',
                confirm: 'Your address was updated during verification. Please verify our changes and resubmit.',
                DEFAULT: 'Unknown Error. The address could not be verified.'
            }
        };

        /**
         * jquery event handlers execute in the order they are bound. This prioritizes the most-recently-added 
         * handler as the first one, allowing Lob to first verify an address when the form is submitted.
         * 
         * @param {object} jqElm 
         * @param {*} event_type 
         */
        function prioritizeHandler(jqElm, event_type) {
            var eventList = $._data(jqElm[0], 'events');
            eventList[event_type].unshift(eventList[event_type].pop());
        }

        /**
         * returns a CSS color for the suggestion list, prioritizing any value set using 
         * the data-lob-suggestion-* attribute
         * 
         * @param {object} config - configuration settings object
         * @param {string} type - the type of configuration
         */
        function resolveInlineStyle(config, type) {
            return $('*[data-lob-suggestion-' + type + ']').attr('data-lob-suggestion-' + type) || config.styles[type];
        }

        /**
         * not every error returned from Lob.com's endpoints is a defined type. This method, converts these instances for
         * easier localization of the message strings.
         * 
         * @param {string} message - response message
         */
        function resolveMessageType(message) {
            if (message === 'primary_line is required or address is required') {
                return 'primary_line';
            } else if (message === 'zip_code is required or both city and state are required') {
                return 'city_state_zip';
            } else if (message === 'undeliverable' || message === 'deliverable_missing_unit') {
                return message
            } else {
                return 'DEFAULT';
            }
        }

        /**
         * Inject the CSS for styling the autocomplete's suggestion list (The default behavior) 
         * if the user did NOT choose to implement their own custom stylesheet
         */
        if (!config.styles.stylesheet.length) {
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
         * Enable address autocompletion if the user added the 
         * `data-lob-primary` attribute tag
         */
        if (config.elements.primary.length) {

            /**
             * on-key-press handler function (queries the Lob us_autocompletions API for possible matches)
             * 
             * @param {string} query - what the user just keyed into the autocomplete input
             * @param {function} cb - the callback function that will process the server response
             */
            function getAutocompleteSuggestions(query, cb) {
                if (query.match(/[A-Za-z0-9]/)) {
                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', 'https://api.lob.com/v1/us_autocompletions', true);
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(config.api_key + ':'));
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
             * configure the Algolia Autocomplete plugin; this plugin turns a standard
             * HTML input field into an autocomplete widget with Ajax capabilities.
             */
            config.elements.primary.autocomplete(
                {
                    hint: false,
                    delay: 400
                },
                {
                    source: getAutocompleteSuggestions,
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
                    config.elements.primary.autocomplete('val', suggestion.primary_line);
                    config.elements.secondary.val('');
                    config.elements.city.val(suggestion.city);
                    config.elements.state.val(suggestion.state);
                    config.elements.zip.val(suggestion.zip_code);
                });
        }

        /**
         * Enable pre-submission address verification if the user added the
         * `data-lob-verify` and `data-lob-verify-message` attribute tags
         */
        if (config.elements.form.length && config.elements.message.length) {

            /**
             * Called after Lob verifies the address. Improves/updates user input with values from Lob.
             * 
             * @param {object} address - verified address object returned from Lob's verification API
             * @param {boolean} strict - if true, the form is in strict mode and will NOT allow submission unless perfect
             */
            function applyTweaks(data, strict) {
                var unchanged;
                var address = {
                    primary: data.primary_line || '',
                    secondary: data.secondary_line || '',
                    city: data.components && data.components.city || '',
                    state: data.components && data.components.state || '',
                    zip: data.components && data.components.zip_code || ''
                }
                for (var p in address) {
                    if (address.hasOwnProperty(p)) {
                        if (strict && config.elements[p].val().toUpperCase() !== address[p].toUpperCase()) {
                            unchanged = true;
                        }
                        config.elements[p].val(address[p]);
                    }
                }
                config.address = address;
                return unchanged;
            }

            /**
             * Checks if the user made any changes to their form since the last time they 
             * submitted for verification; this is useful when warning a user when address verification fails. 
             * (Each time the user modifies their form, reset their `warned` state to `false`, 
             * so they are warned at least once before normal submission is allowed.)
             */
            function resetWarnedState() {
                for (var p in config.address) {
                    if (config.address.hasOwnProperty(p)) {
                        if (config.elements[p].val().toUpperCase() !== config.address[p].toUpperCase()) {
                            config.warned = false;
                        }
                    }
                }
            }

            /**
             * Safe JSON parser
             * 
             * @param {string} s - string to parse
             */
            function parseJSON(s) {
                try {
                    return JSON.parse(s);
                } catch (e) {
                    console.log('ERR', e);
                    return { error: { message: 'DEFAULT' } };
                }
            }

            /**
             * Calls the Lob.com US Verification API. If successful, the user's form will be submitted by 
             * the cb handler to its original endpoint. If unsuccessful, an error message will be shown.
             * 
             * @param {function} cb - process the response (submit the form or show an error message)
             */
            function verify_us_address(cb) {
                resetWarnedState();
                var xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://api.lob.com/v1/us_verifications', true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(config.api_key + ':'));
                xhr.onreadystatechange = function () {
                    if (this.readyState === XMLHttpRequest.DONE) {
                        var data = parseJSON(xhr.responseText);
                        if (this.status === 200) {
                            if (data.deliverability === 'deliverable') {
                                //SUCCESS
                                cb(null, data);
                            } else if (data.deliverability === 'deliverable_missing_unit' || data.deliverability === 'undeliverable') {
                                //KNOWN verification error (e.g., undeliverable)
                                cb({ message: config.messages[resolveMessageType(data.deliverability)] }, data);
                            } else {
                                //UN-KNOWN verification error (possible network error)
                                cb({ message: config.messages['DEFAULT'] }, data);
                            }
                        } else {
                            //KNOWN system error (e.g., rate limit exceeded, primary line missing)
                            cb({ message: config.messages[resolveMessageType(data.error.message)] }, data);
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
            //bind the Lob preflight handler function to verify the address before allowing submission
            config.elements.form.on('submit', function preFlight(e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                config.elements.message.hide();
                return verify_us_address(function (err, data) {
                    if (!err) {
                        if (!applyTweaks(data, config.strict)) {
                            //verification succeeded and NO improvements were made; SUBMIT FORM
                            config.elements.form.off('submit', preFlight);
                            config.elements.form.submit();
                        } else {
                            //verification succeeded BUT improvements were made; ASK USER RESUBMIT
                            config.elements.message.text(config.messages.confirm).show('slow');
                        }
                    } else if (data.deliverability === 'deliverable_missing_unit') {
                        if (config.strict) {
                            //unit is missing and strict mode is active; SHOW ERROR
                            config.elements.message.text(err.message).show('slow');
                        } else if (config.warned && !applyTweaks(data, true)) {
                            //unit is missing, BUT user was already warned; SUBMIT FORM
                            config.elements.form.off('submit', preFlight);
                            config.elements.form.submit();
                        } else {
                            //unit is missing; user has NOT been warned; ASK USER RESUBMIT
                            config.elements.message.text(err.message).show('slow');
                            config.warned = true;
                        }
                    } else if (!config.strict && config.warned) {
                        //verification failed BUT user was already warned; SUBMIT FORM
                        config.elements.form.off('submit', preFlight);
                        config.elements.form.submit();
                    } else {
                        //verification failed; user has NOT been warned; ASK USER RESUBMIT
                        applyTweaks(data, true);
                        config.elements.message.text(err.message).show('slow');
                        config.warned = true;
                    }
                });
            });
            prioritizeHandler(config.elements.form, 'submit');
        }
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
            if (!$.fn.autocomplete) {
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
                window.LobAddressElements = new LobAddressElements(jQuery, config);
                BootStrapper.load(arguments);
            } else {
                BootStrapper.load(arguments);
            }
        }
    }
    BootStrapper.load(['jquery', 'jquery_autocomplete', 'address_elements']);
})();