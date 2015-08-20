/* global angular */
(function(window, document) {
    'use strict';

    /*
     * AngularJS ngDropover
     * Version: 0.0.0
     *
     * Copyright 2015
     * All Rights Reserved.
     * Use, reproduction, distribution, and modification of this code is subject to the terms and
     * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
     *
     * Authors: Tony Smith & Ricky Sandoval
     * 
     */

    angular.module('ngDropover', [])
        .run(['$document', '$rootScope', function($document, $rootScope) {
            $document.on('touchstart click', function(event) {
                if (event.type == 'touchstart') {
                    event.preventDefault();
                }
                if (event.which !== 3) {
                    $rootScope.$emit("ngDropover.closeAll", { fromDocument: true, ngDropoverId: getIds(event.target)} );
                }
            });
            function getIds(element) {
                var ids = '';
                while (element != document) {
                    if (element.attributes.getNamedItem('ng-dropover')){
                        ids += element.attributes.getNamedItem('ng-dropover').nodeValue + ',_,';
                    }
                    if (element.attributes.getNamedItem('ng-dropover-trigger')){
                        ids += ($rootScope.$eval(element.attributes.getNamedItem('ng-dropover-trigger').nodeValue).targetId || '') + ',_,';
                    }
                    element = element.parentNode;
                }
                return ids;
            }
        }])
        .constant(
            'ngDropoverConfig', {
                'horizontalOffset': 0,
                'verticalOffset': 0,
                'triggerEvent': 'click',
                'position': 'bottom-left',
                'closeOnClickOff': true,
                'groupId': ''
            }
        )
        .constant(
            'positions', [
                'bottom',
                'bottom-left',
                'bottom-center',
                'bottom-right',
                'top',
                'top-left',
                'top-center',
                'top-right',
                'left',
                'left-bottom',
                'left-center',
                'left-top',
                'right',
                'right-bottom',
                'right-center',
                'right-top'
            ]
        )
        .factory('triggerEventsMap', function() {

            var triggerMap = {
                'mouseenter': 'mouseleave',
                'click': 'click',
                'focus': 'blur',
                'none': 'none',
                'touchstart click': 'touchstart click'
            };

            return {
                getTriggers: function(triggerEvent) {
                    if (triggerEvent === 'hover') {
                        triggerEvent = 'mouseenter';
                    }
                    if (triggerEvent === 'click') {
                        triggerEvent = 'touchstart click';
                    }

                    if (triggerMap.hasOwnProperty(triggerEvent)) {
                        return {
                            'show': triggerEvent,
                            'hide': triggerMap[triggerEvent]
                        }
                    }
                    return null;
                }
            }
        })
        .directive('ngDropover', ['ngDropoverConfig', 'positions', '$rootScope', '$position', '$document', '$window', 'triggerEventsMap', '$timeout', function(ngDropoverConfig, positions, $rootScope, $position, $document, $window, triggerEventsMap, $timeout) {

            if (!Array.prototype.indexOf) {
                Array.prototype.indexOf = function(elt /*, from*/ ) {
                    var len = this.length >>> 0;

                    var from = Number(arguments[1]) || 0;
                    from = (from < 0) ? Math.ceil(from) : Math.floor(from);
                    if (from < 0)
                        from += len;

                    for (; from < len; from++) {
                        if (from in this &&
                            this[from] === elt)
                            return from;
                    }
                    return -1;
                };
            }

            function logError(id, element, message) {
                console.log("? ngDropover Error | ID:" + id + " ?");
                console.log(element);
                console.log(message);
                console.log("");
            }

            var allDropovers = [];

            var delimeter = ',_,';

            return {
                restrict: 'A',
                replace: true,
                scope: {
                    target: '@ngDropover',
                    ngDropoverOptions: '@ngDropoverOptions'
                },
                link: function(scope, elm, attrs) {

                    var dropoverContents, triggerElements, handlers, transition = {
                        duration: 0
                    };

                    init();

                    function init() {

                        scope.config = angular.extend({}, ngDropoverConfig, scope.$eval(scope.ngDropoverOptions));
                        scope.positions = positions;

                        setHtml();
                        handlers = {
                            toggle: function(e) {
                                // This is to check if the event came from inside the directive contents
                                if (event.type == "touchstart") {
                                    e.preventDefault();
                                }
                                if (!fromContents(e)) {
                                    scope.toggle(scope.ngDropoverId);
                                }
                            },
                            open: function(e) {
                                if (!scope.isOpen) {
                                    scope.open(scope.ngDropoverId);
                                }
                            },
                            close: function(e) {
                                if (scope.isOpen) {
                                    scope.close(scope.ngDropoverId);
                                }
                            }
                        }
                        function fromContents(e) {
                            var element = e.target;

                            while (element != document && element != elm[0]) {
                                if (element.attributes.getNamedItem('ng-dropover-contents')) {
                                    return true;
                                }
                                element = element.parentNode;
                            }
                            return false;
                        }

                        setDropoverObj();

                        scope.$watch('ngDropoverOptions', function() {
                            unsetTriggers();
                            scope.config = angular.extend({}, ngDropoverConfig, scope.$eval(scope.ngDropoverOptions));
                            if (typeof(scope.config.position) !== 'string' || scope.positions.indexOf(scope.config.position) == -1) {
                                logError(scope.ngDropoverId, angular.element(elm), "Position must be a string and one of these values: " + scope.positions);
                                scope.config.position = "bottom-left";
                            }
                            setTriggers();
                            positionContents();
                            setPositionClass();
                            updateDropoverArray();
                        }, true);

                        $document.ready(function() {
                            positionContents();
                        });
                    }


                    function setHtml() {
                        elm.addClass(scope.config.groupId + " ngdo");
                        elm.attr("ng-dropover", scope.ngDropoverId)
                        dropoverContents = getDropoverContents();
                        dropoverContents.css({
                            'position': 'absolute'
                        }).addClass('ngdo-contents ' + scope.config.groupId);
                        transition.event = getTransitions();
                        transition.handler = function(event) {
                            if (event.propertyName == "visibility") {
                                return;
                            }
                            dropoverContents.css({
                                'display': 'none'
                            });
                            dropoverContents[0].removeEventListener(transition.event, transition.handler);
                        };
                    }

                    function setDropoverObj() {
                        scope.dropoverObj = {
                            options: scope.config,
                            id: scope.ngDropoverId,
                            children: elm[0].querySelectorAll('[ng-dropover]'),
                            element: elm,
                            dropoverContents: dropoverContents
                        };
                    }

                    //Get the trigger from the config if the user set it. Otherwise the trigger will default to the scope's element
                    function setTriggers() {

                        var triggerObj = triggerEventsMap.getTriggers(scope.config.triggerEvent);

                        if (!triggerObj) {
                            logError(scope.ngDropoverId, angular.element(elm), "triggerEvent must be a string: 'none', 'click', 'hover', 'focus'");
                        }

                        if (triggerObj && triggerObj.show !== "none") {
                            //If the the trigger's event to open matches the event to close, then send to the toggle method
                            //else send to individual open and close methods
                            if (triggerObj.show === triggerObj.hide) {
                                elm.on(triggerObj.show, handlers.toggle);
                            } else {
                                elm.on(triggerObj.show, handlers.open);
                                elm.on(triggerObj.hide, handlers.close);
                            }
                        }
                    }

                    function unsetTriggers() {
                        if (triggerElements && triggerElements.length > 0) {
                            var triggerObj = triggerEventsMap.getTriggers(scope.config.triggerEvent);
                            for (var i = 0; i < triggerElements.length; i++) {
                                var el = angular.element(triggerElements[i]);
                                if (triggerObj.show === triggerObj.hide) {
                                    el.off(triggerObj.show, handlers.toggle);
                                } else {
                                    el.off(triggerObj.show, handlers.open);
                                    el.off(triggerObj.hide, handlers.close);
                                }
                            }
                        }
                    }

                    function positionContents() {

                        var offX, offY, positions;

                        offX = parseInt(scope.config.horizontalOffset, 10) || 0;
                        offY = parseInt(scope.config.verticalOffset, 10) || 0;

                        dropoverContents.css({
                            'visibility': 'hidden',
                            'display': ''
                        });

                        positions = $position.positionElements(elm, dropoverContents, scope.config.position, false);
                        dropoverContents.css({
                            'left': positions.left + offX + 'px',
                            'top': positions.top + offY + 'px',
                            'display': 'none',
                            'visibility': 'visible'
                        });
                    }

                    function setPositionClass() {
                        var classList = elm[0].className.split(' ');
                        for (var i = 0, l = classList.length; i < l; i++) {
                            var stripPrefix = classList[i].substring(5, classList[i].length);
                            if (scope.positions.indexOf(stripPrefix) > 0) {
                                elm.removeClass(classList[i]);
                            }
                        }
                        elm.addClass('ngdo-' + scope.config.position);
                    }

                    function updateDropoverArray(remove) {
                        var dropoverObjIndex = allDropovers.indexOf(scope.dropoverObj);
                        if (!remove) {
                            if (dropoverObjIndex == -1) {
                                allDropovers.push(scope.dropoverObj);
                            } else {
                                setDropoverObj();
                                allDropovers[dropoverObjIndex] = scope.dropoverObj;
                            }
                        } else {
                            allDropovers.splice(dropoverObjIndex, 1);
                        }
                    }

                    function getDropoverContents() {
                        var ret;
                        if (elm[0].querySelector('[ng-dropover-contents]')) {
                            ret = angular.element(elm[0].querySelector('[ng-dropover-contents]'));
                            return ret;
                        } else {

                            ret = angular.element("<div class='ngdo-empty'>Oops, you forgot to specify what goes in the dropdown</div>");
                            elm.append(ret);
                            return ret;
                        }
                    }

                    //ToDo: Detect previous display value
                    scope.open = function(ngDropoverId) {
                        if (transition.event) {
                            dropoverContents[0].removeEventListener(transition.event, transition.handler);
                        }
                        if (ngDropoverId === scope.ngDropoverId && !scope.isOpen) {

                            positionContents();

                            //start the display process and fire events
                            $rootScope.$broadcast('ngDropover.opening', scope.dropoverObj);
                            dropoverContents.css({
                                'display': 'inline-block'
                            });
                            elm.addClass('ngdo-open');
                            angular.element($window).bind('resize', positionContents);

                            scope.isOpen = true;
                        }
                    };

                    scope.close = function(ngDropoverId) {
                        if (ngDropoverId === scope.ngDropoverId && scope.isOpen) {
                            closer();
                        }
                    };

                    scope.toggle = function(ngDropoverId) {
                        if (!scope.isOpen) {
                            scope.open(ngDropoverId);
                        } else {
                            scope.close(ngDropoverId);
                        }
                    };

                    scope.closeAll = function() {
                        if (scope.isOpen) {
                            closer();
                        }
                    };

                    function getTransitions() {
                        var transitions = {
                            'transition': 'transitionend',
                            'OTransition': 'oTransitionEnd',
                            'MozTransition': 'transitionend',
                            'webkitTransition': 'webkitTransitionEnd'
                        };
                        var propertyCheck = {
                            'transition': 'transitionDuration',
                            'OTransition': 'oTransitionDuration',
                            'MozTransition': 'MozTransitionDuration',
                            'webkitTransition': 'WebkitTransitionDuration'
                        };
                        var t;
                        for (t in transitions) {
                            if (dropoverContents[0].style[t] !== undefined && parseFloat($position.getStyle(dropoverContents[0], propertyCheck[t]), 10) > 0) {
                                transition.duration = Math.floor(parseFloat($position.getStyle(dropoverContents[0], propertyCheck[t]), 10) * 1000);
                                return transitions[t];
                            }
                        }
                        return undefined;
                    }

                    function closer() {
                        if (transition.event) {
                            $timeout(function() {
                                if (!scope.isOpen) {
                                    dropoverContents[0].addEventListener(transition.event, transition.handler);
                                }
                            }, transition.duration / 2);
                        } else {
                            dropoverContents.css({
                                'display': 'none'
                            });
                        }
                        elm.removeClass('ngdo-open');
                        scope.isOpen = false;

                        $rootScope.$broadcast('ngDropover.closing', scope.dropoverObj);

                        angular.element($window).unbind('resize', positionContents);
                    };

                    scope.$on('$destroy', function() {
                        unsetTriggers();
                        angular.element($window).unbind('resize', positionContents);
                        updateDropoverArray(true);
                    });

                },
                controller: [
                    '$scope', '$element', '$attrs',
                    function($scope, $element, $attrs) {

                        $scope.isOpen = false;
                        $scope.ngDropoverId = $scope.target || ('' + $scope.$id);

                        //set up event listeners
                        $scope.openListener = $rootScope.$on('ngDropover.open', function(event, ngDropoverId) {
                            $scope.open(ngDropoverId);
                        });

                        $scope.closeListener = $rootScope.$on('ngDropover.close', function(event, ngDropoverId) {
                            $scope.close(ngDropoverId);
                        });

                        $scope.toggleListener = $rootScope.$on('ngDropover.toggle', function(event, ngDropoverId) {
                            $scope.isOpen ? $scope.close(ngDropoverId) : $scope.open(ngDropoverId);
                        });

                        $scope.closeAllListener = $rootScope.$on('ngDropover.closeAll', function(event, info) {
                            if ((!info.ngDropoverId || (info.ngDropoverId).split(delimeter).indexOf($scope.ngDropoverId) < 0) && !(!$scope.config.closeOnClickOff && info.fromDocument)) {
                                // Unless closeOnClickOff is false and the event was from the document listener
                                $scope.closeAll();
                            }
                        });

                        $scope.$on('$destroy', function() {
                            $scope.openListener();
                            $scope.openListener = null;
                            $scope.closeListener();
                            $scope.closeListener = null;
                            $scope.closeAllListener();
                            $scope.closeAllListener = null;
                            $scope.toggleListener();
                            scope.toggleListener = null;
                        });
                    }
                ]
            };
        }]).factory('$position', ['$document', '$window', function($document, $window) {

            function getStyle(el, cssprop) {
                if (el.currentStyle) { //IE
                    return el.currentStyle[cssprop];
                } else if ($window.getComputedStyle) {
                    return $window.getComputedStyle(el)[cssprop];
                }
                // finally try and get inline style
                return el.style[cssprop];
            }

            /**
             * Checks if a given element is statically positioned
             * @param element - raw DOM element
             */
            function isStaticPositioned(element) {
                return (getStyle(element, 'position') || 'static') === 'static';
            }

            /**
             * returns the closest, non-statically positioned parentOffset of a given element
             * @param element
             */
            var parentOffsetEl = function(element) {
                var docDomEl = $document[0];
                var offsetParent = element.offsetParent || docDomEl;
                while (offsetParent && offsetParent !== docDomEl && isStaticPositioned(offsetParent)) {
                    offsetParent = offsetParent.offsetParent;
                }
                return offsetParent || docDomEl;
            };

            return {

                getStyle: getStyle,

                /**
                 * Provides read-only equivalent of jQuery's position function:
                 * http://api.jquery.com/position/
                 */
                position: function(element) {
                    var elBCR = this.offset(element);
                    var offsetParentBCR = {
                        top: 0,
                        left: 0
                    };
                    var offsetParentEl = parentOffsetEl(element[0]);
                    if (offsetParentEl !== $document[0]) {
                        offsetParentBCR = this.offset(angular.element(offsetParentEl));
                        offsetParentBCR.top += offsetParentEl.clientTop - offsetParentEl.scrollTop;
                        offsetParentBCR.left += offsetParentEl.clientLeft - offsetParentEl.scrollLeft;
                    }
                    var boundingClientRect = element[0].getBoundingClientRect();
                    return {
                        width: boundingClientRect.width || element.prop('offsetWidth'),
                        height: boundingClientRect.height || element.prop('offsetHeight'),
                        top: elBCR.top - offsetParentBCR.top,
                        left: elBCR.left - offsetParentBCR.left
                    };
                },

                /**
                 * Provides read-only equivalent of jQuery's offset function:
                 * http://api.jquery.com/offset/
                 */
                offset: function(element) {
                    var boundingClientRect = element[0].getBoundingClientRect();
                    return {
                        width: boundingClientRect.width || element.prop('offsetWidth'),
                        height: boundingClientRect.height || element.prop('offsetHeight'),
                        top: boundingClientRect.top + ($window.pageYOffset || $document[0].documentElement.scrollTop),
                        left: boundingClientRect.left + ($window.pageXOffset || $document[0].documentElement.scrollLeft)
                    };
                },

                /**
                 * Provides coordinates for the targetEl in relation to hostEl
                 */
                positionElements: function(hostEl, targetEl, positionStr, appendToBody) {

                    var positionStrParts = positionStr.split('-');
                    var pos0 = positionStrParts[0],
                        pos1 = positionStrParts[1] || 'center';

                    var hostElPos,
                        targetElWidth,
                        targetElHeight,
                        targetElPos;

                    hostElPos = appendToBody ? this.offset(hostEl) : this.position(hostEl);

                    if (!isStaticPositioned(hostEl[0])) {
                        hostElPos.top = -hostEl[0].clientTop;
                        hostElPos.left = -hostEl[0].clientLeft;
                    }

                    targetElWidth = targetEl.prop('offsetWidth');
                    targetElHeight = targetEl.prop('offsetHeight');

                    var shiftWidth = {
                        center: function() {
                            return hostElPos.left + hostElPos.width / 2 - targetElWidth / 2;
                        },
                        left: function() {
                            return hostElPos.left;
                        },
                        right: function() {
                            if (pos1 === "right") {
                                return hostElPos.left + (hostElPos.width - targetElWidth);
                            }
                            return hostElPos.left + hostElPos.width;
                        }
                    };

                    var shiftHeight = {
                        center: function() {
                            return hostElPos.top + hostElPos.height / 2 - targetElHeight / 2;
                        },
                        top: function() {
                            return hostElPos.top;
                        },
                        bottom: function() {
                            return hostElPos.top + hostElPos.height;
                        }
                    };

                    switch (pos0) {
                        case 'right':
                            targetElPos = {
                                top: shiftHeight[pos1](),
                                left: shiftWidth[pos0]()
                            };
                            break;
                        case 'left':
                            targetElPos = {
                                top: shiftHeight[pos1](),
                                left: hostElPos.left - targetElWidth
                            };
                            break;
                        case 'bottom':
                            targetElPos = {
                                top: shiftHeight[pos0](),
                                left: shiftWidth[pos1]()
                            };
                            break;
                        default:
                            targetElPos = {
                                top: hostElPos.top - targetElHeight,
                                left: shiftWidth[pos1]()
                            };
                            break;
                    }
                    return targetElPos;
                }
            };
        }])
        .directive('ngDropoverTrigger', ['$rootScope', '$document', 'triggerEventsMap', function($rootScope, $document, triggerEventsMap) {
            return {
                restrict: 'AE',
                link: function (scope, element, attrs) {
                    var options = scope.$eval(attrs.ngDropoverTrigger);
                    var triggerObj = triggerEventsMap.getTriggers(options.triggerEvent || 'click');
                    element.addClass('ng-dropover-trigger');

                    if (options.action == "open" || options.action == "close") {
                        element.on(triggerObj.show, function(event) {
                            if (event.tyepe == 'touchstart') {
                                event.preventDefault();
                            }
                            event.targetId = options.targetId;
                            scope.$emit('ngDropover.' + options.action, event);
                        });
                    } else {
                        if (triggerObj.show === triggerObj.hide) {
                            element.on(triggerObj.show, function(event) {
                                scope.$emit('ngDropover.toggle', options.targetId);
                            });
                        } else {
                            element.on(triggerObj.show, function(event) {
                                scope.$emit('ngDropover.open', options.targetId);
                            });

                            element.on(triggerObj.hide, function(event) {
                                scope.$emit('ngDropover.close', options.targetId);
                            });
                        }
                    }
                }
            };
        }]);
})(window, document);