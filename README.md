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
First, you will need to create an account at [Lob.com](https://dashboard.lob.com/#/register) and obtain your **Live API Key**.

Once you have created an account, you can access your API Keys from the [Settings Panel](https://dashboard.lob.com/#/settings).

## Usage
Address Elements works by targeting address-related form elements and enriching their behavior. Start with a standard HTML form that collects a US address.
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
Embed the Lob Address Elements library immediately before the closing &lt;body&gt; tag. For your convenience, we host a minified version of the library at `https://cdn.lob.com/lob-address-elements/1.1.0/lob-address-elements.min.js`. Notice how important elements (those used for collecting the address) are identified using the `data.lob.*` attribute pattern.
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
      data-lob-zip-id="zip"></script>
</body>
</html>
```

| Attribute Name               | Attribute Value(s)    | Description         |
| :---                         |  :---                 |   :---              |
| data-lob-key          | `<lob key>`           | Include your Lob live public key as the attribute value. It will use the format `live_pub_*` and is available via the [Lob Dashboard](https://dashboard.lob.com/#/settings).        |
| data-lob-verify-value           | `strict`, `normal`, `relaxed`, `passthrough`          | Include this attribute to pre-verify the user's address submission with Lob.  Choose `relaxed` as the attribute value, if you wish to allow users to submit an errant form once they have been warned. Their resubmission of an unchanged form will be used to indicate their preference to override and submit. Choose `normal` (the default) to halt any submissions that Lob deems undeliverable, while still allowing all other inconsistencies to be submitted once the user has confirmed their choice. Choose `strict` to halt any submission that does not pass verification, including minor errors like missing or unnecessary units. Finally, if you wish to verify an address and then submit regardless of the verification result, choose `passthrough`. This is useful for stateful forms that support repeated submissions. |
| data-lob-primary-value          | `false`      | This is an optional attribute. Set to `false` to disable address autocompletion and only use address verification.        |
| data-lob-primary-id          | `<field id>`      | This attribute identifies the primary address field. Set it to the ID for the field to target.         |
| data-lob-secondary-value          | `false`      | This is an optional attribute. Set to `false` to force the suite or unit number to render on the primary address line during address verification.         |
| data-lob-secondary-id          | `<field id>`      | This attribute identifies the secondary address field. Set it to the ID for the field to target.         |
| data-lob-city-id          | `<field id>`      | This attribute identifies the city field. Set it to the ID for the field to target.         |
| data-lob-state-id          | `<field id>`      | This attribute identifies the state field. Set it to the ID for the field to target.         |
| data-lob-zip-id          | `<field id>`      | This attribute identifies the zip field. Set it to the ID for the field to target.         |
| data-lob-primary-message-id  | `<field id>`           | This optional attribute identifies where to display field-level error messages that affect the primary address field.           |
| data-lob-secondary-message-id | `<field id>`          | This optional attribute identifies where to display field-level error messages that affect the secondary address field.         |
| data-lob-city-message-id      | `<field id>`         | This optional attribute identifies where to display field-level error messages that affect the city field.           |
| data-lob-state-message-id     | `<field id>`          | This optional attribute identifies where to display field-level error messages that affect the state field.           |
| data-lob-zip-message-id       | `<field id>`         | This optional attribute identifies where to display field-level error messages that affect the zip code field.           |

## Preconfigured Usage
E-commerce platforms like Shopify can be easily enhanced using a pre-configured instance of Address Elements. 

For example, update the following script to use your Lob public key (`lob_pub_xxx`) and then paste into your top-level Shopify Plus template to add advanced Address Verifiation behaviors to your checkout form.

```
    <script src="https://cdn.lob.com/lob-address-elements/1.1.0/lob-address-elements.min.js"
      data-lob-key="live_pub_xxx"
      data-lob-verify-value="strict"
      data-lob-primary-value="false"
      data-lob-primary-id="checkout_shipping_address_address1"
      data-lob-secondary-id="checkout_shipping_address_address2"
      data-lob-city-id="checkout_shipping_address_city"
      data-lob-state-id="checkout_shipping_address_province"
      data-lob-zip-id="checkout_shipping_address_zip"
      data-lob-error-bgcolor="#006eff"
      data-lob-error-color="#ffffff"></script>
</body>
</html>

```
*NOTE: This example uses `strict` as the verification level, but you may choose `normal`, or `relaxed` depending upon your Shopify use case.*

## Component Styles
You may customize the color and style for the address suggestion list.
Two approaches are supported. 

### In-line Declarations
In this example, the colors are declared in-ine, which means
the address elements library will automatically inject a stylesheet with all CSS styles necessary to style the suggestion list. 
Hex, RGB and named color values are supported when declaring styles in-line.

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
      data-lob-error-bgcolor="#006eff"
      data-lob-error-color="#ffffff"></script>
</body>
</html>
```
| Attribute Name                    | Attribute Value(s)    | Description         |
| :---                              |  :---                 |   :---              |
| data-lob-suggestion-color         | <`color`, `hex`, `rgb`>           | The text color for an item in the suggestion list.       |
| data-lob-suggestion-bgcolor       | <`color`, `hex`, `rgb`>           | The background color for an item in the suggestion list.     |
| data-lob-suggestion-bordercolor   | <`color`, `hex`, `rgb`>           | The border color for the suggestion list.      |
| data-lob-suggestion-activecolor   | <`color`, `hex`, `rgb`>           | The text color for an item in the suggestion list when actively hovered over or when traversed via the keyboard.         |
| data-lob-suggestion-activebgcolor | <`color`, `hex`, `rgb`>           | The background color for an item in the suggestion list when actively hovered over or when traversed via the keyboard.    |
| data-lob-error-color   | <`color`, `hex`, `rgb`>           | The text color to use when rendering a form-level error message when the form fails verification.         |
| data-lob-error-bgcolor | <`color`, `hex`, `rgb`>           | The background color to use when rendering a form-level error message when the form fails verification    |

### Stylesheet Declarations

In this example, all styles for the address suggestion list are declared using a CSS stylesheet. When using this approach, it is useful to also include the `data-lob-suggestion-stylesheet` attribute to stop the Address Elements library from loading its default stylesheet.

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

        .validation_error_message {
            display:none;
            padding:12px;
            font-size:1.2em;
            background-color:lightyellow;
            border-radius: .25rem;
            margin-bottom:20px;
        }

        .algolia-autocomplete {
            width: auto;
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
      data-lob-suggestion-stylesheet
      data-lob-verify-value="strict"
      data-lob-primary-id="address1"
      data-lob-secondary-id="address2"
      data-lob-city-id="city"
      data-lob-state-id="state"
      data-lob-zip-id="zip"></script>
</body>
</html>
```

| Attribute Name                 | Attribute Value(s)  | Description         |
| :---                              |  :---                 |   :---              |
| data-lob-suggestion-stylesheet | N/A                 | Use this flag to stop the Address Elements library from loading its default stylesheet. You will be responsible for all styles and colors using a stylesheet under your control.    |


# Init
By default, Address Elements will scan the page, looking for the necessary tags. However, with single page applications, the HTML elements may not be present when the library loads, and will therefore not create the necessary form bindings. In such a case, you can call `LobAddressElements.do.init()`, and Address Elements will re-scan the HTML on the page, and create all necessary bindings.

# Localization
It is possible to localize and customize verification messages returned by Lob's verification API. This customization requires a JavaScript configuration file be declared alongside the Lob &lt;script&gt; tag. Customize the value for any message to override.

```

<!DOCTYPE html>
<html>
<body>
    <form action="/some/url" 
        data-lob-verify="relaxed" 
        data-lob-key="live_pub_xxxxxx">

        <div data-lob-verify-message></div>
        <div>
            <label for="street1">Street 1</label>
            <input id="street1" data-lob-primary>
        </div>
        <div>
            <label for="street2">Street 2</label>
            <input id="street2" data-lob-secondary>
        </div>
        <div>
            <label for="city">City</label>
            <input id="city" data-lob-city>
        </div>
        <div>
            <label for="state">State</label>
            <input id="state" data-lob-state>
        </div>
        <div>
            <label for="zip">Zip</label>
            <input id="zip" data-lob-zip>
        </div>
        <input type="submit" value="Submit">
    </form>
    <script>
        var LobAddressElementsConfig = {
            messages: {
                primary_line: 'Enter the Primary address.',
                city_state_zip: 'Enter City and State (or Zip).',
                zip: 'Enter a valid Zip.',
                undeliverable: 'The address could not be verified.',
                deliverable_missing_unit: 'Enter a Suite or Unit.',
                deliverable_unnecessary_unit: 'Suite or Unit unnecessary.',
                deliverable_incorrect_unit: 'Incorrect Unit. Please confirm.',
                notify: 'The address has been standardized.',
                confirm: 'The address has been standardized. Please confirm and resubmit.',
                DEFAULT: 'Unknown Error. The address could not be verified.'
            }
        };
    </script>
    <script src="/lob-address-elements.js"></script>
</body>
</html>
```

## Examples

We've provided various examples for you to try out [here](https://github.com/lob/lob-address-elements/tree/master/examples).

These represent a range of HTML forms and environments you may find similar to your own. Review each for relevant examples for how to use and configure Address Elements.

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

Minified builds are available [here](https://github.com/lob/lob-address-elements/tree/master/lib) and map to the build numbers listed below.

### 1.1.0 (CURRENT / LATEST)
| Release Notes |
| :---          |
| [Feature] Target HTML elements are enriched in real time as soon as they they appear in the DOM. |
| [Feature] Target HTML elements can now be indentified using a flexible addressing scheme. This includes element IDs, element names, and data attributes. |
| [Feature] An HTML element for displaying form-level errors is now optional and will be added to the DOM when missing from the target form. |
| [Fix] The address suggestion list is now positioned correctly on-screen when the target HTML input elements use the `inline` display style.  |

### 1.0.0 / 0.1.0 (beta)
| Release Notes |
| :---          |
| Initial public release.|

----------

Copyright &copy; 2020 Lob.com

Released under the MIT License, which can be found in the repository in `LICENSE.txt`.