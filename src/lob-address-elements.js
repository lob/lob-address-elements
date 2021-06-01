'use strict';

import { parseWebPage } from './form-detection.js';
import countryCodes from './country-codes.js';

(function () {
  /**
   * Enriches a standard HTML form by adding two address-related behaviors to the form:
   * 1) US Address autocompletion
   * 2) US Address verification
   * @compatible    - IE11+, Edge, Webkit/Safari, Chrome, Firefox
   * @dependencies  - jQuery, Algolia jQuery Plugin
   * @param {object} $ - jQuery
   * @param {object} cfg - user configuration passed as a JSON file (optional)
   * @returns {object}
   */
  function LobAddressElements($, cfg) {

    var autocompletion_configured = false;
    var verification_configured = false;

    /**
     * Returns a jquery element to which to add behavior, locating
     * the element using one of three methods: id, name, attribute.
     * @param {string} type - For example: primary, secondary, city
     * @returns {object}
     */
    function findElm(type) {
      var pid = $('*[data-lob-' + type + '-id]').attr('data-lob-' + type + '-id');
      if (pid) {
        return $('#' + pid);
      } else {
        var pnm = $('*[data-lob-' + type + '-name]').attr('data-lob-' + type + '-name');
        var pc = $('*[data-lob-' + type + '-class]').attr('data-lob-' + type + '-class');
        if (pnm) {
          return $('*[name=' + pnm + ']');
        } else if (pc) {
          return $('.' + pc);
        } else {
          return $('*[data-lob-' + type + ']');
        }
      }
    }

    /**
     * Returns the configuration value for a given @type
     * @param {string} type - One of: verify, secondary, primary, verify-message
     * @returns {object}
     */
    function findValue(type) {
      var target = findElm(type);
      var target_val = target.length && target.attr('data-lob-' + type);
      return target_val || $('*[data-lob-' + type + '-value]').attr('data-lob-' + type + '-value');
    }

    /**
     * Returns the form parent for a target element, @type, 
     * unless the user explicitly identifies the form to use via the
     * 'verify' label
     * @param {string} type - For example: primary, secondary, zip, etc
     * @returns {object}
     */
    function findForm(type) {
      var form = findElm('verify');
      return form.length ? form : findElm(type).closest('form');
    }

    function resolveStrictness(cfg) {
      var values = ['false', 'strict', 'normal', 'relaxed', 'passthrough'];
      if (cfg && values.indexOf(cfg) > -1) {
        return cfg;
      } else {
        var attr = findValue('verify');
        return attr && values.indexOf(attr) > -1 ? attr : 'normal';
      }
    }

    function resolveStyleStrategy(cfg) {
      return typeof (cfg) !== 'undefined' ?
        !!cfg : findElm('suggestion-stylesheet').length > 0
    }

    function resolveInputDisplay(config) {
      var display = config.elements.primary.css('display');
      return display.toLowerCase() === 'block' ? 'block' : '';
    }

    function resolveInputWidth(config) {
      var display = config.elements.primary.css('display');
      if (display.toLowerCase() === 'block') {
        return '100%';
      } else {
        return config.elements.primary.css('width') || (config.elements.primary.outerWidth() + 'px');
      }
    }

    /**
     * Determine the presence of address-related fields and settings
     */
    function getPageState() {
      var primary = findElm('primary');
      var strictness = resolveStrictness(cfg.strictness);
      var create_message = findValue('verify-message') === 'true' || (findForm('primary').length && !findElm('verify-message').length);
      var autocomplete = primary.length && findValue('primary') !== 'false';
      var verify = strictness !== 'false' && findForm('primary').length && (strictness === 'passthrough' || findElm('verify-message').length || create_message);
      return {
        autocomplete: autocomplete,
        verify: verify,
        enrich: verify || autocomplete,
        create_message: create_message,
        strictness: strictness
      };
    }

    /**
     * Observe the DOM. Trigger enrichment when state changes to 'enrich'
     * @param {string} state - The current state. One of: enriched, untouched
     */
    function observeDOM(state) {
      function didChange() {
        var newState = getPageState();
        if (state === 'untouched' && newState.enrich) {
          state = 'enriched';
          setTimeout(function () {
            _LobAddressElements($, cfg, newState);
          }, 0);
        } else if (state === 'enriched' && !newState.enrich) {
          state = 'untouched';
        }
      }
      var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
      if (MutationObserver) {
        var observer = new MutationObserver(didChange);
        observer.observe(window.document.body, {
          subtree: true,
          attributes: true,
          childList: true
        });
      }
    }

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
    function _LobAddressElements($, cfg, state) {
      var config = {
        api_key: cfg.api_key || findValue('key'),
        strictness: state.strictness,
        denormalize: findValue('secondary') !== 'false',
        suppress_stylesheet: resolveStyleStrategy(cfg.stylesheet),
        styles: cfg.styles || {
          'err-color': '#117ab8',
          'err-bgcolor': '#eeeeee',
          'suggestion-color': '#666666',
          'suggestion-bgcolor': '#fefefe',
          'suggestion-bordercolor': '#a8a8a8',
          'suggestion-activecolor': '#117ab8',
          'suggestion-activebgcolor': '#eeeeee'
        },
        elements: cfg.elements || {
          errorAnchorElement: findElm('verify-message-anchor'),
          form: findForm('primary'),
          message: findElm('verify-message').hide(),
          primary: findElm('primary'),
          primaryMsg: findElm('primary-message').hide(),
          secondary: findElm('secondary'),
          secondaryMsg: findElm('secondary-message').hide(),
          city: findElm('city'),
          cityMsg: findElm('city-message').hide(),
          country: findElm('country'),
          countryMsg: findElm('country-message').hide(),
          state: findElm('state'),
          stateMsg: findElm('state-message').hide(),
          zip: findElm('zip'),
          zipMsg: findElm('zip-message').hide()
        },
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

      function isInternational() {
        return config.elements.country.length
          && !['United States', 'United States of America', 'US', 'U.S', 'U.S.', 'USA', 'U.S.A', 'U.S.A'].includes(config.elements.country.val());
      }

      function resolveInlineStyle(config, type, subtype) {
        return findValue(type + '-' + subtype) || config.styles[type + '-' + subtype];
      }

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
            .html('\
            .algolia-autocomplete {\
              display:' + resolveInputDisplay(config) + ';\
              width: ' + resolveInputWidth(config) + ';\
              vertical-align: middle;\
            }\
            .aa-dropdown-menu {\
              width: 100%;\
              border: 1px solid ' + resolveInlineStyle(config, 'suggestion', 'bordercolor') + ';\
              border-top: 0;\
              background-color: ' + resolveInlineStyle(config, 'suggestion', 'bgcolor') + ';\
              overflow: hidden;\
              border-radius: 0 0 .25rem .25rem;\
              margin-top:-5px;\
            }\
            .aa-suggestion {\
              cursor: pointer;\
              padding: 6px 12px;\
              color: ' + resolveInlineStyle(config, 'suggestion', 'color') + ';\
            }\
            .aa-suggestion:hover,\
            .aa-suggestion:active,\
            .aa-suggestion.aa-cursor  {\
              color: ' + resolveInlineStyle(config, 'suggestion', 'activecolor') + ';\
              background-color: ' + resolveInlineStyle(config, 'suggestion', 'activebgcolor') + ';\
            }\
            .aa-suggestion div {\
              white-space: nowrap !important;\
              overflow: hidden;\
              text-overflow: ellipsis;\
            }\
            .aa-suggestion span {\
              font-size: .8em;\
            }'
            ).appendTo('head');
        }

        /**
         * query Lob for autocomplete suggestions
         * @param {string} query - what the user just keyed into the autocomplete input
         * @param {function} cb - callback
         */
        config.do.autocomplete = function (query, cb) {
          config.international = isInternational();

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
            config.elements.form.prepend(message);
          }
          config.elements.message = message;

          if (!verification_configured) {
            verification_configured = true;
            $('<style>')
              .prop('type', 'text/css')
              .html('\
              .lob-verify-message {\
                display: none;\
                width: 100%;\
                border-radius: .25rem;\
                max-width: 100%;\
                position: relative;\
                left: 50%;\
                margin-right: -50%;\
                transform: translate(-50%, -50%);\
                text-align: center;\
                padding: .5rem;\
                margin-top: 1.5rem;\
                margin-bottom: 1.5rem;\
                color: ' + resolveInlineStyle(config, 'err', 'color') + ';\
                background-color: ' + resolveInlineStyle(config, 'err', 'bgcolor') + ';\
              }'
              ).appendTo('head');
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

        /**
         * Show form- and field-level error messages as configured. Verification did NOT succeed.
         * @param {object} err - Verification error object representing a Lob error type
         * @param {string} err.msg - Top-level message to show for the form
         * @param {string} err.type - Specific error type to apply at field level if relevant
         */
        config.do.message = function (err) {
          if (err) {
            // Confirmation error message uses html to give users the ability to revert standardization
            if (err.type === 'confirm') {
              config.elements.message.html(err.msg).show('slow');
            } else {
              config.elements.message.text(err.msg).show('slow');              
            }
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
            (!config.denormalize &&
              config.elements.primaryMsg.text(msg).show('slow')) ||
              config.elements.secondaryMsg.text(msg).show('slow');
          },
          deliverable_unnecessary_unit: function (msg) {
            (!config.denormalize &&
              config.elements.primaryMsg.text(msg).show('slow')) ||
              config.elements.secondaryMsg.text(msg).show('slow');
          },
          deliverable_incorrect_unit: function (msg) {
            (!config.denormalize &&
              config.elements.primaryMsg.text(msg).show('slow')) ||
              config.elements.secondaryMsg.text(msg).show('slow');
          }
        };

        /**
         * Calls the Lob.com US Verification API. If successful, the user's form will be submitted by 
         * the cb handler to its original endpoint. If unsuccessful, an error message will be shown.
         * @param {function} cb - process the response (submit the form or show an error message)
         */
        config.do.verify = function (cb) {
          config.international = isInternational();
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

      if (state.autocomplete) {
        configureAutocompletion();
      }

      if (state.verify) {
        configureVerification();
      }


      //bind the state to the global element
      return window.LobAddressElements = config;
    }

    var state = getPageState();
    // Test import functionality
    parseWebPage();
    if (state.enrich) {
      observeDOM('enriched');
      return _LobAddressElements($, cfg, state);
    } else {
      observeDOM('untouched');
      return {
        do: {
          init: function () {
            _LobAddressElements($, cfg, state);
          }
        }
      };
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
