import { findValue } from './form-detection.js';

function resolveInlineStyle(config, type, subtype) {
  return findValue(type + '-' + subtype) || config.styles[type + '-' + subtype];
}

const resolveInputDisplay = config => {
  const display = config.elements.primary.css('display');
  return display.toLowerCase() === 'block' ? 'block' : '';
}

const resolveInputWidth = config => {
  const display = config.elements.primary.css('display');
  if (display.toLowerCase() === 'block') {
    return '100%';
  } else {
    return config.elements.primary.css('width') || (config.elements.primary.outerWidth() + 'px');
  }
}

export const createAutocompleteStyles = config =>
  `.algolia-autocomplete {
    display: ${resolveInputDisplay(config)};
    width: ${resolveInputWidth(config)};
    vertical-align: middle;
  }
  .aa-dropdown-menu {
    width: 100%;
    border: 1px solid ${resolveInlineStyle(config, 'suggestion', 'bordercolor')};
    border-top: 0;
    background-color: ${resolveInlineStyle(config, 'suggestion', 'bgcolor')};
    overflow: hidden;
    border-radius: 0 0 .25rem .25rem;
    margin-top:-5px;
  }
  .aa-suggestion {
    cursor: pointer;
    padding: 6px 12px;
    color: ${resolveInlineStyle(config, 'suggestion', 'color')};
  }
  .aa-suggestion:hover,
  .aa-suggestion:active,
  .aa-suggestion.aa-cursor  {
    color: ${resolveInlineStyle(config, 'suggestion', 'activecolor')};
    background-color: ${resolveInlineStyle(config, 'suggestion', 'activebgcolor')};
  }
  .aa-suggestion div {
    white-space: nowrap !important;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .aa-suggestion span {
    font-size: .8em;
  }`;

export const createVerifyMessageStyles = config => `
  .lob-verify-message {
    background-color: ${resolveInlineStyle(config, 'err', 'bgcolor')};
    border-radius: .25rem;
    color: ${resolveInlineStyle(config, 'err', 'color')};
    display: none;
    left: 50%;
    margin-bottom: 1.5rem;
    margin-right: -50%;
    margin-top: 1.5rem;
    max-width: 100%;
    padding: .5rem;
    position: relative;
    text-align: center;
    transform: translate(-50%, 0%);
    width: 100%;
  }`;
