import { countryCodes, isInternational } from './international-utils.js';
import { findElm, findValue, parseWebPage } from './form-detection.js';
import { createAutocompleteStyles, createVerifyMessageStyles } from './stylesheets.js';
import { getFormStates } from './main.js'

const resolveStyleStrategy = (cfg, form) => {
  const isEmptyObject = Object.keys(cfg).length <= 1 && cfg.constructor === Object;
  return typeof (cfg) !== 'undefined' && !isEmptyObject ?
    !!cfg : findElm('suggestion-stylesheet', form).length > 0;
};

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
 * @param {*} pageState - page state
 */
export class LobAddressElements {

  constructor($, cfg, pageState) {

    this.pageState = pageState || getFormStates()[0];
    this.config = {
      channel: cfg.channel,
      api_key: cfg.api_key || findValue('key'),
      autosubmit: pageState.autosubmit,
      strictness: this.pageState.strictness,
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
      elements: cfg.elements || parseWebPage(this.pageState.form),
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
          LobAddressElements($, cfg, this.pageState);
        }
      }
    };

    if (this.pageState.autocomplete) {
      this.configureAutocompletion();
    }

    if (this.pageState.verify) {
      this.configureVerification();
    }


    this.config.channel.emit('elements.enriched', { config: this.config, form: this.config.elements.form[0] });
  }


  // UI functionality

  hideMessages() {
    const { elements } = this.config;
    elements.message.hide();
    elements.primaryMsg.hide();
    elements.secondaryMsg.hide();
    elements.cityMsg.hide();
    elements.stateMsg.hide();
    elements.zipMsg.hide();
  }

  /**
   * Show form- and field-level error messages as configured. Verification did NOT succeed.
   * @param {object} err - Verification error object representing a Lob error type
   * @param {string} err.msg - Top-level message to show for the form
   * @param {string} err.type - Specific error type to apply at field level if relevant
   */
  showMessage(err) {
    const {
      channel,
      elements: {
        message,
        primaryMsg,
        secondaryMsg,
        cityMsg,
        stateMsg,
        zipMsg,
        form
      },
      messages,
      denormalize,
    } = this.config;

    const messageTypes = {
      primary_line: msg => {
        primaryMsg.text(msg).show('slow');
      },
      city_state_zip: msg => {
        cityMsg.text(msg).show('slow');
        stateMsg.text(msg).show('slow');
        zipMsg.text(msg).show('slow');
      },
      zip: msg => {
        zipMsg.text(msg).show('slow');
      },
      deliverable_missing_unit: msg => {
        (!denormalize &&
          primaryMsg.text(msg).show('slow')) ||
          secondaryMsg.text(msg).show('slow');
      },
      deliverable_unnecessary_unit: msg => {
        (!denormalize &&
          primaryMsg.text(msg).show('slow')) ||
          secondaryMsg.text(msg).show('slow');
      },
      deliverable_incorrect_unit: msg => {
        (!denormalize &&
          primaryMsg.text(msg).show('slow')) ||
          secondaryMsg.text(msg).show('slow');
      }
    };

    if (err) {
      // Confirmation error message uses html to give users the ability to revert standardization
      if (err.type === 'confirm' || err.type === 'form_detection') {
        message.html(err.msg).show('slow');
      } else {
        message.text(err.msg).show('slow');
      }
      messageTypes[err.type] && messageTypes[err.type](messages[err.type]);
      channel.emit('elements.us_verification.alert', { error: err, type: err.type, form: form[0] });
    }
  }


  // Autocomplete functionality

  /**
   * query Lob for autocomplete suggestions
   * @param {string} query - what the user just keyed into the autocomplete input
   * @param {function} cb - callback
   */
  autocomplete(query, cb) {
    const { apis, api_key, channel, elements } = this.config;

    this.config.international = isInternational(elements.country);

    if (this.config.international) {
      return false;
    }

    if (query.match(/[A-Za-z0-9]/)) {
      const xhr = new XMLHttpRequest();
      const path = `${apis.autocomplete}?av_elements_origin=${window.location.href}`;

      xhr.open('POST', path, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      if (api_key) {
        xhr.setRequestHeader('Authorization', 'Basic ' + btoa(api_key + ':'));
      }
      xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE) {
          if (this.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              channel.emit('elements.us_autocompletion.suggestion', { suggestions: data.suggestions, form: elements.form[0] });
              cb(data.suggestions);
            } catch (e) {
              cb(null);
            }
          } else if (this.status === 401) {
            //INVALID API KEY; allow default submission
            console.log('Please sign up on lob.com to get a valid api key.');
            channel.emit('elements.us_autocompletion.error', { code: 401, message: 'Please sign up on lob.com to get a valid api key.', form: elements.form[0] });
            cb(null);
          } else {
            channel.emit('elements.us_autocompletion.error', { code: 500, message: 'Unknown error.', form: elements.form[0] });
            cb(null);
          }
        }
      }
      xhr.send(JSON.stringify({
        address_prefix: query,
        city: elements.city.val(),
        zip_code: elements.zip.val(),
        state: elements.state.val(),
        geo_ip_sort: true
      }));
    }
    return false;
  }


  /**
   * Project the chosen suggested address into the UI
   * @param {object} suggestion - as returned from the Lob API
   */
  applySuggestion(suggestion) {
    const { elements } = this.config;
    // Check autocomplete in case we're in running in a unit test
    const isLiveEnv = typeof elements.primary.autocomplete === 'function';

    if (isLiveEnv) {
      elements.primary.autocomplete('val', suggestion.primary_line);
    } else {
      elements.primary.val(suggestion.primary_line);
    }
    elements.secondary.val('');
    elements.city.val(suggestion.city);
    elements.state.val(suggestion.state);
    elements.zip.val(suggestion.zip_code);
  }

  /**
   * Injects styles, behaviors and fields necessary for address autocompletion
   */
  configureAutocompletion() {
    const {
      elements,
      channel,
      suppress_stylesheet
    } = this.config;

    /**
     * Inject the CSS for styling the dropdown if not overridden by user
     */
    if (!suppress_stylesheet && !autocompletion_configured) {
      autocompletion_configured = true;
      $('<style>')
        .prop('type', 'text/css')
        .html(createAutocompleteStyles(this.config))
        .appendTo('head');
    }

    // Check autocomplete in case we're in running in a unit test
    const isLiveEnv = typeof elements.primary.autocomplete === 'function';

    /**
     * configure the Algolia Autocomplete plugin
     */
    if (isLiveEnv) {
      elements.primary.autocomplete(
        {
          hint: false
        },
        {
          source: this.autocomplete.bind(this),
          templates: {
            suggestion: ({ primary_line, city, state, zip_code }) =>
              $(`<div>${primary_line} <span>${city}, ${state} ${zip_code}</span></div>`)
          },
          cache: false
        }).on('autocomplete:selected', (event, suggestion) => {
          this.applySuggestion(suggestion);
          channel.emit('elements.us_autocompletion.selection', { selection: suggestion, form: elements.form[0] });
        });
      }
  }


  // Verification functionality

  parseJSON(s) {
    try {
      return JSON.parse(s);
    } catch (e) {
      console.log('Error parsing json', e);
      return { error: { message: 'DEFAULT' } };
    }
  }

  plus4(components) {
    const parts = [];
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
  denormalizeParts(data, bSecondary) {
    const sd = data.components && data.components.secondary_designator || '';
    if (data.secondary_line || !this.config.denormalize) {
      //echo exactly when configured explicitly or structurally required
      return {
        secondary_line: data.secondary_line,
        primary_line: data.primary_line
      }
    } else if (sd && bSecondary) {
      //the user entered the value in the secondary line; echo there
      const parts = data.primary_line.split(sd);
      return {
        secondary_line: `${sd} ${(parts[1]).trim()}`,
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

  formatAddressFromResponseData(data) {
    const { components } = data;
    const parts = this.denormalizeParts(data, !!this.config.elements.secondary.val());

    return {
      primary: parts.primary_line,
      secondary: parts.secondary_line,
      city: components && components.city || '',
      state: components && components.state || '',
      zip: this.config.international ? components.postal_code : this.plus4(components)
    };
  }

  /**
   * Called after Lob verifies an address. Improves/updates and caches. Optionally we can
   * disable fixing to only check if the address needs improvement.
   * @param {object} data - verified address object returned from Lob
   */
  fixAndSave(data, fix = true) {
    const { elements, international } = this.config;

    let needsImprovement = false;
    const address = this.config.address = this.formatAddressFromResponseData(data);

    for (let p in address) {
      if (address.hasOwnProperty(p)) {
        const formInput = elements[p].val();
        const dataDoesNotMatchFormInput = address[p].toUpperCase() !== formInput.toUpperCase();
        // Standard 5-digit zip input is good enough. We don't care if it doesn't match response data's zip with +4
        const zipMismatch = !(p === 'zip' && formInput.length === 5 && address[p].indexOf(formInput) === 0);

        if (dataDoesNotMatchFormInput && (!international && zipMismatch)) {
          needsImprovement = true;
        }

        if (fix) {
          elements[p].val(address[p]);
        }
      }
    }
    return needsImprovement;
  }

  resolveErrorType(message) {
    if (message === 'primary_line is required or address is required') {
      return 'primary_line';
    } else if (message === 'zip_code is required or both city and state are required') {
      return 'city_state_zip';
    } else if (message === 'zip_code must be in a valid zip or zip+4 format') {
      return 'zip';
    } else if (message === 'country is required') {
      return 'country'
    } else if (message in this.config.messages) {
      return message
    } else {
      return 'DEFAULT';
    }
  }

  /**
   * A user is assumed to have 'confirmed' an errant submission
   * when they submit the same form values twice in a row. If
   * passthrough mode, confirmation is unnecessary
   */
  isConfirmation() {
    const { address, elements, strictness } = this.config;
    if (strictness !== 'passthrough' && address) {
      for (let p in address) {
        if (address.hasOwnProperty(p) &&
          elements[p].val().toUpperCase() !== address[p].toUpperCase()) {
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
   * @param {object} this.config - Address Element configuration
   * @param {number} status - HTTP status code
   */
  isVerified(data, status) {
    const { confirmed, strictness } = this.config;
    const addressNeedsImprovement = this.fixAndSave(data, false /* fix */);
    return !status ||
      (data.deliverability === 'deliverable' && !addressNeedsImprovement) ||
      (data.deliverability === 'undeliverable' && confirmed && strictness === 'passthrough') ||
      (data.deliverability === 'deliverable_missing_unit' && confirmed && strictness !== 'strict') ||
      (data.deliverability === 'deliverable_unnecessary_unit' && confirmed && strictness !== 'strict') ||
      (data.deliverability === 'deliverable_incorrect_unit' && confirmed && strictness !== 'strict')
  }

  format(template, args) {
    for (let k in args) {
      template = template.replace("{" + k + "}", args[k])
    }
    return template;
  }

  createDidYouMeanMessage(data) {
    const { primary, secondary, city, state, zip } = this.formatAddressFromResponseData(data);
    const info = this.config.messages.confirm; // Did you mean
    const modifiedAddress = `${primary} ${secondary} ${city} ${state} ${zip}`;
    return `
      <span style=\"cursor: pointer\">
        ${info} <span style=\"text-decoration: underline\">${modifiedAddress}</span>?
      </span>
    `;
  }

  /**
   * Calls the Lob.com US Verification API. If successful, the user's form will be submitted by
   * the cb handler to its original endpoint. If unsuccessful, an error message will be shown.
   * @param {function} cb - process the response (submit the form or show an error message)
   */
  verify(cb) {
    // Preparing payload for API request
    const {
      apis,
      api_key,
      channel,
      elements: { primary, secondary, city, state, zip, country, message, form },
      messages
    } = this.config;

    this.config.international = isInternational(country);
    this.config.submit = this.config.strictness === 'passthrough';
    this.config.confirmed = this.isConfirmation();

    const payload = {
      primary_line: primary.val(),
      secondary_line: secondary.val(),
      city: city.val(),
      state: state.val()
    };

    if (this.config.international) {
      const countryVal = country.val().toLowerCase();
      payload.country = country.length === 2 ? countryVal : countryCodes[countryVal];
      payload.postal_code = zip.val();
    } else {
      payload.zip_code = zip.val();
    }

    const endpoint = this.config.international ? apis.intl_verify : apis.us_verify;
    const path = endpoint + '?av_elements_origin=' + window.location.href;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', path, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    if (api_key) {
      xhr.setRequestHeader('Authorization', 'Basic ' + btoa(api_key + ':'));
    }

    // Setting instructions based on API request result. We duplicate a copy of this object so
    // that it can be accessed inside these callback functions.
    const av = this;
    xhr.onreadystatechange = function () {
      if (this.readyState === XMLHttpRequest.DONE) {
        let data = av.parseJSON(xhr.responseText);
        let type;

        // API COMMUNICATION SUCCESSFUL: proceed with parsing response
        if ((!this.status || this.status === 200) && (!data.statusCode || data.statusCode === 200)) {
          data = data && data.body || data;

          // TOTAL SUCCESS: Address has verified and the result is considered "good" meaning the address
          // is deliverable or undeliverable but the user has confirmed submission anyway
          if (av.isVerified(data, this.status)) {
            channel.emit('elements.us_verification.verification', { code: 200, data, form: form[0] });
            cb(null, true, data);
          }
          // PARTIAL SUCCESS: Address verifired as deliverable but needs improvement. Let's ask the
          // user to confirm our suggested changes.
          else if (data.deliverability === 'deliverable') {
            const messageHtml = av.createDidYouMeanMessage(data);
            message.click(() => {
              // Mock format from API response
              av.fixAndSave(data);
              av.hideMessages();
              message.off('click');
              channel.emit('elements.us_verification.improvement', { data: data, form: form[0] });
            });
            cb({ msg: messageHtml, type: 'confirm' });
          }
          // KNOWN VERIFICATION ERROR (e.g., undeliverable): Show error message
          else {
            type = av.resolveErrorType(data.deliverability);
            channel.emit('elements.us_verification.error', { code: 200, type: 'verification', data, form: form[0] });
            cb({ msg: messages[type], type: type });
          }
        }
        // INVALID API KEY: allow form submission because we can't check the deliverability of the
        // address
        else if (this.status === 401) {
          console.log('Please sign up on lob.com to get a valid api key.');
          channel.emit('elements.us_verification.error', { code: 401, type: 'authorization', data, form: form[0] });
          cb(null, true);
        }
        // KNOWN SYSTEM ERROR (e.g., rate limit exceeded, primary line missing): Grab our pretty
        // error message to display to user.
        else {
          data = data && data.body || data;
          type = av.resolveErrorType(data.error.message);
          channel.emit('elements.us_verification.error', { code: data.error.code || 0, type, data, form: form[0] });
          cb({ msg: messages[type], type: type });
        }
      }
    };

    xhr.send(JSON.stringify(payload));
    return false;
  }

  /**
   * jQuery event handlers execute in binding order.
   * This prioritizes the most-recent (Lob)
   * @param {object} jqElm
   * @param {*} event_type
   */
  prioritizeHandler(jqElm, event_type) {
    const eventList = $._data(jqElm.get(0), 'events');
    eventList[event_type].unshift(eventList[event_type].pop());
  }

  /**
   * Called after Lob has verified an address. Based on the result we decide whether to proceed
   * submitting the address form or displaying an error to the user.
   * @param {Object?} err - Explains why an address is not ready for submission as well as how the
   *  error message should be presented. If null then the address is successful
   * @param {boolean} success - Whether the address is good for submission or not
   * @param {Object} data - API response data
   */
  verifyCallback(err, success, data = {}) {
    const { autosubmit, channel, elements, override, strictness, submit } = this.config;

    // submit means Lob strictness has been set to "passthrough". override means the user has
    // acknowledge the problem with their address but would like to submit anyway.
    if (submit || override) {
      this.showMessage(err);
      channel.emit('elements.us_verification.verification', { code: 200, data, form: elements.form[0] });
      this.config.submitted = true;
      this.config.override = false;

      elements.form.off('.avSubmit', this.preFlight.bind(this));
      elements.form.unbind('.avSubmit');
      if (autosubmit) {
        elements.form.trigger('submit');
        elements.form.get(0).submit();
      }

      elements.form.on('submit.avSubmit', this.preFlight.bind(this));
      this.prioritizeHandler(elements.form, 'submit');
      return;
    }

    // Verification result is good so let's submit the address form
    if (success) {
      this.config.submitted = true;
      this.config.override = false;

      elements.form.off('.avSubmit', this.preFlight.bind(this));
      elements.form.unbind('.avSubmit');
      if (autosubmit) {
        elements.form.trigger('submit');
        elements.form.get(0).submit();
      }

      return;
    }

    // Verification result is bad so present a message to the user
    this.showMessage(err);

    // Allow user to bypass known warnings after they see our warning message. For undeliverable
    // addresses we check strictness.
    this.config.override = strictness === 'passthrough' || (err.type === 'undeliverable'
      ? strictness === 'relaxed'
      : err.type !== 'DEFAULT' && this.config.strictness !== 'strict');
  }

  preFlight = (e) => {
    e.stopImmediatePropagation();
    e.preventDefault();

    this.hideMessages();

    // Remove event handler from previous error message
    this.config.elements.message.off('click');

    return this.verify(this.verifyCallback.bind(this));
  }

  /**
   * Injects styles, behaviors and fields necessary for address verification
   */
  configureVerification() {
    const { elements } = this.config;

    /**
     * Inject the form Verification Error Message container
     */
    if (this.pageState.create_message) {
      const message = $('<div class="lob-verify-message"></div>');

      // Determine where to place error message
      const anchor = elements.errorAnchorElement;

      if (anchor.length) {
        message.insertBefore(anchor);
      } else {
        elements.form.prepend(message);
      }
      elements.message = message;

      if (!verification_configured) {
        verification_configured = true;
        $('<style>')
          .prop('type', 'text/css')
          .html(createVerifyMessageStyles(this.config))
          .appendTo('head');
      }
    }

    if (elements.parseResultError !== '') {
      this.showMessage({ type: 'form_detection', msg: elements.parseResultError });
    }

    elements.form.on('submit.avSubmit', this.preFlight.bind(this));

    this.prioritizeHandler(elements.form, 'submit');
  }
}
