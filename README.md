# lob-address-elements
The Lob Address Elements library simplifies client side integration of Lob's *US Address Autocompletion* and *US Address Verification* APIs. Use it to enrich any standard HTML page to include both autocompletion and pre-verification behaviors.

## Table of Contents
- [Registration](#registration)
- [Usage](#usage)
- [Preconfigured Usage](#preconfigured-usage)
- [Multiform Usage](#multiform-usage)
- [React Usage](#react)
- [Vue Usage](#vue)
- [Configuration and Customization](#configuration-and-customization)
- [Component Styles](#component-styles)
- [International](#international-verification)
- [Examples](#examples)
- [Contributing](#contributing)
- [Building](#building)
- [Latest Release](#releases)

## Registration
Create an account at [Lob.com](https://dashboard.lob.com/#/register) to obtain a **Live Public API Key**. The key is available in the [Lob Settings Panel](https://dashboard.lob.com/#/settings) and uses the format, `live_pub_*`.

## Usage
Embed the Lob Address Elements script immediately before the closing &lt;body&gt; tag in the html containing your address form. The script will autodetect your form and its inputs.

```html
  <script src="https://cdn.lob.com/lob-address-elements/2.0.0/lob-address-elements.min.js"
    data-lob-key="live_pub_xxx"></script>
```

## Preconfigured Usage
E-commerce platforms like Shopify use predictable element names making them easy to extend. Paste the following preconfigured script into your top-level Shopify Plus template to add address verification to your checkout form. *Remember to replace `live_pub_xxx` with your Lob public key.*

```html
<script src="https://cdn.lob.com/lob-address-elements/2.0.0/lob-address-elements.min.merged.js"
  data-lob-key="live_pub_xxx"
  data-lob-verify-value="strict"
  data-lob-primary-value="false"
  data-lob-err-bgcolor="#006eff"
  data-lob-err-color="#ffffff"></script>

<!-- Here's another example that places the verification message above the submit/continue button at checkout. -->
<script src="https://cdn.lob.com/lob-address-elements/2.0.0/lob-address-elements.min.merged.js"
  data-lob-key="live_pub_xxx"
  data-lob-verify-value="strict"
  data-lob-primary-value="false"
  data-lob-err-bgcolor="#006eff"
  data-lob-err-color="#ffffff"
  data-lob-verify-message-anchor-class="step__footer"></script>
```
*NOTE: Many E-commerce platforms have strict content security policies that prevent scripts from loading additional content. Embed the `merged` build of Address Elements to handle these situations as shown in the example above (lob-address-elements.min.merged.js). This ensures all dependencies are included in the download.*

## Multiform Usage
Address elements can enrich multiple address forms at the same time, within the same Web page. Each address must be contained within a different HTML &lt;form&gt; parent for verification to function properly.
```html
<!DOCTYPE html>
<html>
  <body>
    <form>
      ...
    </form>
  
    <form>
      ...
    </form>
  </body>
</html>
```



## React Usage
Address Elements assumes an address form already exists on your web page when it starts up. This is usually not the case for most React apps, so you will need to load the script after your address form is done rendering/mounting.

**Using Life Cycle methods**
```jsx
class MyComponent extends React.Component {
  ...
  // Place this inside the component containing your address form
  componentDidMount() {
    const script = document.createElement("script");
    script.src = "https://cdn.lob.com/lob-address-elements/2.0.0/lob-address-elements.min.js";
    script.async = true;
    script.setAttribute("data-lob-key", "live_pub_xxx");
    document.body.appendChild(script);
  }
  ...
}
```

**Using Hooks**
```jsx
const MyComponent = () => {
  ...
  // Place this inside the component containing your address form
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.lob.com/lob-address-elements/2.0.0/lob-address-elements.min.js";
    script.async = true;
    script.setAttribute("data-lob-key", "live_pub_xxx");
    document.body.appendChild(script);
  }, []);
  ...
}
```

[Check out the React demo here](https://codesandbox.io/s/av-elements-react-demo-edxk5?from-embed=&file=/src/index.js)



## Vue Usage
Similar to React, add the script tag after your address form component has rendered.
```jsx
// Place this inside the component containing your address form
export default {
  ...
  mounted() {
    const script = document.createElement("script");
    script.src = "https://cdn.lob.com/lob-address-elements/2.0.0/lob-address-elements.min.js";
    script.async = true;
    script.setAttribute("data-lob-key", "live_pub_xxx");
    document.body.appendChild(script);
  }
  ...
}
```

[Check out the Vue demo here](https://codesandbox.io/s/av-elements-vue-demo-gtuvs?from-embed)


## Configuration and Customization
See our [Script Attribute Reference Sheet wiki](https://github.com/lob/lob-address-elements/wiki/Script-Attribute-Reference-Sheet) for all the ways you can control the Address Elements script.

## Form Detection
With v2.0.0, users no longer have to provide the IDs of their address form inputs in the AV elements script tag. We now detect these inputs on start up by search for inputs and labels with address-related key words. Any errors that may arise are displayed in the web page and the browser's console. The quickest solution is to provide the ID of the problem input back in the AV elements script tag.

## Component Styles
For an in-depth guide to modifying the styles injected by Address Elements, please refer to our [styling guide wiki](https://github.com/lob/lob-address-elements/wiki/Styling-Guide).


## International Verification
Address Elements is capable of verifying international addresses. Simply include a country input in your form to enable this feature. When the value of the input is outside the United States we automatically switch to Lob's <a href="https://docs.lob.com/#intl_verifications">international verification endpoint</a>. The same form attributes are used for international verifications (e.g. `data-lob-zip-id` is still used for postal code, `data-lob-state-id` for province, etc).

_Note: Autocomplete functionality is disabled for international addresses._

## Examples

This repo includes several [example](https://github.com/lob/lob-address-elements/tree/master/examples) implementations. These represent a range of HTML forms and environments that may be similar to your own.

## Contributing

To contribute, please see the [CONTRIBUTING.md](https://github.com/lob/lob-node/blob/master/CONTRIBUTING.md) file.

## Building

The minified version of the Address Elements library is available for download from the Lob CDN. You do not need to clone the Github repo to use in your Website. 

If you do decide to fork and build your own instance of Address Elements, we use webpack for minifying your source. Execute via the CLI 

*NOTE: Webpack will bind the minified file name to the the version number in package.json*
```
npm run build
```

## Latest Release


### 2.0.0 (CURRENT / LATEST)
| Current Improvements |
| :---          |
| Implements form detection strategies to simplify script usage |
| Adds support for international verifications |
| Modularizes our main script with webpack as our bundler |

[See release notes for previous versions](https://github.com/lob/lob-address-elements/wiki/Release-Notes)

----------

Copyright &copy; 2021 Lob.com

Released under the MIT License, which can be found in the repository in `LICENSE.txt`.