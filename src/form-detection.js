import { isInternational } from './international-utils.js';

/**
 * filters elms, returning only descendnt elms
 * @param {*} elms - jquery elements
 * @param {*} [form] - if present, filter for descendnt elms
 * @returns 
 */
const closest = (elms, form) => {
  if (form && form.length && elms && elms.length) {
    let elm;
    elms.each(function (idx, _elm) {
      if (form.is(_elm.closest("form"))) {
        elm = $(_elm);
      }
    });
    return elm || elms;
  }
  return elms;
};

/**
 * Returns a jquery element to which to add behavior, locating
 * the element using one of three methods: id, name, attribute.
 * @param {string} type - For example: primary, secondary, city
 * @returns {object}
 */
export const findElm = (type, form = null) => {
  let elms;
  const pid = $('*[data-lob-' + type + '-id]').attr('data-lob-' + type + '-id');

  if (pid) {
    elms = $('*[id=' + pid + ']');
  } else {
    const pnm = $('*[data-lob-' + type + '-name]').attr('data-lob-' + type + '-name');
    const pc = $('*[data-lob-' + type + '-class]').attr('data-lob-' + type + '-class');
    if (pnm) {
      elms = $('*[name=' + pnm + ']');
    } else if (pc) {
      elms = $('.' + pc);
    } else {
      elms = $('*[data-lob-' + type + ']');
    }
  }

  return closest(elms, form);
};

/**
 * Returns the configuration value for a given @type
 * @param {string} type - One of: verify, secondary, primary, verify-message
 * @param {object} form - The container to restrict our search in
 * @returns {object}
 */
export const findValue = (type, form) => {
  const target = findElm(type, form);
  const target_val = target.length && target.attr('data-lob-' + type);
  return target_val || $('*[data-lob-' + type + '-value]').attr('data-lob-' + type + '-value');
};

/**
 * Adds all case variations for a given label to work around jQuery's case sensitivity. We do this
 * instead of overriding jQuery's selection method in case it's being used in other scripts on the page.
 */
const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
const expandLabels = labels =>
  labels.reduce((acc, label) => [...acc, label, capitalize(label), label.toUpperCase()], []);

const addressKeyWords = {
  primary: expandLabels(['primary', 'address', 'address1', 'street']),
  secondary: expandLabels(['address 2', 'address2', 'street 2', 'secondary', 'apartment', 'suite', 'building', 'unit', 'apt', 'ste', 'bldg']),
  city: expandLabels(['city', 'town']),
  state: expandLabels(['state', 'province', 'county', 'district', 'municipality']),
  zip: expandLabels(['zip', 'postal', 'postcode']),
  country: expandLabels(['country'])
};

/**
 * Checks if a form attribute was provided for us in the AV Elements script tag. If so, we locate
 * the element directly.
 * @param {string} type - For example: primary, secondary, city
 * @param {object} form - The container to restrict our search in
 * @returns {null || object} - a jQuery object
 */
const findAddressElementById = (type, form) => {
  const elementFromID = findElm(type, form);
  return elementFromID.length ? elementFromID : null;
};

/**
 * Performs a localized search relative to an address component's label
 * @param {string} type - For example: primary, secondary, city
 * @param {object} form - When multiple elements are found, the one closest to form is selected
 * @returns {null || object} - a jQuery object
 */
const findAddressElementByLabel = (type, form) => {
  // Chain together the query selectors for every variation of a given label.
  const selector = addressKeyWords[type].map(currentLabel => `:contains('${currentLabel}')`).join(', ');

  /**
   * When searching for the primary line we clarify two variations of an address form:
   *    Form A           Form B
   *    Address 1        Address
   *    Address 2        Apartment, Suite, Unit, etc.
   * Matching on "Address" would include the secondary label and raise an error, so we exclude
   * it in the selector.
   */
  let selections = $(selector);
  if (type === 'primary') {
    selections = selections.filter((idx, e) => !/(address|street)\s?2/i.test($(e).text()));
  }
  if (!selections.length) {
    return null;
  }

  const labels = selections.filter("label");

  const getInputSelections = label => {
    const inputId = label.htmlFor;
    if (inputId) {
      const inputSelections = $(`*[id=${inputId}]`);
      return inputSelections;
    }

    const siblingSelections = $(label).siblings("input");
    if (siblingSelections.length) {
      return siblingSelections;
    }

    const childSelections = $(label).children("input");
    if (childSelections.length) {
      return childSelections;
    }

    const parentSelections = $(label).parentsUntil("form", "input");
    if (parentSelections.length) {
      return parentSelections;
    }

    return $();
  }

  let inputSelections = $();

  labels.each((idx, label) => {
    const selections = getInputSelections(label);
    inputSelections = inputSelections.add(selections);
  });

  return inputSelections.length ? closest(inputSelections, form) : null;
};

/**
 * Searches for inputs related to an address component (by including such terms in their attributes)
 * @param {string} type - For example: primary, secondary, city
 * @returns {null || object} - a jQuery object
 */
const findAddressElementByInput = type => {
  const modifiedAddressKeyWords = { ...addressKeyWords };

  // Include 'address' because attribute values typically don't have spaces so 'address 2' would not show up
  if(type === 'secondary') {
    modifiedAddressKeyWords.secondary = modifiedAddressKeyWords.secondary.concat(expandLabels(['address']));
  }

  // Chain together the query selectors for every variation of a given label.
  const selector = modifiedAddressKeyWords[type].map(currentLabel =>
    `input[id*='${currentLabel}'], select[id*='${currentLabel}']`
  ).join(', ');
  
  // We account for the same edge case mentioned in the selector of findAddressElementsByLabels.
  // In this scenario, attribute values for primary and secondary inputs are typically numbered
  // 1 and 2 respectively.
  let inputs = $(selector);
  if (type === 'primary') {
    inputs = inputs.filter(":not(input[name*='2']):not(input[for*='2']):not(input[id*='2'])");
  } else if (type === 'secondary') {
    inputs = inputs.filter(":not(input[name*='1']):not(input[for*='1']):not(input[id*='1'])");
  }

  if (inputs.length) {
    return inputs;
  }

  return null;
};

const resolveParsingResults = addressElements => {
  let parseResultError = ''; 

  const international = isInternational(addressElements.country);

  const missingElements = Object.keys(addressElements).filter(key => {
    // Omit country input in case form is domestic only
    if (key === 'country') {
      return false;
    }

    // Some countries like Germany, state is optional and may not exist in their address forms
    if (key === 'state' && international) {
      return false;
    }

    const searchResult = addressElements[key];
    return searchResult === null || (searchResult && searchResult.length === 0);
  });

  const multipleElements = Object.keys(addressElements).filter(key => {
    const searchResult = addressElements[key];
    return searchResult && searchResult.filter(":visible").length > 1;
  });

  if (missingElements.length) {
    const formElementNames = missingElements.length > 1 
      ? `${missingElements.slice(0, -1).join(', ')}, and ${missingElements.slice(-1)}`
      : missingElements[0].toString();
    const formElementAttributes = missingElements.map(name => `data-lob-${name}-id`).join(', ');
    const consoleMessage =
      `[Lob AV Elements Error]:\tMissing form elements\n` +
      `Could not find inputs for ${formElementNames}.\n` +
      `Please add the following attributes to the AV elements script: ${formElementAttributes}\n` +
      `For more information visit: https://www.lob.com/guides#av-elements-troubleshooting`;
    const htmlMessage =
      "<p style=\"text-align: left\">" +
      "[Lob AV Elements Error] Missing form elements<br/>" +
      `Could not find inputs for ${formElementNames}. ` +
      `Please add the following attributes to the AV elements script: <strong>${formElementAttributes}</strong>.<br/>` +
      "For more information visit <a href=\"https://www.lob.com/guides#av-elements-troubleshooting\">https://www.lob.com/guides#av-elements-troubleshooting</a>" +
      "</p>";
  
    console.error(consoleMessage);
    parseResultError = htmlMessage;
  }
  
  if (multipleElements.length) {
    const formElementNames = multipleElements.length > 1
      ? `${multipleElements.slice(0, -1).join(', ')}, and ${multipleElements.slice(-1)}`
      : multipleElements[0].toString();
    const formElementAttributes = multipleElements.map(name => `data-lob-${name}-id`).join(', ');
    const consoleMessage =
      `[Lob AV Elements Error]:\tDuplicate form elements\n` +
      `Multiple form elements were found for ${formElementNames}.\n` +
      `Please specify them by adding the following attributes to the AV elements script: ${formElementAttributes}\n` +
      `For more information visit: https://www.lob.com/guides#av-elements-troubleshooting`;
    const htmlMessage =
      "<p style=\"text-align: left\">" +
      "[Lob AV Elements Error] Duplicate form elements<br/>" +
      `Multiple form elements were found for ${formElementNames}. ` +
      `Please specify them by adding the following attributes to the AV elements script: <strong>${formElementAttributes}</strong>.<br/>` +
      "For more information visit <a href=\"https://www.lob.com/guides#av-elements-troubleshooting\">https://www.lob.com/guides#av-elements-troubleshooting</a>" +
      "</p>";
  
    console.error(consoleMessage);
    parseResultError = parseResultError + htmlMessage;
  }

  return parseResultError;
};


// Helper function to confirm presence of an address form
export const findPrimaryAddressInput = () => {
  const elementsById = findAddressElementById('primary') ||  $();
  const elementsByLabel = findAddressElementByLabel('primary') || $();
  const elementsByInput = findAddressElementByInput('primary') || $();
  return elementsById.add(elementsByLabel).add(elementsByInput);
};

export const parseWebPage = form => {
  const errorMessageElements = {
    errorAnchorElement: findElm('verify-message-anchor', form),
    primaryMsg: findElm('primary-message', form).hide(),
    secondaryMsg: findElm('secondary-message', form).hide(),
    cityMsg: findElm('city-message', form).hide(),
    stateMsg: findElm('state-message', form).hide(),
    zipMsg: findElm('zip-message', form).hide(),
    countryMsg: findElm('country-message', form).hide(),
    message: findElm('verify-message', form).hide()
  };

  // Walk through detection strategies for each address component
  const addressElements = {};
  ['primary', 'secondary', 'city', 'state', 'zip', 'country'].forEach(type => {
    addressElements[type] = findAddressElementById(type, form);

    if (!addressElements[type]) {
      addressElements[type] = findAddressElementByLabel(type, form);
    }

    if (!addressElements[type] || (addressElements[type] && addressElements[type].length > 1)) {
      addressElements[type] = findAddressElementByInput(type);
    }
  });

  return {
    ...errorMessageElements,
    ...addressElements,
    parseResultError: resolveParsingResults(addressElements),
    form,
  };
};
