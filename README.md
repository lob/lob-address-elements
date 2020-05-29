# lob-address-elements
**Lob Address Elements** is a JavaScript library that adds address autocompletion and verification to a standard HTML Web form.

## Overview
The Lob Address Elements plugin simplifies client side integration of Lob's *US Address Autocompletion* and *US Address Verification* APIs. Use the plugin to enrich any standard HTML page to include both autocompletion and pre-verification behaviors.

## Implementation
The vanilla implementation of the plugin requires **no** JavaScript skills. As long as you have access to the HTML markup for your Web page, all plugin configuration can be achieved through markup.

Consider the following HTML form that collects a US Address and submits to an endpoint.
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
Simply embed the Lob Address Elements plugin using a <script> tag and then enable it by decorating relevant HTML elements with `data-lob-*` attributes. For example:
```
<!DOCTYPE html>
<html>
<body>
    <form action="/some/url" 
        data-lob-validate-on-submit="warn" 
        data-lob-key="live_pub_xxxxxx">

        <div data-lob-on-submit-error></div>
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
    <script src="/public/js/lob-address-elements.js"></script>
</body>
</html>
```

| Attribute Name               | Attribute Value(s)    | Description         |
| :---                         |  :---                 |   :---              |
| data-lob-validate-on-submit           | `warn`, `stop`           | Include this optional attribute to pre-verify the user's address submission with Lob. If `warn` is used as the attribute value, the user may still submit an errant form. Applying `stop` will halt all submissions that do not pass verification.         |
| data-lob-key          | `YOUR LOB KEY`           | Include your Lob live public key as the attribute value.         |
| data-lob-on-submit-error             | N/A             | You must include this attribute if address verification is enabled in order to render errors and warnings to users. It is up to you how style this component. The plugin with show (`display:'inherit'`) and hide (`display:'none'`) the error message as necessary to communicate verification errors.           |
| data-lob-primary          | N/A           | Identify the primary address field. This should be an input text box.         |
| data-lob-secondary        | N/A           | Identify the secondary address field.      |
| data-lob-city             | N/A           | Identify the city.      |
| data-lob-state            | N/A           | Identify the state.         |
| data-lob-zip              | N/A           | Identify the zip code.         |

You may customize the color scheme for the address suggestion list.
Two approaches are supported. In this example, the colors are declared in-ine, which means
the address elements plugin will automatically inject the stylesheet. 
Both hex and named colors are supported.

```
<!DOCTYPE html>
<html>
<body>
    <form action="/some/url" 
        data-lob-validate-on-submit="warn" 
        data-lob-key="live_pub_xxxxxx">

        <div data-lob-on-submit-error></div>
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
    <script src="/public/js/lob-address-elements.js"></script>
</body>
</html>

```
| Attribute Name               | Attribute Value(s)    | Description         |
| :---                         |  :---                 |   :---              |
| data-lob-suggestion-color    | N/A           | The text color for an item in the suggestion list.       |
| data-lob-suggestion-bgcolor        | N/A           | The background color for an item in the suggestion list.     |
| data-lob-suggestion-bordercolor             | N/A           | The border color for the suggestion list.      |
| data-lob-suggestion-activecolor            | N/A           | The text color for an item in the suggestion list when actively hovered over or when traversed via the keyboard.         |
| data-lob-suggestion-activebgcolor              | N/A           | The background color for an item in the suggestion list when actively hovered over or when traversed via the keyboard.      |


In this example, all styles for the address suggestion list are declared as CSS styles. When using this approach, it
is useful to also include the `data-lob-suggestion-stylesheet` attribute to stop the address elements plugin from 
loading the default stylesheet.

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
        data-lob-validate-on-submit="warn" 
        data-lob-key="live_pub_xxxxxxxxxxxxxx">

        <div class="validation_error_message" data-lob-on-submit-error></div>
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
    <script src="/lob-address-elements.js"></script>
</body>

</html>