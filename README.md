# lob-address-elements
The Lob Address Elements library simplifies client side integration of Lob's *US Address Autocompletion* and *US Address Verification* APIs. Use it to enrich any standard HTML page to include both autocompletion and pre-verification behaviors.

## Table of Contents
- [Registration](#registration)
- [Usage](#usage)
- [Preconfigured Usage](#preconfigured-usage)
- [Component Styles](#component-styles)
  - [In-line Declarations](#in-line-declarations)
  - [Stylesheet Declarations](#stylesheet-declarations)
- [Localization](#localization)
- [Init](#init)
- [Examples](#examples)
- [Contributing](#contributing)
- [Building](#building)
- [Releases](#releases)

## Registration
Create an account at [Lob.com](https://dashboard.lob.com/#/register) to obtain a **Live Public API Key**. The key is available in the [Lob Settings Panel](https://dashboard.lob.com/#/settings) and uses the format, `live_pub_*`.

## Usage
Address Elements works by targeting address-related form elements and enriching their behavior. Start with a standard HTML form for collecting a US address.
```
<!DOCTYPE html>
<html>
<body>
  <form action="/api/v1/add-address">
    <div>
      <label for="address1">Address 1</label>
      <input id="address1">
    </div>
    <div>
      <label for="address2">Address 2</label>
      <input id="address2">
    </div>
    <div>
      <label for="city">City</label>
      <input id="city">
    </div>
    <div>
      <label for="state">State</label>
      <input id="state">
    </div>
    <div>
      <label for="zip">Zip</label>
      <input id="zip">
    </div>
    <input type="submit" value="Submit">
  </form>
</body>
</html>
```
Embed the Lob Address Elements library immediately before the closing &lt;body&gt; tag. Configure and customize using the `data-lob-*` attribute pattern. For your convenience, Lob hosts a minified version at `cdn.lob.com`. 
```
<!DOCTYPE html>
<html>
<body>
  <form action="/api/v1/add-address">
    <div>
      <label for="address1">Address 1</label>
      <input id="address1">
      <div id="address1_err" class="err"></div>
    </div>
    <div>
      <label for="address2">Address 2</label>
      <input id="address2">
    </div>
    <div>
      <label for="city">City</label>
      <input id="city">
    </div>
    <div>
      <label for="state">State</label>
      <input id="state">
    </div>
    <div>
      <label for="zip">Zip</label>
      <input id="zip">
    </div>
    <input type="submit" value="Submit">
  </form>
  <script src="https://cdn.lob.com/lob-address-elements/1.1.0/lob-address-elements.min.js"
    data-lob-key="live_pub_xxx" 
    data-lob-verify-value="strict"
    data-lob-primary-id="address1"
    data-lob-secondary-id="address2"
    data-lob-city-id="city"
    data-lob-state-id="state"
    data-lob-zip-id="zip"
    data-lob-primary-message-id="address1_err"></script>
</body>
</html>
```

| Attribute Name    | Attribute Value(s)   | Description      |
| :---          |  :---                 |   :---              |
| data-lob-key          | `<lob key>`           | Include your Lob live public key as the attribute value. It will use the format `live_pub_*` and is available via the [Lob Dashboard](https://dashboard.lob.com/#/settings).        |
| data-lob-verify-value           | `strict`, `normal`, `relaxed`, `passthrough`, `false`         | Include this attribute to pre-verify the user's address submission with Lob.  Choose `relaxed` as the attribute value, if you wish to allow users to submit an errant form once they have been warned. Their resubmission of an unchanged form will be used to indicate their preference to override and submit. Choose `normal` (the default) to halt any submissions that Lob deems undeliverable, while still allowing all other inconsistencies to be submitted once the user has confirmed their choice. Choose `strict` to halt any submission that does not pass verification, including minor errors like missing or unnecessary units. If you wish to verify an address and then submit regardless of the verification result, choose `passthrough`. This is useful for stateful forms that support repeated submissions. Enter `false` if you plan to use Address elements for autocompletion but **not** for verification. |
| data-lob-primary-value          | `false`      | This is an optional attribute. Set to `false` to disable address autocompletion and only use address verification.        |
| data-lob-primary-id          | `<field id>`      | This attribute identifies the primary address field. Set it to the ID for the field to target.         |
| data-lob-secondary-value          | `false`      | This is an optional attribute. Set to `false` to force the suite or unit number to render on the primary address line during address verification.         |
| data-lob-secondary-id          | `<field id>`      | This attribute identifies the secondary address field. Set it to the ID for the field to target.         |
| data-lob-city-id          | `<field id>`      | This attribute identifies the city field. Set it to the ID for the field to target.         |
| data-lob-state-id          | `<field id>`      | This attribute identifies the state field. Set it to the ID for the field to target.         |
| data-lob-zip-id          | `<field id>`      | This attribute identifies the zip field. Set it to the ID for the field to target.         |
| data-lob-verify-message-anchor-id  | `<field id>`  | This optional attribute will place the general error message **before** the element with the id provided. |
| data-lob-verify-message-anchor-class  | `<field id>`  | An alternative to `data-lob-verify-message-anchor-id` to search for the target element by class name. |
| data-lob-primary-message-id  | `<field id>`           | This optional attribute identifies the field-level error message for the primary address input. Only include this attribute if the primary address input has an associated error message. Lob will update the text content for this element and toggle its display. *In the example above, a field-level error message has been added to the primary input field, showing its usage.*       |
| data-lob-secondary-message-id | `<field id>`          | This optional attribute identifies the field-level error message for the secondary address input. Only include this attribute if the secondary address input has an associated error message. Lob will update the text content for this element and toggle its display.         |
| data-lob-city-message-id      | `<field id>`         | This optional attribute identifies the field-level error message for the city input. Only include this attribute if the city input has an associated error message. Lob will update the text content for this element and toggle its display.           |
| data-lob-state-message-id     | `<field id>`          | This optional attribute identifies the field-level error message for the state input. Only include this attribute if the state input has an associated error message. Lob will update the text content for this element and toggle its display.           |
| data-lob-zip-message-id       | `<field id>`         | This optional attribute identifies the field-level error message for the zip input. Only include this attribute if the zip input has an associated error message. Lob will update the text content for this element and toggle its display.           |

## Preconfigured Usage
E-commerce platforms like Shopify use predictable element names making them easy to extend. Paste the following preconfigured script into your top-level Shopify Plus template to add address verification to your checkout form. *Remember to replace `live_pub_xxx` with your Lob public key.*

```
<script src="https://cdn.lob.com/lob-address-elements/1.1.0/lob-address-elements.min.merged.js"
  data-lob-key="live_pub_xxx"
  data-lob-verify-value="strict"
  data-lob-primary-value="false"
  data-lob-primary-id="checkout_shipping_address_address1"
  data-lob-secondary-id="checkout_shipping_address_address2"
  data-lob-city-id="checkout_shipping_address_city"
  data-lob-state-id="checkout_shipping_address_province"
  data-lob-zip-id="checkout_shipping_address_zip"
  data-lob-err-bgcolor="#006eff"
  data-lob-err-color="#ffffff"></script>
```
*NOTE: Many E-commerce platforms have strict content security policies that prevent scripts from loading additional content. Embed the `merged` build of Address Elements to handle these situations as shown in the example above (lob-address-elements.min.merged.js). This ensures all dependencies are included in the download.*

## Component Styles
When *address verification* is enabled, Lob will inject an HTML element into the target form in order to communicate form-level error messages. Similarly, when *address autocompletion* is enabled, Lob will inject an HTML element to contain suggested addresses. 

In general, it's easy to customize colors and backgrounds for these elements using in-line color declarations. If, however, you require more advanced customization, you must include a custom CSS stylesheet. These options are described in the following two sections. 

### In-line Configuration
In-line configuration uses attribute values to configure element colors. Hex, RGB and named color formats are supported.

```
<!DOCTYPE html>
<html>
<body>
  <form action="/api/v1/add-address">
    <div>
      <label for="address1">Address 1</label>
      <input id="address1">
    </div>
    <div>
      <label for="address2">Address 2</label>
      <input id="address2">
    </div>
    <div>
      <label for="city">City</label>
      <input id="city">
    </div>
    <div>
      <label for="state">State</label>
      <input id="state">
    </div>
    <div>
      <label for="zip">Zip</label>
      <input id="zip">
    </div>
    <input type="submit" value="Submit">
  </form>
  <script src="https://cdn.lob.com/lob-address-elements/1.1.0/lob-address-elements.min.js"
    data-lob-key="live_pub_xxx" 
    data-lob-verify-value="strict"
    data-lob-primary-id="address1"
    data-lob-secondary-id="address2"
    data-lob-city-id="city"
    data-lob-state-id="state"
    data-lob-zip-id="zip"
    data-lob-suggestion-color="#666666"
    data-lob-suggestion-bgcolor="#fefefe" 
    data-lob-suggestion-bordercolor="#a8a8a8"
    data-lob-suggestion-activecolor="red" 
    data-lob-suggestion-activebgcolor="#eeeeee"
    data-lob-err-bgcolor="#006eff"
    data-lob-err-color="#ffffff"></script>
</body>
</html>
```
| Attribute Name                    | Attribute Value(s)    | Description         |
| :---                              |  :---                 |   :---              |
| data-lob-suggestion-color         | <`color`/`hex`/`rgb`>           | The text color for an item in the suggestion list.       |
| data-lob-suggestion-bgcolor       | <`color`/`hex`/`rgb`>           | The background color for an item in the suggestion list.     |
| data-lob-suggestion-bordercolor   | <`color`/`hex`/`rgb`>           | The border color for the suggestion list.      |
| data-lob-suggestion-activecolor   | <`color`/`hex`/`rgb`>           | The text color for an item in the suggestion list when actively hovered over or when traversed via the keyboard.         |
| data-lob-suggestion-activebgcolor | <`color`/`hex`/`rgb`>           | The background color for an item in the suggestion list when actively hovered over or when traversed via the keyboard.    |
| data-lob-err-color   | <`color`/`hex`/`rgb`>           | The text color to use when rendering a form-level error message when the form fails verification.         |
| data-lob-err-bgcolor | <`color`/`hex`/`rgb`>           | The background color to use when rendering a form-level error message when the form fails verification    |

### Stylesheet Declarations

Although more complex, a custom stylesheet gives full control over element styles. All necessary CSS classes have been provided in the example below. Override each class as necessary for full customization.

When authoring a custom stylesheet, Lob's default stylesheet should be suppressed using the `data-lob-suggestion-stylesheet` attribute (also shown in the example below).

```
<!DOCTYPE html>
<html>
<head>
  <style>
    * {
      box-sizing: border-box;
      font-family: sans-serif;
      color:#333333;
    }

    input {
      display: block;
      font-size: 1.05rem;
      width: 100%;
      padding: 10px;
      border-radius: .25rem;
      border: solid 1px #8c8c8c;
      margin: 0;
    }

    label {
      display: block;
      font-size: 1.1rem;
      margin: 20px 0 5px 0;
    }

    input[type='submit'] {
      background-color: #0594d8;
      color: #ffffff;
      border-color: #ffffff;
      font-size: 1.1rem;
      margin-top: 10px;
      width: 100px;
    }

    .lob-verify-message {
      padding:12px;
      font-size:1.2em;
      background-color:lightyellow;
      border-radius: .25rem;
      margin-bottom:20px;
    }

    .algolia-autocomplete {
      width: 100%; /* unnecessary for inline-block inputs */
    }

    .algolia-autocomplete .aa-dropdown-menu {
      width: 100%;
      border: 1px solid #a8a8a8;
      border-top: 0;
      background-color: #fefefe;
      overflow: hidden;
      border-radius: 0 0 .25rem .25rem;
      margin-top:-5px;
    }

    .algolia-autocomplete .aa-suggestion {
      cursor: pointer;
      padding: 12px;
      color: #666666;
    }

    .algolia-autocomplete .aa-suggestion:hover,
    .algolia-autocomplete .aa-suggestion:active,
    .algolia-autocomplete .aa-suggestion.aa-cursor {
      color: #0594d8;
      background-color: #eeeeee;
    }

    .algolia-autocomplete .aa-suggestion div {
      white-space: nowrap !important;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .algolia-autocomplete .aa-suggestion span {
      font-size: .8em;
    }
  </style>
</head>
<body>
  <form action="/api/v1/add-address">
    <div>
      <label for="address1">Address 1</label>
      <input id="address1">
    </div>
    <div>
      <label for="address2">Address 2</label>
      <input id="address2">
    </div>
    <div>
      <label for="city">City</label>
      <input id="city">
    </div>
    <div>
      <label for="state">State</label>
      <input id="state">
    </div>
    <div>
      <label for="zip">Zip</label>
      <input id="zip">
    </div>
    <input type="submit" value="Submit">
  </form>
  <script src="https://cdn.lob.com/lob-address-elements/1.1.0/lob-address-elements.min.js"
    data-lob-key="live_pub_xxx"
    data-lob-suggestion-stylesheet="false"
    data-lob-verify-value="strict"
    data-lob-primary-id="address1"
    data-lob-secondary-id="address2"
    data-lob-city-id="city"
    data-lob-state-id="state"
    data-lob-zip-id="zip"></script>
</body>
</html>
```

| Attribute Name         | Attribute Value(s)  | Description         |
| :---                   |  :---                 |   :---              |
| data-lob-suggestion-stylesheet | `false`       | Use this flag to stop the Address Elements library from loading its default stylesheet.   |


# Init
Address Elements continually monitors changes to the HTML DOM, looking for address-related fields to enrich. This behavior is available in all evergreen browsers and IE11+. If you anticipate needing support for IE9/10, call `LobAddressElements.do.init()` to manually trigger a page scan and initialize address-related fields.

# Localization
Verification error messages can be localized and customized. Use the pattern, `data-lob-err-*`.

```
<!DOCTYPE html>
<html>
<body>
  <form action="/api/v1/add-address">
    <div>
      <label for="address1">Address 1</label>
      <input id="address1">
    </div>
    <div>
      <label for="address2">Address 2</label>
      <input id="address2">
    </div>
    <div>
      <label for="city">City</label>
      <input id="city">
    </div>
    <div>
      <label for="state">State</label>
      <input id="state">
    </div>
    <div>
      <label for="zip">Zip</label>
      <input id="zip">
    </div>
    <input type="submit" value="Submit">
  </form>
  <script src="https://cdn.lob.com/lob-address-elements/1.1.0/lob-address-elements.min.js"
    data-lob-key="live_pub_xxx" 
    data-lob-verify-value="strict"
    data-lob-primary-id="address1"
    data-lob-secondary-id="address2"
    data-lob-city-id="city"
    data-lob-state-id="state"
    data-lob-zip-id="zip"
    data-lob-err-primary-line="Enter the Primary address."
    data-lob-err-city-state-zip="Enter City and State (or Zip)."
    data-lob-err-zip="Enter a valid Zip."
    data-lob-err-undeliverable="The address could not be verified."
    data-lob-err-missing-unit="Enter a Suite or Unit."
    data-lob-err-unnecessary-unit="Suite or Unit unnecessary."
    data-lob-err-incorrect-unit="Incorrect Unit. Please confirm."
    data-lob-err-notify="The address has been standardized."
    data-lob-err-confirm="The address has been standardized. Please confirm and resubmit."
    data-lob-err-default="Unknown Error. The address could not be verified."></script>
</body>
</html>
```

## Examples

This repo includes several [example](https://github.com/lob/lob-address-elements/tree/master/examples) implementations. These represent a range of HTML forms and environments that may be similar to your own.

## Contributing

To contribute, please see the [CONTRIBUTING.md](https://github.com/lob/lob-node/blob/master/CONTRIBUTING.md) file.

## Building

The minified version of the Address Elements library is available for download from the Lob CDN. You do not need to clone the Github repo to use in your Website. 

If you do decide to fork and build your own instance of Address Elements, we have provided build tools for minifying your source. Execute via the CLI 

*NOTE: Replace `1.1.0` with the version number you wish to bind to the minified file name.*
```
npm run build 1.1.0
```

## Releases

[Minified builds](https://github.com/lob/lob-address-elements/tree/master/lib) map to the releases listed below.

### 1.2.0 (CURRENT / LATEST)
| Release Notes |
| :---          |
| Form-level verification error message can be placed before any other element |

### 1.1.0
| Release Notes |
| :---          |
| Target HTML elements are enriched in real time as soon as they appear in the DOM. |
| Target HTML elements are identifiable using a flexible addressing scheme. This includes element IDs, element names, and in-line data attributes. |
| An HTML element for displaying form-level errors is now optional and will be added to the DOM when missing from the target form. |
| Form verification error messages can be localized using HTML attributes. Previous versions required a JSON configuration object. |
| [Fix] The address suggestion list is now positioned correctly on-screen when the target HTML input elements use the `inline` display style.  |
| [Fix] If the Lob Public API key becomes invalid for any reason, form verification will be disabled and the form will submit as it did before Address Elements was added to the page.  |

### 1.0.0 / 0.1.0 (beta)
| Release Notes |
| :---          |
| Initial public release.|

----------

Copyright &copy; 2020 Lob.com

Released under the MIT License, which can be found in the repository in `LICENSE.txt`.