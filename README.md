AngularJS-ngDropover
=================

**AngularJS ngDropover** is a feature-rich, event-driven solution for dropdowns, popovers, tooltips, or any other time you need a trigger or triggers to hide-show elements. The only dependency is AngularJS and your imaaginaaaationnnn!

* Open and close the dropover programmatically with events
* Built in touch support
* Easily create multiple triggers for single dropover
* Close dropover when clicking outside directive

#### Current Version 1.0.0

## Demo and Docs
[Check out the directive's website for all the documentation and example goodness ](http://verical.github.io/#/ngDropover) - Prepare your eyeballs

## Installation

##### Install with NPM
```html
npm install --save ngdropover
```

##### Add it to your module
```
angular.module('myApp', ['ngDropover'])
```


## Basic Usage
```html
<div ng-dropover ng-dropover-options="{'position':'bottom-center','triggerEvent':'hover'}">
    <button class="regular-button">Hover Over Me!</button>
    <div ng-dropover-contents>
        Dropover contents!
    </div>
</div>
```


### Options

```javascript
{
    'horizontalOffset': 0,
    'verticalOffset': 0,
    'triggerEvent': 'click',
    'position': 'bottom-left',
    'closeOnClickOff': true,
    'groupId': ''
}
```

		
## Authors
[**Ricky Sandoval**](https://github.com/rickysandoval)

[**Tony Smith**](https://github.com/santhony7)
## Credits


## Copyright
Copyright © 2015.

## License 
AngularJS-ngDropover is under MIT license - http://www.opensource.org/licenses/mit-license.php

##Changes Log
