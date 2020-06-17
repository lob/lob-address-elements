# lob-address-elements
The Lob Address Elements library simplifies client side integration of Lob's *US Address Autocompletion* and *US Address Verification* APIs. Use it to enrich any standard HTML page to include both autocompletion and pre-verification behaviors.

## Table of Contents
- [Registration](#registration)
- [Usage](#usage)
- [Component Styles](#component-styles)
  - [In-line Declarations](#in-line-declarations)
  - [Stylesheet Declarations](#stylesheet-declarations)
- [Localization](#localization)
- [Examples](#examples)
- [Contributing](#contributing)
- [Building](#building)

## Registration
First, you will need to create an account at [Lob.com](https://dashboard.lob.com/#/register) and obtain your **Live API Key**.

Once you have created an account, you can access your API Keys from the [Settings Panel](https://dashboard.lob.com/#/settings).

## Usage
The vanilla implementation of the library can be fully configured by adding markup. Start with a standard HTML form that collects a US Address.
```
<!DOCTYPE html>
<html>
<body>
    <form action="/api/v1/add-address">
        <div>
            <label for="street1">Street 1</label>
            <input id="street1">
        </div>
        <div>
            <label for="street2">Street 2</label>
            <input id="street2">
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
Embed the Lob Address Elements library using a &lt;script&gt; tag and then enable autocompletion and verification behaviors by decorating relevant HTML elements with `data-lob-*` attributes. For your convenience, we host a minified version of the library at `https://cdn.lob.com/lob-address-elements/0.1.0/lib/lob-address-elements.min.js`. For example:
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
            <small data-lob-primary-message></small>
        </div>
        <div>
            <label for="street2">Street 2</label>
            <input id="street2" data-lob-secondary>
            <small data-lob-secondary-message></small>
        </div>
        <div>
            <label for="city">City</label>
            <input id="city" data-lob-city>
            <small data-lob-city-message></small>
        </div>
        <div>
            <label for="state">State</label>
            <input id="state" data-lob-state>
            <small data-lob-state-message></small>
        </div>
        <div>
            <label for="zip">Zip</label>
            <input id="zip" data-lob-zip>
            <small data-lob-zip-message></small>
        </div>
        <input type="submit" value="Submit">
    </form>
    <script src="https://cdn.lob.com/lob-address-elements/0.1.0/lib/lob-address-elements.min.js"></script>
</body>
</html>
```

| Attribute Name               | Attribute Value(s)    | Description         |
| :---                         |  :---                 |   :---              |
| data-lob-key          | `<YOUR_LOB_KEY>`           | Include your Lob live public key as the attribute value. It will use the format `live_pub_*` and is available via the [Lob Dashboard](https://dashboard.lob.com/#/settings).        |
| data-lob-verify           | `strict`, `normal`, `relaxed`, `passthrough`          | Include this attribute on the HTML &lt;form&gt; element to pre-verify the user's address submission with Lob.  Choose `relaxed` as the attribute value, if you wish to allow users to submit an errant form once they have been warned. Their resubmission of an unchanged form will be used to indicate their preference to override and submit. Choose `normal` (the default) to halt any submissions that Lob deems undeliverable, while still allowing all other inconsistencies to be submitted once the user has confirmed their choice. Choose `strict` to halt any submission that does not pass verification, including minor errors like missing or unnecessary units. Finally, if you wish to verify an address and then submit regardless of the verification result, choose `passthrough`. This is useful for stateful forms that support repeated submissions. *NOTE: If you choose to verify form submissions, you must include the `data-lob-verify-message` attribute to identify where  verification error messages can be displayed to users.* |
| data-lob-verify-message             | N/A             | This attribute identifies the HTML element where all verification errors will be rendered. You are responsible for styling this component. The Address Elements library will *show* and *hide* this element as necessary to communicate verification issues.           |
| data-lob-primary          | N/A           | This attribute identifies the primary address field. This should be an HTML text input.         |
| data-lob-secondary        | N/A           | This attribute identifies the secondary address field.      |
| data-lob-city             | N/A           | This attribute identifies the city.      |
| data-lob-state            | N/A           | This attribute identifies the state.         |
| data-lob-zip              | N/A           | This attribute identifies the zip code.         |
| data-lob-primary-message  | N/A           | This optional attribute identifies where to display field-level error messages that affect the primary address field.           |
| data-lob-secondary-message | N/A          | This optional attribute identifies where to display field-level error messages that affect the secondary address field.         |
| data-lob-city-message      | N/A          | This opitonal attribute identifies where to display field-level error messages that affect the city field.           |
| data-lob-state-message     | N/A          | This optional attribute identifies where to display field-level error messages that affect the state field.           |
| data-lob-zip-message       | N/A          | This optional attribute identifies where to display field-level error messages that affect the zip code field.           |

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
    <form action="/some/url" 
        data-lob-verify="relaxed"
        data-lob-key="live_pub_xxxxxx">

        <div data-lob-verify-message></div>
        <div>
            <label for="street1">Street 1</label>
            <input id="street1" 
                data-lob-primary
                data-lob-suggestion-color="#666666"
                data-lob-suggestion-bgcolor="#fefefe" 
                data-lob-suggestion-bordercolor="#a8a8a8"
                data-lob-suggestion-activecolor="red" 
                data-lob-suggestion-activebgcolor="#eeeeee">
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
    <script src="https://cdn.lob.com/lob-address-elements/0.1.0/lib/lob-address-elements.min.js"></script>
</body>
</html>

```
| Attribute Name                    | Attribute Value(s)    | Description         |
| :---                              |  :---                 |   :---              |
| data-lob-suggestion-color         | N/A           | The text color for an item in the suggestion list.       |
| data-lob-suggestion-bgcolor       | N/A           | The background color for an item in the suggestion list.     |
| data-lob-suggestion-bordercolor   | N/A           | The border color for the suggestion list.      |
| data-lob-suggestion-activecolor   | N/A           | The text color for an item in the suggestion list when actively hovered over or when traversed via the keyboard.         |
| data-lob-suggestion-activebgcolor | N/A           | The background color for an item in the suggestion list when actively hovered over or when traversed via the keyboard.    |

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
            width: 100%;
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
    <h1>Lob Address Autocompletion</h1>
    <form action="/api/v1/add-address" 
        data-lob-verify="relaxed"
        data-lob-key="live_pub_xxxxxxxxxxxxxx">

        <div class="validation_error_message" data-lob-verify-message></div>
        <div>
            <label for="street1">Street 1</label>
            <input id="street1" 
                data-lob-primary 
                data-lob-suggestion-stylesheet>
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
    <script src="https://cdn.lob.com/lob-address-elements/0.1.0/lib/lob-address-elements.min.js"></script>
</body>

</html>
```

| Attribute Name                 | Attribute Value(s)  | Description         |
| :---                              |  :---                 |   :---              |
| data-lob-suggestion-stylesheet | N/A                 | Use this flag to stop the Address Elements library from loading its default stylesheet. You will be responsible for all styles and colors using a stylesheet under your control.    |

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

The minified version of the Address Elements library is available for download from the Lob CDN. You do not need to clone the Github repo to use in your Website. But if you do decide to fork and build your own instance of Address Elements, we have provided build tools for minifying your source. Execute via the CLI (NOTE: Replace `0.1.0` with the version number you wish to bind to the minified file name.
```
npm run build 0.1.0
```


----------

Copyright &copy; 2020 Lob.com

Released under the MIT License, which can be found in the repository in `LICENSE.txt`.