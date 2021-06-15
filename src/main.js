'use strict';

import { findElm, findForm, findValue, findPrimaryAddressInput } from './form-detection.js';

import { _LobAddressElements } from './lob-address-elements.js';

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
  function LobAddressElementsFactory($, cfg) {

    function resolveStrictness(cfg) {
      const values = ['false', 'strict', 'normal', 'relaxed', 'passthrough'];
      if (cfg && values.indexOf(cfg) > -1) {
        return cfg;
      } else {
        const attr = findValue('verify');
        return attr && values.indexOf(attr) > -1 ? attr : 'normal';
      }
    }

    function createLobAddressElements($, cfg, state) {
      return new _LobAddressElements($, cfg, state);
    }

    /**
     * Determine the presence of address-related fields and settings
     */
    function getPageState() {
      try {
        // Propagate error with our message before something else breaks with a more confusing message
        const { primary, error: inputError } = findPrimaryAddressInput();
        if (inputError) {
          throw new Error(inputError);
        }

        const { form, error: formError } = findForm('primary');
        if (formError) {
          throw new Error(formError);
        }

        const strictness = resolveStrictness(cfg.strictness);
        const create_message = findValue('verify-message') === 'true' || (form.length && !findElm('verify-message').length);
        const autocomplete = primary.length && findValue('primary') !== 'false';
        const verify = strictness !== 'false' && form.length && (strictness === 'passthrough' || findElm('verify-message').length || create_message);

        return {
          autocomplete: autocomplete,
          verify: verify,
          enrich: verify || autocomplete,
          create_message: create_message,
          strictness: strictness,
          error: inputError || formError || ''
        };
      } catch (error) {
        return {
          autocomplete: false,
          verify: false,
          enrich: false,
          create_message: false,
          strictness: false,
          error: error.message
        };
      }
    }

    /**
     * Observe the DOM. Trigger enrichment when state changes to 'enrich'
     * @param {string} state - The current state. One of: enriched, untouched
     */
    function observeDOM(state) {
      function didChange() {
        const newState = getPageState();
        if (state === 'untouched' && newState.enrich) {
          state = 'enriched';
          setTimeout(function () {
            createLobAddressElements($, cfg, newState);
          }, 0);
        } else if (state === 'enriched' && !newState.enrich) {
          state = 'untouched';
        }
      }
      const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
      if (MutationObserver) {
        const observer = new MutationObserver(didChange);
        observer.observe(window.document.body, {
          subtree: true,
          attributes: true,
          childList: true
        });
      }
    }

    const state = getPageState();
    if (state.error !== '') {
      // Form cannot be found so we add error to the top of page
      const message = $(`<div class="lob-form-error-message">${state.error}</div>`);
      $('<style>')
      .prop('type', 'text/css')
      .html('\
      .lob-form-error-message {\
        width: 100%;\
        border-radius: .25rem;\
        max-width: 100%;\
        text-align: left;\
        padding: .5rem;\
        margin-top: 1.5rem;\
        margin-bottom: 1.5rem;\
        color: #117ab8;\
        background-color: #eeeeee;\
      }'
      ).appendTo('head');
      $("body").prepend(message);
      return null;
    } else if (state.enrich) {
      observeDOM('enriched');
      return createLobAddressElements($, cfg, state);
    } else {
      observeDOM('untouched');
      return {
        do: {
          init: function () {
            createLobAddressElements($, cfg, state);
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
        window.LobAddressElements = new LobAddressElementsFactory(window.jQuery, config);
        BootStrapper.load(arguments);
      } else {
        BootStrapper.load(arguments);
      }
    }
  }
  BootStrapper.load(['jquery', 'jquery_autocomplete', 'address_elements']);
})();
