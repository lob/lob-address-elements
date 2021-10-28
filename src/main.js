'use strict';

import { findElm, findPrimaryAddressInput, findValue } from './form-detection.js';
import { LobAddressElements } from './lob-address-elements.js';
import Bus from 'client-side-event-bus';

const resolveStrictness = (cfg, form) => {
  const values = ['false', 'strict', 'normal', 'relaxed', 'passthrough'];
  if (cfg && values.indexOf(cfg) > -1) {
    return cfg;
  } else {
    const attr = findValue('verify', form);
    return attr && values.indexOf(attr) > -1 ? attr : 'relaxed';
  }
}

const initLobAddressElementsManager = () => {
  const channel = new Bus('lob-address-elements');
  return {
    channel,
    instances: [],
    on: channel.on
  };
};

/**
 * Determine the presence of address-related fields and settings
 */
export const getFormStates = cfg => {
  //everything pivots around the primary address field
  const primaries = findPrimaryAddressInput();
  const responses = [];
  primaries.each((idx, primary) => {
    primary = $(primary);
    const form = primary.closest("form");
    const strictness = resolveStrictness(cfg ? cfg.strictness : null, form);
    const create_message = findValue('verify-message', form) === 'true' || (form.length && !findElm('verify-message', form).length);
    const autocomplete = primary.length && findValue('primary', form) !== 'false';
    const autosubmit = findValue('autosubmit', form) || true;
    const verify = strictness !== 'false' && form.length && (strictness === 'passthrough' || findElm('verify-message', form).length || create_message);
    responses.push({
      autocomplete,
      autosubmit,
      create_message,
      enrich: verify || autocomplete,
      form,
      primary,
      strictness,
      verify
    });
  });

  return responses;
}

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
  const enrichWebPage = ($, cfg) => {
    // Create our AV Elements manager if this is the first form we're enriching. If so we create
    // a global object to manage events and address forms we've enriched. All instances of
    // LobAddressElements will share the same event bus.
    if (!window.LobAddressElements) {
      window.LobAddressElements = initLobAddressElementsManager();
    }

    cfg.channel = window.LobAddressElements.channel;

    const updateFormState = newState => {
      const { enrich, form } = newState;
      const state = form && form.attr("data-lob-state") || 'untouched';
      if (state === 'untouched' && enrich) {
        form.attr("data-lob-state", 'enriched');
        setTimeout(() => {
          const av = new LobAddressElements($, cfg, newState)

          // Create our AV Elements manager if this is the first form we've enriched
          if (!window.LobAddressElements) {
            window.LobAddressElements = initLobAddressElementsManager();
          }

          window.LobAddressElements.instances.push(av);
        }, 0);
      } else if (state === 'enriched' && !enrich) {
        form.attr("data-lob-state", 'untouched');
      }
    };

    /**
     * Observe the DOM. Trigger enrichment when state changes to 'enrich'
     */
    const observeDOM = state => {
      const didChange = () => {
        const newStates = getFormStates(cfg);
        newStates.forEach(updateFormState);
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
      didChange();
    }

    //watch for DOM changes
    observeDOM();

    // If no forms are found, give user a way to manually initialize LobAddressElements
    if(!getFormStates().length) {
      return {
        do: {
          init: () => new LobAddressElements($, cfg),
        }
      };
    }
  }

  /**
   * CDN URLs for required dependencies
   */
  const paths = {
    jquery: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js',
    jquery_ac: 'https://cdnjs.cloudflare.com/ajax/libs/autocomplete.js/0.37.0/autocomplete.jquery.min.js',
  }

  /**
   * Dependency Loader
   */
  const BootStrapper = {
    load: function () {
      const args = Array.prototype.slice.call(arguments[0]);
      const next = BootStrapper[args.shift()];
      next && next.apply(this, args);
    },
    jquery: function () {
      if (!window.jQuery) {
        const args = arguments;
        const jq = document.createElement('script');
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
        const jqac = document.createElement('script');
        const args = arguments;
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
        const config = window.LobAddressElementsConfig || {};

        window.LobAddressElements = initLobAddressElementsManager();
        // enrichWebPage only returns something when no forms are found.
        // When forms are found, instances are added in observeDOM
        const enrichResult = enrichWebPage(window.jQuery, config)
        if (enrichResult) {
          window.LobAddressElements.instances.push(enrichResult);
        }

        BootStrapper.load(arguments);
      } else {
        BootStrapper.load(arguments);
      }
    }
  }
  BootStrapper.load(['jquery', 'jquery_autocomplete', 'address_elements']);
})();
