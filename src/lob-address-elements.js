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
            color: cfg.color || '#666666',
            bgcolor: cfg.bgcolor || '#fefefe',
            bordercolor: cfg.bordercolor || '#a8a8a8',
            activecolor: cfg.activecolor || '#117ab8',
            activebgcolor: cfg.activebgcolor || '#eeeeee',
            elements: {
                form: $('form[data-lob-validate-on-submit]'),
                primary: $('input[data-lob-primary]'),
                secondary: $('input[data-lob-secondary]'),
                city: $('input[data-lob-city]'),
                state: $('*[data-lob-state]'),
                zip: $('input[data-lob-zip]'),
                err: $('*[data-lob-on-submit-error]').hide() //initialize in hidden state
            },
            messages: cfg.messages || {
                'primary_line is required or address is required': 'The primary street address is required.',
                'zip_code is required or both city and state are required': 'You must provide a Zip Code or a valid City and State.',
                'undeliverable': 'The address could not be verified. Please reconfirm your input.',
                'deliverable_missing_unit': 'The address should include additional information such as a SUITE or UNIT number. Please update and then resubmit.',
                'DEFAULT': 'Unknown Error. The address could not be verified.'
            }
        };

        /**
         * jquery event handlers are bound in source order. This prioritizes the most-recently-added 
         * handler as the first one, allowing Lob to first verify the address when the form is submitted.
         * 
         * @param {object} jqElm 
         * @param {*} event_type 
         */
        function prioritizeHandler(jqElm, event_type) {
            var eventList = $._data(jqElm[0], 'events');
            eventList[event_type].unshift(eventList[event_type].pop());
        }

        /**
         * returns a configuration value, prioritizing any value set using the data-lob-suggestion-* attribute
         * 
         * @param {object} config - configuration settings object
         * @param {string} type - the type of configuration
         */
        function resolveConfig(config, type) {
            return $('*[data-lob-suggestion-' + type + ']').attr('data-lob-suggestion-' + type) || config[type];
        }

        /**
         * Inject the CSS for styling the autocomplete's suggestion list (The default behavior) 
         * if the user did NOT choose to implement their own custom stylesheet
         */
        if (!$('*[data-lob-suggestion-stylesheet]').length) {
            $('<style>')
                .prop('type', 'text/css')
                .html('\
                .algolia-autocomplete {\
                    width: 100%;\
                }\
                .aa-dropdown-menu {\
                    width: 100%;\
                    border: 1px solid ' + resolveConfig(config, 'bordercolor') + ';\
                    border-top: 0;\
                    background-color: ' + resolveConfig(config, 'bgcolor') + ';\
                    overflow: hidden;\
                    border-radius: 0 0 .25rem .25rem;\
                    margin-top:-5px;\
                }\
                .aa-suggestion {\
                    cursor: pointer;\
                    padding: 6px 12px;\
                    color: ' + resolveConfig(config, 'color') + ';\
                }\
                .aa-suggestion:hover,\
                .aa-suggestion:active,\
                .aa-suggestion.aa-cursor  {\
                    color: ' + resolveConfig(config, 'activecolor') + ';\
                    background-color: ' + resolveConfig(config, 'activebgcolor') + ';\
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
         * `data-lob-validate-on-submit` and `data-lob-on-submit-error` attribute tags
         */
        if (config.elements.form.length && config.elements.err.length) {
            function verify_us_address(cb) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://api.lob.com/v1/us_verifications', true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(config.api_key + ':'));
                xhr.onreadystatechange = function () {
                    if (this.readyState === XMLHttpRequest.DONE) {
                        if (this.status === 200) {
                            try {
                                //display validation errors
                                var data = JSON.parse(xhr.responseText);
                                if (data.deliverability === 'deliverable') {
                                    cb(null, true);
                                } else if (data.deliverability === 'undeliverable') {
                                    cb(config.messages[data.deliverability]);
                                } else if (data.deliverability === 'deliverable_missing_unit') {
                                    cb(config.messages[data.deliverability]);
                                } else {
                                    cb('Unknown state: ' + data.deliverability);
                                }
                            } catch (e) {
                                cb(config.messages['DEFAULT']);
                            }
                        } else {
                            try {
                                var data = JSON.parse(xhr.responseText);
                                cb(config.messages[data.error.message] || data.error.message);
                            } catch (e) {
                                cb(config.messages['DEFAULT']);
                            }
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
            //bind the Lob preflight handler function to verify the submission
            config.elements.form.on('submit', function preFlight(e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                config.elements.err.hide();
                return verify_us_address(function (err_message, success) {
                    if (success) {
                        //remove the pre-flight handler function and submit
                        config.elements.form.off('submit', preFlight);
                        config.elements.form.submit();
                    } else {
                        config.elements.err.text(err_message).show('slow');
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