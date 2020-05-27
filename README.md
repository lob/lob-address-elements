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
    <form action="/some/url" data-lob-validate-on-submit="warn">
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
| data-lob-on-submit-error             | N/A             | You must include this attribute if address verification is enabled in order to render errors and warnings to users. It is up to you how style this component. The plugin with show (`display:'inherit'`) and hide (`display:'none'`) the error message as necessary to communicate verification errors.           |