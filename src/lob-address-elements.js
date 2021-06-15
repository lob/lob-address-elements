import { countryCodes, isInternational } from './international-utils.js';
import { findElm, findValue, parseWebPage } from './form-detection.js';
import { createAutocompleteStyles, createVerifyMessageStyles } from './stylesheets.js';

const resolveStyleStrategy = cfg =>
  typeof (cfg) !== 'undefined' ?
    !!cfg : findElm('suggestion-stylesheet').length > 0;

let autocompletion_configured = false;
let verification_configured = false;

/**
 * Private inner function that enriches page elements
 * with advanced address functionality. Only called when
 * the page transitions from NOT having elements to 
 * having elements. Typically called on page load for
 * static pages where the form already exists and when
 * the DOM changes and the target address fields are added.
 * 
 * @param {object} $ - jQuery
 * @param {*} cfg - configuration
 * @param {*} state - page state
 */
export function _LobAddressElements($, cfg, state) {
  let config = {
    api_key: cfg.api_key || findValue('key'),
    strictness: state.strictness,
    denormalize: findValue('secondary') !== 'false',
    suppress_stylesheet: resolveStyleStrategy(cfg),
    styles: cfg.styles || {
      'err-color': '#117ab8',
      'err-bgcolor': '#eeeeee',
      'suggestion-color': '#666666',
      'suggestion-bgcolor': '#fefefe',
      'suggestion-bordercolor': '#a8a8a8',
      'suggestion-activecolor': '#117ab8',
      'suggestion-activebgcolor': '#eeeeee'
    },
    elements: cfg.elements || parseWebPage(),
    messages: cfg.messages || {
      primary_line: findValue('err-primary-line') || 'Enter the Primary address.',
      city_state_zip: findValue('err-city-state-zip') || 'Enter City and State (or Zip).',
      country: findValue('err-country') || 'Enter a country',
      zip: findValue('err-zip') || 'Enter a valid Zip.',
      undeliverable: findValue('err-undeliverable') || 'The address could not be verified.',
      deliverable_missing_unit: findValue('err-missing-unit') || 'Enter a Suite or Unit.',
      deliverable_unnecessary_unit: findValue('err-unnecessary-unit') || 'Suite or Unit unnecessary.',
      deliverable_incorrect_unit: findValue('err-incorrect-unit') || 'Incorrect Unit. Please confirm.',
      confirm: findValue('err-confirm') || 'Did you mean',
      DEFAULT: findValue('err-default') || 'Unknown Error. The address could not be verified.'
    },
    apis: cfg.apis || {
      autocomplete: 'https://api.lob.com/v1/us_autocompletions',
      intl_verify: 'https://api.lob.com/v1/intl_verifications', 
      us_verify: 'https://api.lob.com/v1/us_verifications'
    },
    do: {
      init: function () {
        _LobAddressElements($, cfg);
      }
    }
  };

  /**
   * Injects styles, behaviors and fields necessary for address autocompletion
   */
  function configureAutocompletion() {

    /**
     * Inject the CSS for styling the dropdown if not overridden by user
     */
    if (!config.suppress_stylesheet && !autocompletion_configured) {
      autocompletion_configured = true;
      $('<style>')
        .prop('type', 'text/css')
        .html(createAutocompleteStyles(config))
        .appendTo('head');
    }

    /**
     * query Lob for autocomplete suggestions
     * @param {string} query - what the user just keyed into the autocomplete input
     * @param {function} cb - callback
     */
    config.do.autocomplete = function (query, cb) {
      config.international = isInternational(config.elements.country);

      if (config.international) {
        return false;
      }

      if (query.match(/[A-Za-z0-9]/)) {
        var xhr = new XMLHttpRequest();
        var path = config.apis.autocomplete + '?av_elements_origin=' + window.location.href;
        xhr.open('POST', path, true);
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
            } else if (this.status === 401) {
              //INVALID API KEY; allow default submission
              console.log('Please sign up on lob.com to get a valid api key.');
              cb(null);
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
      // Check autocomplete in case we're in running in a unit test
      if (typeof config.elements.primary.autocomplete === 'function') {
        config.elements.primary.autocomplete('val', suggestion.primary_line);
      } else {
        config.elements.primary.val(suggestion.primary_line);
      }
      config.elements.secondary.val('');
      config.elements.city.val(suggestion.city);
      config.elements.state.val(suggestion.state);
      config.elements.zip.val(suggestion.zip_code);
    }

    /**
     * configure the Algolia Autocomplete plugin
     */
    if (typeof config.elements.primary.autocomplete === 'function') {

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
  }

  /**
   * Injects styles, behaviors and fields necessary for address verification
   */
  function configureVerification() {

    /**
     * jQuery event handlers execute in binding order. 
     * This prioritizes the most-recent (Lob)
     * @param {object} jqElm 
     * @param {*} event_type 
     */
    function prioritizeHandler(jqElm, event_type) {
      var eventList = $._data(jqElm[0], 'events');
      eventList[event_type].unshift(eventList[event_type].pop());
    }

    function resolveErrorType(message) {
      if (message === 'primary_line is required or address is required') {
        return 'primary_line';
      } else if (message === 'zip_code is required or both city and state are required') {
        return 'city_state_zip';
      } else if (message === 'zip_code must be in a valid zip or zip+4 format') {
        return 'zip';
      } else if (message === 'country is required') {
        return 'country'
      } else if (message in config.messages) {
        return message
      } else {
        return 'DEFAULT';
      }
    }

    /**
     * Inject the form Verification Error Message container
     */
    if (state.create_message) {
      var message = $('<div class="lob-verify-message"></div>');

      // Determine where to place error message
      var anchor = config.elements.errorAnchorElement;

      if (anchor.length) {
        message.insertBefore(anchor);
      } else {
        console.log(config.elements.form);
        config.elements.form.prepend(message);
      }
      config.elements.message = message;

      if (!verification_configured) {
        verification_configured = true;
        $('<style>')
          .prop('type', 'text/css')
          .html(createVerifyMessageStyles(config))
          .appendTo('head');
      }
    }

    function plus4(components) {
      var parts = [];
      if (components.zip_code) {
        parts.push(components.zip_code);
      }
      if (components.zip_code_plus_4) {
        parts.push(components.zip_code_plus_4);
      }
      return parts.length ? parts.join('-') : '';
    }

    /**
     * Lob uses the official USPS structure for parsed addresses, but 
     * it is common for most Websites in the US to not adhere to this
     * standard. This returns a hybrid that binds the suite to the 
     * secondary line if the user entered it originally in the secondary
     * line. 
     * @param {object} data - US verification response
     * @param {boolean} bSecondary - user typed in the secondary field?
     */
    function denormalizeParts(data, bSecondary) {
      var sd = data.components && data.components.secondary_designator || '';
      if (data.secondary_line || !config.denormalize) {
        //echo exactly when configured explicitly or structurally required
        return {
          secondary_line: data.secondary_line,
          primary_line: data.primary_line
        }
      } else if (sd && bSecondary) {
        //the user entered the value in the secondary line; echo there
        var parts = data.primary_line.split(sd);
        return {
          secondary_line: sd + ' ' + (parts[1]).trim(),
          primary_line: (parts[0]).trim()
        }
      } else {
        //use the default
        return {
          secondary_line: data.secondary_line,
          primary_line: data.primary_line
        }
      }
    }

    function formatAddressFromResponseData(data) {
      const { components } = data;
      const parts = denormalizeParts(data, !!config.elements.secondary.val());

      return {
        primary: parts.primary_line,
        secondary: parts.secondary_line,
        city: components && components.city || '',
        state: components && components.state || '',
        zip: config.international ? components.postal_code : plus4(components)
      };
    }

    /**
     * Called after Lob verifies an address. Improves/updates and caches. Optionally we can
     * disable fixing to only check if the address needs improvement.
     * @param {object} data - verified address object returned from Lob
     */
    function fixAndSave(data, fix = true) {
      let needsImprovement = false;
      const address = config.address = formatAddressFromResponseData(data);
      for (let p in address) {
        if (address.hasOwnProperty(p)) {
          const formInput = config.elements[p].val();
          const dataDoesNotMatchFormInput = address[p].toUpperCase() !== formInput.toUpperCase();
          // Standard 5-digit zip input is good enough. We don't care if it doesn't match response data's zip with +4
          const zipMismatch = !(p === 'zip' && formInput.length === 5 && address[p].indexOf(formInput) === 0);

          if (dataDoesNotMatchFormInput && (!config.international && zipMismatch)) {
            needsImprovement = true;
          }
          
          if (fix) {
            config.elements[p].val(address[p]);
          }
        }
      }
      return needsImprovement;
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
      var addressNeedsImprovement = fixAndSave(data, false /* fix */);
      return !status ||
        (data.deliverability === 'deliverable' && !addressNeedsImprovement) ||
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

    function format(template, args) {
      for (var k in args) {
        template = template.replace("{" + k + "}", args[k])
      }
      return template;
    }

    function createDidYouMeanMessage(data) {
      var address = formatAddressFromResponseData(data);
      var info = config.messages.confirm; // Did you mean
      var modifiedAddress = format("{0} {1} {2} {3} {4}", [
        address.primary,
        address.secondary,
        address.city,
        address.state,
        address.zip
      ]);
      return format(
        "<span style=\"cursor: pointer\">{0} <span style=\"text-decoration: underline\">{1}</span>?</span>",
        [info, modifiedAddress]
      );
    }

    const messageTypes = {
      primary_line: msg => {
        config.elements.primaryMsg.text(msg).show('slow');
      },
      city_state_zip: msg => {
        config.elements.cityMsg.text(msg).show('slow');
        config.elements.stateMsg.text(msg).show('slow');
        config.elements.zipMsg.text(msg).show('slow');
      },
      zip: msg => {
        config.elements.zipMsg.text(msg).show('slow');
      },
      deliverable_missing_unit: msg => {
        (!config.denormalize &&
          config.elements.primaryMsg.text(msg).show('slow')) ||
          config.elements.secondaryMsg.text(msg).show('slow');
      },
      deliverable_unnecessary_unit: msg => {
        (!config.denormalize &&
          config.elements.primaryMsg.text(msg).show('slow')) ||
          config.elements.secondaryMsg.text(msg).show('slow');
      },
      deliverable_incorrect_unit: msg => {
        (!config.denormalize &&
          config.elements.primaryMsg.text(msg).show('slow')) ||
          config.elements.secondaryMsg.text(msg).show('slow');
      }
    };

    /**
     * Show form- and field-level error messages as configured. Verification did NOT succeed.
     * @param {object} err - Verification error object representing a Lob error type
     * @param {string} err.msg - Top-level message to show for the form
     * @param {string} err.type - Specific error type to apply at field level if relevant
     */
    config.do.message = function (err) {
      if (err) {
        // Confirmation error message uses html to give users the ability to revert standardization
        if (err.type === 'confirm' || err.type === 'form_detection') {
          config.elements.message.html(err.msg).show('slow');
        } else {
          config.elements.message.text(err.msg).show('slow');              
        }
        messageTypes[err.type] && messageTypes[err.type](config.messages[err.type]);
      }
    }

    if (config.elements.parseResultError !== '') {
      config.do.message({ type: 'form_detection', msg: config.elements.parseResultError });
    }

    /**
     * Calls the Lob.com US Verification API. If successful, the user's form will be submitted by 
     * the cb handler to its original endpoint. If unsuccessful, an error message will be shown.
     * @param {function} cb - process the response (submit the form or show an error message)
     */
    config.do.verify = function (cb) {
      config.international = isInternational(config.elements.country);
      config.submit = config.strictness === 'passthrough';
      config.confirmed = isConfirmation();

      const payload = {
        primary_line: config.elements.primary.val(),
        secondary_line: config.elements.secondary.val(),
        city: config.elements.city.val(),
        state: config.elements.state.val()
      };

      if (config.international) {
        const country = config.elements.country.val().toLowerCase();

        payload.country = country.length === 2 ? country : countryCodes[country];
        payload.postal_code = config.elements.zip.val();
      } else {
        payload.zip_code = config.elements.zip.val();
      }

      const endpoint = config.international ? config.apis.intl_verify : config.apis.us_verify;
      const path = endpoint + '?av_elements_origin=' + window.location.href;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', path, true);
      xhr.setRequestHeader('Content-Type', 'application/json');

      if (config.api_key) {
        xhr.setRequestHeader('Authorization', 'Basic ' + btoa(config.api_key + ':'));
      }

      xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE) {
          var data = parseJSON(xhr.responseText);
          var type;
          if ((!this.status || this.status === 200) && (!data.statusCode || data.statusCode === 200)) {
            data = data && data.body || data;
            if (isVerified(data, config, this.status)) {
              //SUCCESS (time for final submit)
              cb(null, true);
            } else if (data.deliverability === 'deliverable') {
              // Address verifired as deliverable but the address needs improvement.
              // Prompt user to confirm Lob's improvements)
              var message = createDidYouMeanMessage(data);
              config.elements.message.click(function () {
                // Mock format from API response
                fixAndSave(data);
                hideMessages();
                config.elements.message.off('click');
              });
              cb({ msg: message, type: 'confirm' });
            } else {
              //KNOWN VERIFICATION ERROR (e.g., undeliverable)
              type = resolveErrorType(data.deliverability);
              cb({ msg: config.messages[type], type: type });
            }
          } else if (this.status === 401) {
            //INVALID API KEY; allow default submission
            console.log('Please sign up on lob.com to get a valid api key.');
            cb(null, true);
          } else {
            data = data && data.body || data;
            //KNOWN SYSTEM ERROR (e.g., rate limit exceeded, primary line missing)
            type = resolveErrorType(data.error.message);
            cb({ msg: config.messages[type], type: type });
          }
        }
      }
      xhr.send(JSON.stringify(payload));
      return false;
    }

    config.elements.form.on('submit', function preFlight(e) {
      e.stopImmediatePropagation();
      e.preventDefault();

      hideMessages();

      // Remove event handler from previous error message
      config.elements.message.off('click');

      return config.do.verify(function (err, success) {
        if (config.submit || config.override) {
          config.do.message(err);
          config.elements.form.off('submit', preFlight);
          config.submitted = true;
          config.override = false;
          config.elements.form.submit();
          config.elements.form.on('submit', preFlight);
          prioritizeHandler(config.elements.form, 'submit');
        } else {
          if (success) {
            config.elements.form.off('submit', preFlight);
            config.elements.form.submit();
          } else {
            config.do.message(err);
            // Allow user to bypass known warnings after they see our warning message 
            config.override = err.type !== 'DEFAULT';
          }
        }
      });
    });
    prioritizeHandler(config.elements.form, 'submit');
  }

  if (state.autocomplete) {
    configureAutocompletion();
  }

  if (state.verify) {
    configureVerification();
  }


  //bind the state to the global element
  return window.LobAddressElements = config;
}
