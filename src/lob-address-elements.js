(function () {

    var DEFAULTS = {
        JQUERY: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js',
        JQUERY_AC: 'https://cdnjs.cloudflare.com/ajax/libs/autocomplete.js/0.37.0/autocomplete.jquery.min.js',
        API_KEY: 'live_pub_e6b1d70bb54ad309f841421eb45eb44',
        COLOR: '#666666',
        BACKGROUNDCOLOR: '#fefefe',
        BORDERCOLOR: '#a8a8a8',
        ACTIVECOLOR: '#117ab8',
        ACTIVEBGCOLOR: '#eeeeee',
    }

    //list of standard error messages to render in the UI when the address verification fails;
    var ERROR_MESSAGES = {
        "primary_line is required or address is required": "The primary street address is required.",
        "zip_code is required or both city and state are required": "You must provide a Zip Code or a valid City and State.",
        "undeliverable": "The address could not be verified. Please reconfirm your input.",
        "deliverable_missing_unit": "The address should include additional information such as a SUITE or UNIT number. Please update and then resubmit.",
        "DEFAULT": "The address could not be verified. (Submit normally! Do not interrupt call flow!)"
    }

    function LobAddressElements($) {
        //configure styles IF the user did not explicitly override (look for `data-lob-suggestion-stylesheet`)
        if ($('*[data-lob-suggestion-stylesheet]').length < 1) {
            //the user has chosen to use our provided stylesheet and optionally include color overrides
            var color = $('*[data-lob-suggestion-color]').attr('data-lob-suggestion-color') || DEFAULTS.COLOR;
            var backgroundcolor = $('*[data-lob-suggestion-backgroundcolor]').attr('data-lob-suggestion-backgroundcolor') || DEFAULTS.BACKGROUNDCOLOR;
            var bordercolor = $('*[data-lob-suggestion-bordercolor]').attr('data-lob-suggestion-bordercolor') || DEFAULTS.BORDERCOLOR;
            var activecolor = $('*[data-lob-suggestion-activecolor]').attr('data-lob-suggestion-activecolor') || DEFAULTS.ACTIVECOLOR;
            var activebgcolor = $('*[data-lob-suggestion-activebgcolor]').attr('data-lob-suggestion-activebgcolor') || DEFAULTS.ACTIVEBGCOLOR;
            //inject the stylesheet used by the autocomplete dropdown
            $('<style>')
                .prop('type', 'text/css')
                .html('\
                .algolia-autocomplete {\
                    width: 100%;\
                }\
                .aa-dropdown-menu {\
                    width: 100%;\
                    border: 1px solid ' + bordercolor + ';\
                    border-top: 0;\
                    background-color: ' + backgroundcolor + ';\
                    overflow: hidden;\
                    border-radius: 0 0 .25rem .25rem;\
                    margin-top:-5px;\
                }\
                .aa-suggestion {\
                    cursor: pointer;\
                    padding: 6px 12px;\
                    color: ' + color + ';\
                }\
                .aa-suggestion:hover,\
                .aa-suggestion:active,\
                .aa-suggestion.aa-cursor  {\
                    color: ' + activecolor + ';\
                    background-color: ' + activebgcolor + ';\
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
        //resolve user configuration by reading 'data-lob-*' attributes
        $('*[data-lob-on-submit-error]').hide();
        var suggestions = $('*[data-lob-suggestions]').hide();
        var form = $('form[data-lob-validate-on-submit]');
        //resolve target form fields by reading 'data-lob-*' attributes
        var fields = {
            primary: $('input[data-lob-primary]'),
            secondary: $('input[data-lob-secondary]'),
            city: $('input[data-lob-city]'),
            state: $('*[data-lob-state]'),
            zip: $('input[data-lob-zip]')
        }
        //on-key-press handler function (queries the Lob us_autocompletions API for possible matches)
        function getAutocompleteSuggestions(query, cb) {
            if (query.match(/[A-Za-z0-9]/)) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://api.lob.com/v1/us_autocompletions', true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(DEFAULTS.API_KEY + ':'));
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
                    city: fields.city.val(),
                    zip_code: fields.zip.val(),
                    state: fields.state.val(),
                    geo_ip_sort: true
                }));
            }
            return false;
        }
        //configure the autocomplete plugin 
        fields.primary.autocomplete(
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
                fields.primary.autocomplete('val', suggestion.primary_line);
                fields.secondary.val('');
                fields.city.val(suggestion.city);
                fields.state.val(suggestion.state);
                fields.zip.val(suggestion.zip_code);
            });
        //pre-verify the address before submission (optional behavior if the user tagged the form itself)
        if (form.length) {
            function verify_us_address(cb) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://api.lob.com/v1/us_verifications', true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(DEFAULTS.API_KEY + ':'));
                xhr.onreadystatechange = function () { // Call a function when the state changes.
                    if (this.readyState === XMLHttpRequest.DONE) {
                        if (this.status === 200) {
                            try {
                                //display validation errors
                                var data = JSON.parse(xhr.responseText);
                                if (data.deliverability === "deliverable") {
                                    cb(null, true);
                                } else if (data.deliverability === "undeliverable") {
                                    cb(ERROR_MESSAGES[data.deliverability]);
                                } else if (data.deliverability === "deliverable_missing_unit") {
                                    cb(ERROR_MESSAGES[data.deliverability]);
                                } else {
                                    cb("Unknown state: " + data.deliverability);
                                }
                            } catch (e) {
                                cb(ERROR_MESSAGES["DEFAULT"]);
                            }
                        } else {
                            try {
                                var data = JSON.parse(xhr.responseText);
                                cb(ERROR_MESSAGES[data.error.message] || data.error.message);
                            } catch (e) {
                                cb(ERROR_MESSAGES["DEFAULT"]);
                            }
                        }
                    }
                }
                xhr.send(JSON.stringify({
                    primary_line: fields.primary.val(),
                    secondary_line: fields.secondary.val(),
                    city: fields.city.val(),
                    state: fields.state.val(),
                    zip_code: fields.zip.val()
                }));
                return false;
            }
            form.on('submit', function preFlight(e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                $('*[data-lob-on-submit-error]').hide();
                return verify_us_address(function (err_message, success) {
                    if (success) {
                        //cancel the interceptor (this method) and submit the form using the default handler
                        form.off('submit', preFlight);
                        form.submit();
                    } else {
                        // show the error message
                        $('*[data-lob-on-submit-error]').text(err_message).show("slow");
                    }
                });
            });
            //prioritize the submit handler that was just added, so it can intercept and cancel the submission if necessary
            prioritizeHandler(form, "submit");
        }
    }

    /**
     * jquery event handlers are bound in source order. This prioritizes the most-recently-added handler as the first one.
     * @param {object} jqElm 
     * @param {*} event_type 
     */
    function prioritizeHandler(jqElm, event_type) {
        var eventList = $._data(jqElm[0], 'events');
        eventList[event_type].unshift(eventList[event_type].pop());
    }

    /**
     * load jQuery as necessary
     */
    function loadJQ() {
        var jq = document.createElement('script');
        jq.onload = function () {
            loadJQAC();
        };
        jq.src = DEFAULTS.JQUERY;
        document.getElementsByTagName('body')[0].appendChild(jq);
    }

    /**
     * load the Algolia autocomplete plugin as necessary
     */
    function loadJQAC() {
        var jqac = document.createElement('script');
        jqac.onload = function () {
            window.LobAddressElements = new LobAddressElements(jQuery);
        };
        jqac.src = DEFAULTS.JQUERY_AC;
        document.getElementsByTagName('body')[0].appendChild(jqac);
    }

    //load dependencies as necessary
    if (!window.jQuery) {
        loadJQ();
    } else if (!$.fn.autocomplete) {
        loadJQAC();
    } else {
        window.LobAddressElements = new LobAddressElements(jQuery);
    }
})();