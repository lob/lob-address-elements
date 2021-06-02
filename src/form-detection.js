import { isInternational } from './international-utils.js';

/**
 * Returns a jquery element to which to add behavior, locating
 * the element using one of three methods: id, name, attribute.
 * @param {string} type - For example: primary, secondary, city
 * @returns {object}
 */
export const findElm = type => {
  const pid = $('*[data-lob-' + type + '-id]').attr('data-lob-' + type + '-id');
  if (pid) {
    return $('#' + pid);
  } else {
    const pnm = $('*[data-lob-' + type + '-name]').attr('data-lob-' + type + '-name');
    const pc = $('*[data-lob-' + type + '-class]').attr('data-lob-' + type + '-class');
    if (pnm) {
      return $('*[name=' + pnm + ']');
    } else if (pc) {
      return $('.' + pc);
    } else {
      return $('*[data-lob-' + type + ']');
    }
  }
};

/**
 * Returns the configuration value for a given @type
 * @param {string} type - One of: verify, secondary, primary, verify-message
 * @returns {object}
 */
export const findValue = type => {
  const target = findElm(type);
  const target_val = target.length && target.attr('data-lob-' + type);
  return target_val || $('*[data-lob-' + type + '-value]').attr('data-lob-' + type + '-value');
};

/**
 * Returns the form parent for a target element, @type, 
 * unless the user explicitly identifies the form to use via the
 * 'verify' label
 * @param {string} type - For example: primary, secondary, zip, etc
 * @returns {object}
 */
export const findForm = type => {
  const form = findElm('verify');
  const element = findElm(type);

  const formElement = form.length ? form
    : element.length ? findElm(type).closest('form')
    : findAddressElementByLabel(type).closest('form');

  let error = '';
  if (!formElement.length) {
    const consoleError =
      "[Lob AV Elements Error]:\tForm element not found\n" +
      "Could not find form on page.\n" +
      "Please ensure that your address form is enclosed by a form tag" +
      "For more information visit: https://www.lob.com/guides#av-elements-troubleshooting";
    error =
      "<p>" +
      "[Lob AV Elements Error]:\tForm element not found<br/>" +
      "Could not find form on page. Please ensure that your address form is enclosed by a form tag.<br/>" +
      "For more information visit <a href=\"https://www.lob.com/guides#av-elements-troubleshooting\">https://www.lob.com/guides#av-elements-troubleshooting</a>" +
      "</p>";
    console.log(consoleError);
  }

  return { form: formElement, error };
};

/**
 * Performs a localized search relative to an address component's label
 * @param {string} type - For example: primary, secondary, city
 * @returns {null || object} - a jQuery object
 */
const findAddressElementByLabel = type => {
  // Check if user already provided the form attribute. If so then no search needed.
  const elementFromID = findElm(type);
  if (elementFromID.length) {
    return elementFromID;
  }

  // jQuery selectors are case sensitive so this function will add all case variations.
  // We do this instead of overriding jQuery's selection method in case it's being used in other
  // scripts on the page.
  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
  const expandLabels = labels =>
    labels.reduce((acc, label) => [...acc, label, capitalize(label), label.toUpperCase()], []);

  const potentialLabels = {
    primary: expandLabels(['primary', 'address', 'street']),
    secondary: expandLabels(['address 2', 'secondary', 'apartment', 'suite', 'unit', 'apt', 'ste']),
    city: expandLabels(['city', 'town']),
    state: expandLabels(['state', 'province', 'county', 'region']),
    zip: expandLabels(['zip', 'postal']),
    country: expandLabels(['country'])
  };

  // Chain together the query selectors of each label
  const selector = potentialLabels[type].map(currentLabel => `:contains('${currentLabel}')`).join(', ');

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
    selections = selections.filter((idx, e) => !/address\s?2/i.test($(e).text()));
  }

  if (!selections.length) {
    return null;
  }

  // Raise an error on multiple matching labels for the user to resolve 
  if (selections.filter("label").length > 1) {
    return selections.filter("label");
  }

  // Selections are ordered from furthest to closest, so the last element most likely contains
  // the label text itself
  const label = $(selections[selections.length - 1]);
  const inputId = label.attr("for");

  if (inputId) {
    const inputSelections = $(`#${inputId}`);
    return inputSelections;
  }

  const siblingSelections = label.siblings("input");
  if (siblingSelections.length) {
    return siblingSelections;
  }

  const childSelections = label.children("input");
  if (childSelections.length) {
    return childSelections;
  }

  const parentSelections = label.parentsUntil("form", "input");
  if (parentSelections.length) {
    return parentSelections;
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

export const findPrimaryAddressInput = () => {
  const primary = findAddressElementByLabel('primary');
  const error = resolveParsingResults({ primary });
  return { primary, error };
};

export const parseWebPage = () => {
  const errorMessageElements = {
    errorAnchorElement: findElm('verify-message-anchor'),
    primaryMsg: findElm('primary-message').hide(),
    secondaryMsg: findElm('secondary-message').hide(),
    cityMsg: findElm('city-message').hide(),
    stateMsg: findElm('state-message').hide(),
    zipMsg: findElm('zip-message').hide(),
    countryMsg: findElm('country-message').hide(),
    message: findElm('verify-message').hide()
  };

  const addressElements = {
    primary: findAddressElementByLabel('primary'),
    secondary: findAddressElementByLabel('secondary'),
    city: findAddressElementByLabel('city'),
    state: findAddressElementByLabel('state'),
    zip: findAddressElementByLabel('zip'),
    country: findAddressElementByLabel('country'),
  };

  return {
    ...errorMessageElements,
    ...addressElements,
    parseResultError: resolveParsingResults(addressElements),
    form: findForm('primary').form,
  };
};
