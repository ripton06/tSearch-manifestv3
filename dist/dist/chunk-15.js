(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[15],{

/***/ 516:
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;/**!
 * Sortable
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */

(function sortableModule(factory) {
	"use strict";

	if (true) {
		!(__WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) :
				__WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}
	else {}
})(function sortableFactory() {
	"use strict";

	if (typeof window === "undefined" || !window.document) {
		return function sortableError() {
			throw new Error("Sortable.js requires a window with a document");
		};
	}

	var dragEl,
		parentEl,
		ghostEl,
		cloneEl,
		rootEl,
		nextEl,
		lastDownEl,

		scrollEl,
		scrollParentEl,
		scrollCustomFn,

		oldIndex,
		newIndex,
		oldDraggableIndex,
		newDraggableIndex,

		activeGroup,
		putSortable,

		autoScrolls = [],
		scrolling = false,

		awaitingDragStarted = false,
		ignoreNextClick = false,
		sortables = [],

		pointerElemChangedInterval,
		lastPointerElemX,
		lastPointerElemY,

		tapEvt,
		touchEvt,

		moved,


		lastTarget,
		lastDirection,
		pastFirstInvertThresh = false,
		isCircumstantialInvert = false,
		lastMode, // 'swap' or 'insert'

		targetMoveDistance,

		// For positioning ghost absolutely
		ghostRelativeParent,
		ghostRelativeParentInitialScroll = [], // (left, top)

		realDragElRect, // dragEl rect after current animation

		/** @const */
		R_SPACE = /\s+/g,

		expando = 'Sortable' + (new Date).getTime(),

		win = window,
		document = win.document,
		parseInt = win.parseInt,
		setTimeout = win.setTimeout,

		$ = win.jQuery || win.Zepto,
		Polymer = win.Polymer,

		captureMode = {
			capture: false,
			passive: false
		},

		IE11OrLess = !!navigator.userAgent.match(/(?:Trident.*rv[ :]?11\.|msie|iemobile)/i),
		Edge = !!navigator.userAgent.match(/Edge/i),
		FireFox = !!navigator.userAgent.match(/firefox/i),
		Safari = !!(navigator.userAgent.match(/safari/i) && !navigator.userAgent.match(/chrome/i) && !navigator.userAgent.match(/android/i)),
		IOS = !!(navigator.userAgent.match(/iP(ad|od|hone)/i)),

		PositionGhostAbsolutely = IOS,

		CSSFloatProperty = Edge || IE11OrLess ? 'cssFloat' : 'float',

		// This will not pass for IE9, because IE9 DnD only works on anchors
		supportDraggable = ('draggable' in document.createElement('div')),

		supportCssPointerEvents = (function() {
			// false when <= IE11
			if (IE11OrLess) {
				return false;
			}
			var el = document.createElement('x');
			el.style.cssText = 'pointer-events:auto';
			return el.style.pointerEvents === 'auto';
		})(),

		_silent = false,
		_alignedSilent = false,

		abs = Math.abs,
		min = Math.min,
		max = Math.max,

		savedInputChecked = [],

		_detectDirection = function(el, options) {
			var elCSS = _css(el),
				elWidth = parseInt(elCSS.width)
					- parseInt(elCSS.paddingLeft)
					- parseInt(elCSS.paddingRight)
					- parseInt(elCSS.borderLeftWidth)
					- parseInt(elCSS.borderRightWidth),
				child1 = _getChild(el, 0, options),
				child2 = _getChild(el, 1, options),
				firstChildCSS = child1 && _css(child1),
				secondChildCSS = child2 && _css(child2),
				firstChildWidth = firstChildCSS && parseInt(firstChildCSS.marginLeft) + parseInt(firstChildCSS.marginRight) + _getRect(child1).width,
				secondChildWidth = secondChildCSS && parseInt(secondChildCSS.marginLeft) + parseInt(secondChildCSS.marginRight) + _getRect(child2).width;

			if (elCSS.display === 'flex') {
				return elCSS.flexDirection === 'column' || elCSS.flexDirection === 'column-reverse'
				? 'vertical' : 'horizontal';
			}

			if (elCSS.display === 'grid') {
				return elCSS.gridTemplateColumns.split(' ').length <= 1 ? 'vertical' : 'horizontal';
			}

			if (child1 && firstChildCSS.float !== 'none') {
				var touchingSideChild2 = firstChildCSS.float === 'left' ? 'left' : 'right';

				return child2 && (secondChildCSS.clear === 'both' || secondChildCSS.clear === touchingSideChild2) ?
					'vertical' : 'horizontal';
			}

			return (child1 &&
				(
					firstChildCSS.display === 'block' ||
					firstChildCSS.display === 'flex' ||
					firstChildCSS.display === 'table' ||
					firstChildCSS.display === 'grid' ||
					firstChildWidth >= elWidth &&
					elCSS[CSSFloatProperty] === 'none' ||
					child2 &&
					elCSS[CSSFloatProperty] === 'none' &&
					firstChildWidth + secondChildWidth > elWidth
				) ?
				'vertical' : 'horizontal'
			);
		},

		/**
		 * Detects first nearest empty sortable to X and Y position using emptyInsertThreshold.
		 * @param  {Number} x      X position
		 * @param  {Number} y      Y position
		 * @return {HTMLElement}   Element of the first found nearest Sortable
		 */
		_detectNearestEmptySortable = function(x, y) {
			for (var i = 0; i < sortables.length; i++) {
				if (_lastChild(sortables[i])) continue;

				var rect = _getRect(sortables[i]),
					threshold = sortables[i][expando].options.emptyInsertThreshold,
					insideHorizontally = x >= (rect.left - threshold) && x <= (rect.right + threshold),
					insideVertically = y >= (rect.top - threshold) && y <= (rect.bottom + threshold);

				if (threshold && insideHorizontally && insideVertically) {
					return sortables[i];
				}
			}
		},

		_isClientInRowColumn = function(x, y, el, axis, options) {
			var targetRect = _getRect(el),
				targetS1Opp = axis === 'vertical' ? targetRect.left : targetRect.top,
				targetS2Opp = axis === 'vertical' ? targetRect.right : targetRect.bottom,
				mouseOnOppAxis = axis === 'vertical' ? x : y;

			return targetS1Opp < mouseOnOppAxis && mouseOnOppAxis < targetS2Opp;
		},

		_isElInRowColumn = function(el1, el2, axis) {
			var el1Rect = el1 === dragEl && realDragElRect || _getRect(el1),
				el2Rect = el2 === dragEl && realDragElRect || _getRect(el2),
				el1S1Opp = axis === 'vertical' ? el1Rect.left : el1Rect.top,
				el1S2Opp = axis === 'vertical' ? el1Rect.right : el1Rect.bottom,
				el1OppLength = axis === 'vertical' ? el1Rect.width : el1Rect.height,
				el2S1Opp = axis === 'vertical' ? el2Rect.left : el2Rect.top,
				el2S2Opp = axis === 'vertical' ? el2Rect.right : el2Rect.bottom,
				el2OppLength = axis === 'vertical' ? el2Rect.width : el2Rect.height;

			return (
				el1S1Opp === el2S1Opp ||
				el1S2Opp === el2S2Opp ||
				(el1S1Opp + el1OppLength / 2) === (el2S1Opp + el2OppLength / 2)
			);
		},

		_getParentAutoScrollElement = function(el, includeSelf) {
			// skip to window
			if (!el || !el.getBoundingClientRect) return _getWindowScrollingElement();

			var elem = el;
			var gotSelf = false;
			do {
				// we don't need to get elem css if it isn't even overflowing in the first place (performance)
				if (elem.clientWidth < elem.scrollWidth || elem.clientHeight < elem.scrollHeight) {
					var elemCSS = _css(elem);
					if (
						elem.clientWidth < elem.scrollWidth && (elemCSS.overflowX == 'auto' || elemCSS.overflowX == 'scroll') ||
						elem.clientHeight < elem.scrollHeight && (elemCSS.overflowY == 'auto' || elemCSS.overflowY == 'scroll')
					) {
						if (!elem || !elem.getBoundingClientRect || elem === document.body) return _getWindowScrollingElement();

						if (gotSelf || includeSelf) return elem;
						gotSelf = true;
					}
				}
			/* jshint boss:true */
			} while (elem = elem.parentNode);

			return _getWindowScrollingElement();
		},

		_getWindowScrollingElement = function() {
			if (IE11OrLess) {
				return document.documentElement;
			} else {
				return document.scrollingElement;
			}
		},

		_scrollBy = function(el, x, y) {
			el.scrollLeft += x;
			el.scrollTop += y;
		},

		_autoScroll = _throttle(function (/**Event*/evt, /**Object*/options, /**HTMLElement*/rootEl, /**Boolean*/isFallback) {
			// Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=505521
			if (options.scroll) {
				var _this = rootEl ? rootEl[expando] : window,
					sens = options.scrollSensitivity,
					speed = options.scrollSpeed,

					x = evt.clientX,
					y = evt.clientY,

					winScroller = _getWindowScrollingElement(),

					scrollThisInstance = false;

				// Detect scrollEl
				if (scrollParentEl !== rootEl) {
					_clearAutoScrolls();

					scrollEl = options.scroll;
					scrollCustomFn = options.scrollFn;

					if (scrollEl === true) {
						scrollEl = _getParentAutoScrollElement(rootEl, true);
						scrollParentEl = scrollEl;
					}
				}


				var layersOut = 0;
				var currentParent = scrollEl;
				do {
					var	el = currentParent,
						rect = _getRect(el),

						top = rect.top,
						bottom = rect.bottom,
						left = rect.left,
						right = rect.right,

						width = rect.width,
						height = rect.height,

						scrollWidth,
						scrollHeight,

						css,

						vx,
						vy,

						canScrollX,
						canScrollY,

						scrollPosX,
						scrollPosY;


					scrollWidth = el.scrollWidth;
					scrollHeight = el.scrollHeight;

					css = _css(el);

					scrollPosX = el.scrollLeft;
					scrollPosY = el.scrollTop;

					if (el === winScroller) {
						canScrollX = width < scrollWidth && (css.overflowX === 'auto' || css.overflowX === 'scroll' || css.overflowX === 'visible');
						canScrollY = height < scrollHeight && (css.overflowY === 'auto' || css.overflowY === 'scroll' || css.overflowY === 'visible');
					} else {
						canScrollX = width < scrollWidth && (css.overflowX === 'auto' || css.overflowX === 'scroll');
						canScrollY = height < scrollHeight && (css.overflowY === 'auto' || css.overflowY === 'scroll');
					}

					vx = canScrollX && (abs(right - x) <= sens && (scrollPosX + width) < scrollWidth) - (abs(left - x) <= sens && !!scrollPosX);

					vy = canScrollY && (abs(bottom - y) <= sens && (scrollPosY + height) < scrollHeight) - (abs(top - y) <= sens && !!scrollPosY);


					if (!autoScrolls[layersOut]) {
						for (var i = 0; i <= layersOut; i++) {
							if (!autoScrolls[i]) {
								autoScrolls[i] = {};
							}
						}
					}

					if (autoScrolls[layersOut].vx != vx || autoScrolls[layersOut].vy != vy || autoScrolls[layersOut].el !== el) {
						autoScrolls[layersOut].el = el;
						autoScrolls[layersOut].vx = vx;
						autoScrolls[layersOut].vy = vy;

						clearInterval(autoScrolls[layersOut].pid);

						if (el && (vx != 0 || vy != 0)) {
							scrollThisInstance = true;
							/* jshint loopfunc:true */
							autoScrolls[layersOut].pid = setInterval((function () {
								// emulate drag over during autoscroll (fallback), emulating native DnD behaviour
								if (isFallback && this.layer === 0) {
									Sortable.active._emulateDragOver(true);
									Sortable.active._onTouchMove(touchEvt, true);
								}
								var scrollOffsetY = autoScrolls[this.layer].vy ? autoScrolls[this.layer].vy * speed : 0;
								var scrollOffsetX = autoScrolls[this.layer].vx ? autoScrolls[this.layer].vx * speed : 0;

								if ('function' === typeof(scrollCustomFn)) {
									if (scrollCustomFn.call(_this, scrollOffsetX, scrollOffsetY, evt, touchEvt, autoScrolls[this.layer].el) !== 'continue') {
										return;
									}
								}

								_scrollBy(autoScrolls[this.layer].el, scrollOffsetX, scrollOffsetY);
							}).bind({layer: layersOut}), 24);
						}
					}
					layersOut++;
				} while (options.bubbleScroll && currentParent !== winScroller && (currentParent = _getParentAutoScrollElement(currentParent, false)));
				scrolling = scrollThisInstance; // in case another function catches scrolling as false in between when it is not
			}
		}, 30),

		_clearAutoScrolls = function () {
			autoScrolls.forEach(function(autoScroll) {
				clearInterval(autoScroll.pid);
			});
			autoScrolls = [];
		},

		_prepareGroup = function (options) {
			function toFn(value, pull) {
				return function(to, from, dragEl, evt) {
					var sameGroup = to.options.group.name &&
									from.options.group.name &&
									to.options.group.name === from.options.group.name;

					if (value == null && (pull || sameGroup)) {
						// Default pull value
						// Default pull and put value if same group
						return true;
					} else if (value == null || value === false) {
						return false;
					} else if (pull && value === 'clone') {
						return value;
					} else if (typeof value === 'function') {
						return toFn(value(to, from, dragEl, evt), pull)(to, from, dragEl, evt);
					} else {
						var otherGroup = (pull ? to : from).options.group.name;

						return (value === true ||
						(typeof value === 'string' && value === otherGroup) ||
						(value.join && value.indexOf(otherGroup) > -1));
					}
				};
			}

			var group = {};
			var originalGroup = options.group;

			if (!originalGroup || typeof originalGroup != 'object') {
				originalGroup = {name: originalGroup};
			}

			group.name = originalGroup.name;
			group.checkPull = toFn(originalGroup.pull, true);
			group.checkPut = toFn(originalGroup.put);
			group.revertClone = originalGroup.revertClone;

			options.group = group;
		},

		_checkAlignment = function(evt) {
			if (!dragEl || !dragEl.parentNode) return;
			dragEl.parentNode[expando] && dragEl.parentNode[expando]._computeIsAligned(evt);
		},

		_hideGhostForTarget = function() {
			if (!supportCssPointerEvents && ghostEl) {
				_css(ghostEl, 'display', 'none');
			}
		},

		_unhideGhostForTarget = function() {
			if (!supportCssPointerEvents && ghostEl) {
				_css(ghostEl, 'display', '');
			}
		};


	// #1184 fix - Prevent click event on fallback if dragged but item not changed position
	document.addEventListener('click', function(evt) {
		if (ignoreNextClick) {
			evt.preventDefault();
			evt.stopPropagation && evt.stopPropagation();
			evt.stopImmediatePropagation && evt.stopImmediatePropagation();
			ignoreNextClick = false;
			return false;
		}
	}, true);

	var nearestEmptyInsertDetectEvent = function(evt) {
		if (dragEl) {
			evt = evt.touches ? evt.touches[0] : evt;
			var nearest = _detectNearestEmptySortable(evt.clientX, evt.clientY);

			if (nearest) {
				// Create imitation event
				var event = {};
				for (var i in evt) {
					event[i] = evt[i];
				}
				event.target = event.rootEl = nearest;
				event.preventDefault = void 0;
				event.stopPropagation = void 0;
				nearest[expando]._onDragOver(event);
			}
		}
	};

	/**
	 * @class  Sortable
	 * @param  {HTMLElement}  el
	 * @param  {Object}       [options]
	 */
	function Sortable(el, options) {
		if (!(el && el.nodeType && el.nodeType === 1)) {
			throw 'Sortable: `el` must be HTMLElement, not ' + {}.toString.call(el);
		}

		this.el = el; // root element
		this.options = options = _extend({}, options);


		// Export instance
		el[expando] = this;

		// Default options
		var defaults = {
			group: null,
			sort: true,
			disabled: false,
			store: null,
			handle: null,
			scroll: true,
			scrollSensitivity: 30,
			scrollSpeed: 10,
			bubbleScroll: true,
			draggable: /[uo]l/i.test(el.nodeName) ? '>li' : '>*',
			swapThreshold: 1, // percentage; 0 <= x <= 1
			invertSwap: false, // invert always
			invertedSwapThreshold: null, // will be set to same as swapThreshold if default
			removeCloneOnHide: true,
			direction: function() {
				return _detectDirection(el, this.options);
			},
			ghostClass: 'sortable-ghost',
			chosenClass: 'sortable-chosen',
			dragClass: 'sortable-drag',
			ignore: 'a, img',
			filter: null,
			preventOnFilter: true,
			animation: 0,
			easing: null,
			setData: function (dataTransfer, dragEl) {
				dataTransfer.setData('Text', dragEl.textContent);
			},
			dropBubble: false,
			dragoverBubble: false,
			dataIdAttr: 'data-id',
			delay: 0,
			delayOnTouchOnly: false,
			touchStartThreshold: parseInt(window.devicePixelRatio, 10) || 1,
			forceFallback: false,
			fallbackClass: 'sortable-fallback',
			fallbackOnBody: false,
			fallbackTolerance: 0,
			fallbackOffset: {x: 0, y: 0},
			supportPointer: Sortable.supportPointer !== false && ('PointerEvent' in window),
			emptyInsertThreshold: 5
		};


		// Set default options
		for (var name in defaults) {
			!(name in options) && (options[name] = defaults[name]);
		}

		_prepareGroup(options);

		// Bind all private methods
		for (var fn in this) {
			if (fn.charAt(0) === '_' && typeof this[fn] === 'function') {
				this[fn] = this[fn].bind(this);
			}
		}

		// Setup drag mode
		this.nativeDraggable = options.forceFallback ? false : supportDraggable;

		if (this.nativeDraggable) {
			// Touch start threshold cannot be greater than the native dragstart threshold
			this.options.touchStartThreshold = 1;
		}

		// Bind events
		if (options.supportPointer) {
			_on(el, 'pointerdown', this._onTapStart);
		} else {
			_on(el, 'mousedown', this._onTapStart);
			_on(el, 'touchstart', this._onTapStart);
		}

		if (this.nativeDraggable) {
			_on(el, 'dragover', this);
			_on(el, 'dragenter', this);
		}

		sortables.push(this.el);

		// Restore sorting
		options.store && options.store.get && this.sort(options.store.get(this) || []);
	}

	Sortable.prototype = /** @lends Sortable.prototype */ {
		constructor: Sortable,

		_computeIsAligned: function(evt) {
			var target;

			if (ghostEl && !supportCssPointerEvents) {
				_hideGhostForTarget();
				target = document.elementFromPoint(evt.clientX, evt.clientY);
				_unhideGhostForTarget();
			} else {
				target = evt.target;
			}

			target = _closest(target, this.options.draggable, this.el, false);
			if (_alignedSilent) return;
			if (!dragEl || dragEl.parentNode !== this.el) return;

			var children = this.el.children;
			for (var i = 0; i < children.length; i++) {
				// Don't change for target in case it is changed to aligned before onDragOver is fired
				if (_closest(children[i], this.options.draggable, this.el, false) && children[i] !== target) {
					children[i].sortableMouseAligned = _isClientInRowColumn(evt.clientX, evt.clientY, children[i], this._getDirection(evt, null), this.options);
				}
			}
			// Used for nulling last target when not in element, nothing to do with checking if aligned
			if (!_closest(target, this.options.draggable, this.el, true)) {
				lastTarget = null;
			}

			_alignedSilent = true;
			setTimeout(function() {
				_alignedSilent = false;
			}, 30);

		},

		_getDirection: function(evt, target) {
			return (typeof this.options.direction === 'function') ? this.options.direction.call(this, evt, target, dragEl) : this.options.direction;
		},

		_onTapStart: function (/** Event|TouchEvent */evt) {
			if (!evt.cancelable) return;
			var _this = this,
				el = this.el,
				options = this.options,
				preventOnFilter = options.preventOnFilter,
				type = evt.type,
				touch = evt.touches && evt.touches[0],
				target = (touch || evt).target,
				originalTarget = evt.target.shadowRoot && ((evt.path && evt.path[0]) || (evt.composedPath && evt.composedPath()[0])) || target,
				filter = options.filter,
				startIndex,
				startDraggableIndex;

			_saveInputCheckedState(el);

			// Don't trigger start event when an element is been dragged, otherwise the evt.oldindex always wrong when set option.group.
			if (dragEl) {
				return;
			}

			if (/mousedown|pointerdown/.test(type) && evt.button !== 0 || options.disabled) {
				return; // only left button and enabled
			}

			// cancel dnd if original target is content editable
			if (originalTarget.isContentEditable) {
				return;
			}

			target = _closest(target, options.draggable, el, false);


			if (lastDownEl === target) {
				// Ignoring duplicate `down`
				return;
			}

			// Get the index of the dragged element within its parent
			startIndex = _index(target);
			startDraggableIndex = _index(target, options.draggable);

			// Check filter
			if (typeof filter === 'function') {
				if (filter.call(this, evt, target, this)) {
					_dispatchEvent(_this, originalTarget, 'filter', target, el, el, startIndex, undefined, startDraggableIndex);
					preventOnFilter && evt.cancelable && evt.preventDefault();
					return; // cancel dnd
				}
			}
			else if (filter) {
				filter = filter.split(',').some(function (criteria) {
					criteria = _closest(originalTarget, criteria.trim(), el, false);

					if (criteria) {
						_dispatchEvent(_this, criteria, 'filter', target, el, el, startIndex, undefined, startDraggableIndex);
						return true;
					}
				});

				if (filter) {
					preventOnFilter && evt.cancelable && evt.preventDefault();
					return; // cancel dnd
				}
			}

			if (options.handle && !_closest(originalTarget, options.handle, el, false)) {
				return;
			}

			// Prepare `dragstart`
			this._prepareDragStart(evt, touch, target, startIndex, startDraggableIndex);
		},


		_handleAutoScroll: function(evt, fallback) {
			if (!dragEl || !this.options.scroll) return;
			var x = evt.clientX,
				y = evt.clientY,

				elem = document.elementFromPoint(x, y),
				_this = this;

			// IE does not seem to have native autoscroll,
			// Edge's autoscroll seems too conditional,
			// MACOS Safari does not have autoscroll,
			// Firefox and Chrome are good
			if (fallback || Edge || IE11OrLess || Safari) {
				_autoScroll(evt, _this.options, elem, fallback);

				// Listener for pointer element change
				var ogElemScroller = _getParentAutoScrollElement(elem, true);
				if (
					scrolling &&
					(
						!pointerElemChangedInterval ||
						x !== lastPointerElemX ||
						y !== lastPointerElemY
					)
				) {

					pointerElemChangedInterval && clearInterval(pointerElemChangedInterval);
					// Detect for pointer elem change, emulating native DnD behaviour
					pointerElemChangedInterval = setInterval(function() {
						if (!dragEl) return;
						// could also check if scroll direction on newElem changes due to parent autoscrolling
						var newElem = _getParentAutoScrollElement(document.elementFromPoint(x, y), true);
						if (newElem !== ogElemScroller) {
							ogElemScroller = newElem;
							_clearAutoScrolls();
							_autoScroll(evt, _this.options, ogElemScroller, fallback);
						}
					}, 10);
					lastPointerElemX = x;
					lastPointerElemY = y;
				}

			} else {
				// if DnD is enabled (and browser has good autoscrolling), first autoscroll will already scroll, so get parent autoscroll of first autoscroll
				if (!_this.options.bubbleScroll || _getParentAutoScrollElement(elem, true) === _getWindowScrollingElement()) {
					_clearAutoScrolls();
					return;
				}
				_autoScroll(evt, _this.options, _getParentAutoScrollElement(elem, false), false);
			}
		},

		_prepareDragStart: function (/** Event */evt, /** Touch */touch, /** HTMLElement */target, /** Number */startIndex, /** Number */startDraggableIndex) {
			var _this = this,
				el = _this.el,
				options = _this.options,
				ownerDocument = el.ownerDocument,
				dragStartFn;

			if (target && !dragEl && (target.parentNode === el)) {
				rootEl = el;
				dragEl = target;
				parentEl = dragEl.parentNode;
				nextEl = dragEl.nextSibling;
				lastDownEl = target;
				activeGroup = options.group;
				oldIndex = startIndex;
				oldDraggableIndex = startDraggableIndex;

				tapEvt = {
					target: dragEl,
					clientX: (touch || evt).clientX,
					clientY: (touch || evt).clientY
				};

				this._lastX = (touch || evt).clientX;
				this._lastY = (touch || evt).clientY;

				dragEl.style['will-change'] = 'all';
				// undo animation if needed
				dragEl.style.transition = '';
				dragEl.style.transform = '';

				dragStartFn = function () {
					// Delayed drag has been triggered
					// we can re-enable the events: touchmove/mousemove
					_this._disableDelayedDragEvents();

					if (!FireFox && _this.nativeDraggable) {
						dragEl.draggable = true;
					}

					// Bind the events: dragstart/dragend
					_this._triggerDragStart(evt, touch);

					// Drag start event
					_dispatchEvent(_this, rootEl, 'choose', dragEl, rootEl, rootEl, oldIndex, undefined, oldDraggableIndex);

					// Chosen item
					_toggleClass(dragEl, options.chosenClass, true);
				};

				// Disable "draggable"
				options.ignore.split(',').forEach(function (criteria) {
					_find(dragEl, criteria.trim(), _disableDraggable);
				});

				_on(ownerDocument, 'dragover', nearestEmptyInsertDetectEvent);
				_on(ownerDocument, 'mousemove', nearestEmptyInsertDetectEvent);
				_on(ownerDocument, 'touchmove', nearestEmptyInsertDetectEvent);

				_on(ownerDocument, 'mouseup', _this._onDrop);
				_on(ownerDocument, 'touchend', _this._onDrop);
				_on(ownerDocument, 'touchcancel', _this._onDrop);

				// Make dragEl draggable (must be before delay for FireFox)
				if (FireFox && this.nativeDraggable) {
					this.options.touchStartThreshold = 4;
					dragEl.draggable = true;
				}

				// Delay is impossible for native DnD in Edge or IE
				if (options.delay && (options.delayOnTouchOnly ? touch : true) && (!this.nativeDraggable || !(Edge || IE11OrLess))) {
					// If the user moves the pointer or let go the click or touch
					// before the delay has been reached:
					// disable the delayed drag
					_on(ownerDocument, 'mouseup', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchend', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchcancel', _this._disableDelayedDrag);
					_on(ownerDocument, 'mousemove', _this._delayedDragTouchMoveHandler);
					_on(ownerDocument, 'touchmove', _this._delayedDragTouchMoveHandler);
					options.supportPointer && _on(ownerDocument, 'pointermove', _this._delayedDragTouchMoveHandler);

					_this._dragStartTimer = setTimeout(dragStartFn, options.delay);
				} else {
					dragStartFn();
				}
			}
		},

		_delayedDragTouchMoveHandler: function (/** TouchEvent|PointerEvent **/e) {
			var touch = e.touches ? e.touches[0] : e;
			if (max(abs(touch.clientX - this._lastX), abs(touch.clientY - this._lastY))
					>= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1))
			) {
				this._disableDelayedDrag();
			}
		},

		_disableDelayedDrag: function () {
			dragEl && _disableDraggable(dragEl);
			clearTimeout(this._dragStartTimer);

			this._disableDelayedDragEvents();
		},

		_disableDelayedDragEvents: function () {
			var ownerDocument = this.el.ownerDocument;
			_off(ownerDocument, 'mouseup', this._disableDelayedDrag);
			_off(ownerDocument, 'touchend', this._disableDelayedDrag);
			_off(ownerDocument, 'touchcancel', this._disableDelayedDrag);
			_off(ownerDocument, 'mousemove', this._delayedDragTouchMoveHandler);
			_off(ownerDocument, 'touchmove', this._delayedDragTouchMoveHandler);
			_off(ownerDocument, 'pointermove', this._delayedDragTouchMoveHandler);
		},

		_triggerDragStart: function (/** Event */evt, /** Touch */touch) {
			touch = touch || (evt.pointerType == 'touch' ? evt : null);

			if (!this.nativeDraggable || touch) {
				if (this.options.supportPointer) {
					_on(document, 'pointermove', this._onTouchMove);
				} else if (touch) {
					_on(document, 'touchmove', this._onTouchMove);
				} else {
					_on(document, 'mousemove', this._onTouchMove);
				}
			} else {
				_on(dragEl, 'dragend', this);
				_on(rootEl, 'dragstart', this._onDragStart);
			}

			try {
				if (document.selection) {
					// Timeout neccessary for IE9
					_nextTick(function () {
						document.selection.empty();
					});
				} else {
					window.getSelection().removeAllRanges();
				}
			} catch (err) {
			}
		},

		_dragStarted: function (fallback, evt) {
			awaitingDragStarted = false;
			if (rootEl && dragEl) {
				if (this.nativeDraggable) {
					_on(document, 'dragover', this._handleAutoScroll);
					_on(document, 'dragover', _checkAlignment);
				}
				var options = this.options;

				// Apply effect
				!fallback && _toggleClass(dragEl, options.dragClass, false);
				_toggleClass(dragEl, options.ghostClass, true);

				// In case dragging an animated element
				_css(dragEl, 'transform', '');

				Sortable.active = this;

				fallback && this._appendGhost();

				// Drag start event
				_dispatchEvent(this, rootEl, 'start', dragEl, rootEl, rootEl, oldIndex, undefined, oldDraggableIndex, undefined, evt);
			} else {
				this._nulling();
			}
		},

		_emulateDragOver: function (forAutoScroll) {
			if (touchEvt) {
				if (this._lastX === touchEvt.clientX && this._lastY === touchEvt.clientY && !forAutoScroll) {
					return;
				}
				this._lastX = touchEvt.clientX;
				this._lastY = touchEvt.clientY;

				_hideGhostForTarget();

				var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
				var parent = target;

				while (target && target.shadowRoot) {
					target = target.shadowRoot.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
					if (target === parent) break;
					parent = target;
				}

				if (parent) {
					do {
						if (parent[expando]) {
							var inserted;

							inserted = parent[expando]._onDragOver({
								clientX: touchEvt.clientX,
								clientY: touchEvt.clientY,
								target: target,
								rootEl: parent
							});

							if (inserted && !this.options.dragoverBubble) {
								break;
							}
						}

						target = parent; // store last element
					}
					/* jshint boss:true */
					while (parent = parent.parentNode);
				}
				dragEl.parentNode[expando]._computeIsAligned(touchEvt);

				_unhideGhostForTarget();
			}
		},


		_onTouchMove: function (/**TouchEvent*/evt, forAutoScroll) {
			if (tapEvt) {
				var	options = this.options,
					fallbackTolerance = options.fallbackTolerance,
					fallbackOffset = options.fallbackOffset,
					touch = evt.touches ? evt.touches[0] : evt,
					matrix = ghostEl && _matrix(ghostEl),
					scaleX = ghostEl && matrix && matrix.a,
					scaleY = ghostEl && matrix && matrix.d,
					relativeScrollOffset = PositionGhostAbsolutely && ghostRelativeParent && _getRelativeScrollOffset(ghostRelativeParent),
					dx = ((touch.clientX - tapEvt.clientX)
							+ fallbackOffset.x) / (scaleX || 1)
							+ (relativeScrollOffset ? (relativeScrollOffset[0] - ghostRelativeParentInitialScroll[0]) : 0) / (scaleX || 1),
					dy = ((touch.clientY - tapEvt.clientY)
							+ fallbackOffset.y) / (scaleY || 1)
							+ (relativeScrollOffset ? (relativeScrollOffset[1] - ghostRelativeParentInitialScroll[1]) : 0) / (scaleY || 1),
					translate3d = evt.touches ? 'translate3d(' + dx + 'px,' + dy + 'px,0)' : 'translate(' + dx + 'px,' + dy + 'px)';

				// only set the status to dragging, when we are actually dragging
				if (!Sortable.active && !awaitingDragStarted) {
					if (fallbackTolerance &&
						min(abs(touch.clientX - this._lastX), abs(touch.clientY - this._lastY)) < fallbackTolerance
					) {
						return;
					}
					this._onDragStart(evt, true);
				}

				!forAutoScroll && this._handleAutoScroll(touch, true);

				moved = true;
				touchEvt = touch;

				_css(ghostEl, 'webkitTransform', translate3d);
				_css(ghostEl, 'mozTransform', translate3d);
				_css(ghostEl, 'msTransform', translate3d);
				_css(ghostEl, 'transform', translate3d);

				evt.cancelable && evt.preventDefault();
			}
		},

		_appendGhost: function () {
			// Bug if using scale(): https://stackoverflow.com/questions/2637058
			// Not being adjusted for
			if (!ghostEl) {
				var container = this.options.fallbackOnBody ? document.body : rootEl,
					rect = _getRect(dragEl, true, container, !PositionGhostAbsolutely),
					css = _css(dragEl),
					options = this.options;

				// Position absolutely
				if (PositionGhostAbsolutely) {
					// Get relatively positioned parent
					ghostRelativeParent = container;

					while (
						_css(ghostRelativeParent, 'position') === 'static' &&
						_css(ghostRelativeParent, 'transform') === 'none' &&
						ghostRelativeParent !== document
					) {
						ghostRelativeParent = ghostRelativeParent.parentNode;
					}

					if (ghostRelativeParent !== document) {
						var ghostRelativeParentRect = _getRect(ghostRelativeParent, true);

						rect.top -= ghostRelativeParentRect.top;
						rect.left -= ghostRelativeParentRect.left;
					}

					if (ghostRelativeParent !== document.body && ghostRelativeParent !== document.documentElement) {
						if (ghostRelativeParent === document) ghostRelativeParent = _getWindowScrollingElement();

						rect.top += ghostRelativeParent.scrollTop;
						rect.left += ghostRelativeParent.scrollLeft;
					} else {
						ghostRelativeParent = _getWindowScrollingElement();
					}
					ghostRelativeParentInitialScroll = _getRelativeScrollOffset(ghostRelativeParent);
				}


				ghostEl = dragEl.cloneNode(true);

				_toggleClass(ghostEl, options.ghostClass, false);
				_toggleClass(ghostEl, options.fallbackClass, true);
				_toggleClass(ghostEl, options.dragClass, true);

				_css(ghostEl, 'box-sizing', 'border-box');
				_css(ghostEl, 'margin', 0);
				_css(ghostEl, 'top', rect.top);
				_css(ghostEl, 'left', rect.left);
				_css(ghostEl, 'width', rect.width);
				_css(ghostEl, 'height', rect.height);
				_css(ghostEl, 'opacity', '0.8');
				_css(ghostEl, 'position', (PositionGhostAbsolutely ? 'absolute' : 'fixed'));
				_css(ghostEl, 'zIndex', '100000');
				_css(ghostEl, 'pointerEvents', 'none');

				container.appendChild(ghostEl);
			}
		},

		_onDragStart: function (/**Event*/evt, /**boolean*/fallback) {
			var _this = this;
			var dataTransfer = evt.dataTransfer;
			var options = _this.options;

			// Setup clone
			cloneEl = _clone(dragEl);

			cloneEl.draggable = false;
			cloneEl.style['will-change'] = '';

			this._hideClone();

			_toggleClass(cloneEl, _this.options.chosenClass, false);


			// #1143: IFrame support workaround
			_this._cloneId = _nextTick(function () {
				if (!_this.options.removeCloneOnHide) {
					rootEl.insertBefore(cloneEl, dragEl);
				}
				_dispatchEvent(_this, rootEl, 'clone', dragEl);
			});


			!fallback && _toggleClass(dragEl, options.dragClass, true);

			// Set proper drop events
			if (fallback) {
				ignoreNextClick = true;
				_this._loopId = setInterval(_this._emulateDragOver, 50);
			} else {
				// Undo what was set in _prepareDragStart before drag started
				_off(document, 'mouseup', _this._onDrop);
				_off(document, 'touchend', _this._onDrop);
				_off(document, 'touchcancel', _this._onDrop);

				if (dataTransfer) {
					dataTransfer.effectAllowed = 'move';
					options.setData && options.setData.call(_this, dataTransfer, dragEl);
				}

				_on(document, 'drop', _this);

				// #1276 fix:
				_css(dragEl, 'transform', 'translateZ(0)');
			}

			awaitingDragStarted = true;

			_this._dragStartId = _nextTick(_this._dragStarted.bind(_this, fallback, evt));
			_on(document, 'selectstart', _this);
			if (Safari) {
				_css(document.body, 'user-select', 'none');
			}
		},


		// Returns true - if no further action is needed (either inserted or another condition)
		_onDragOver: function (/**Event*/evt) {
			var el = this.el,
				target = evt.target,
				dragRect,
				targetRect,
				revert,
				options = this.options,
				group = options.group,
				activeSortable = Sortable.active,
				isOwner = (activeGroup === group),
				canSort = options.sort,
				_this = this;

			if (_silent) return;

			// Return invocation when dragEl is inserted (or completed)
			function completed(insertion) {
				if (insertion) {
					if (isOwner) {
						activeSortable._hideClone();
					} else {
						activeSortable._showClone(_this);
					}

					if (activeSortable) {
						// Set ghost class to new sortable's ghost class
						_toggleClass(dragEl, putSortable ? putSortable.options.ghostClass : activeSortable.options.ghostClass, false);
						_toggleClass(dragEl, options.ghostClass, true);
					}

					if (putSortable !== _this && _this !== Sortable.active) {
						putSortable = _this;
					} else if (_this === Sortable.active) {
						putSortable = null;
					}

					// Animation
					dragRect && _this._animate(dragRect, dragEl);
					target && targetRect && _this._animate(targetRect, target);
				}


				// Null lastTarget if it is not inside a previously swapped element
				if ((target === dragEl && !dragEl.animated) || (target === el && !target.animated)) {
					lastTarget = null;
				}

				// no bubbling and not fallback
				if (!options.dragoverBubble && !evt.rootEl && target !== document) {
					_this._handleAutoScroll(evt);
					dragEl.parentNode[expando]._computeIsAligned(evt);

					// Do not detect for empty insert if already inserted
					!insertion && nearestEmptyInsertDetectEvent(evt);
				}

				!options.dragoverBubble && evt.stopPropagation && evt.stopPropagation();

				return true;
			}

			// Call when dragEl has been inserted
			function changed() {
				_dispatchEvent(_this, rootEl, 'change', target, el, rootEl, oldIndex, _index(dragEl), oldDraggableIndex, _index(dragEl, options.draggable), evt);
			}


			if (evt.preventDefault !== void 0) {
				evt.cancelable && evt.preventDefault();
			}


			moved = true;

			target = _closest(target, options.draggable, el, true);

			// target is dragEl or target is animated
			if (dragEl.contains(evt.target) || target.animated) {
				return completed(false);
			}

			if (target !== dragEl) {
				ignoreNextClick = false;
			}

			if (activeSortable && !options.disabled &&
				(isOwner
					? canSort || (revert = !rootEl.contains(dragEl)) // Reverting item into the original list
					: (
						putSortable === this ||
						(
							(this.lastPutMode = activeGroup.checkPull(this, activeSortable, dragEl, evt)) &&
							group.checkPut(this, activeSortable, dragEl, evt)
						)
					)
				)
			) {
				var axis = this._getDirection(evt, target);

				dragRect = _getRect(dragEl);

				if (revert) {
					this._hideClone();
					parentEl = rootEl; // actualization

					if (nextEl) {
						rootEl.insertBefore(dragEl, nextEl);
					} else {
						rootEl.appendChild(dragEl);
					}

					return completed(true);
				}

				var elLastChild = _lastChild(el);

				if (!elLastChild || _ghostIsLast(evt, axis, el) && !elLastChild.animated) {
					// assign target only if condition is true
					if (elLastChild && el === evt.target) {
						target = elLastChild;
					}

					if (target) {
						targetRect = _getRect(target);
					}

					if (isOwner) {
						activeSortable._hideClone();
					} else {
						activeSortable._showClone(this);
					}

					if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, !!target) !== false) {
						el.appendChild(dragEl);
						parentEl = el; // actualization
						realDragElRect = null;

						changed();
						return completed(true);
					}
				}
				else if (target && target !== dragEl && target.parentNode === el) {
					var direction = 0,
						targetBeforeFirstSwap,
						aligned = target.sortableMouseAligned,
						differentLevel = dragEl.parentNode !== el,
						side1 = axis === 'vertical' ? 'top' : 'left',
						scrolledPastTop = _isScrolledPast(target, 'top') || _isScrolledPast(dragEl, 'top'),
						scrollBefore = scrolledPastTop ? scrolledPastTop.scrollTop : void 0;


					if (lastTarget !== target) {
						lastMode = null;
						targetBeforeFirstSwap = _getRect(target)[side1];
						pastFirstInvertThresh = false;
					}

					// Reference: https://www.lucidchart.com/documents/view/10fa0e93-e362-4126-aca2-b709ee56bd8b/0
					if (
						_isElInRowColumn(dragEl, target, axis) && aligned ||
						differentLevel ||
						scrolledPastTop ||
						options.invertSwap ||
						lastMode === 'insert' ||
						// Needed, in the case that we are inside target and inserted because not aligned... aligned will stay false while inside
						// and lastMode will change to 'insert', but we must swap
						lastMode === 'swap'
					) {
						// New target that we will be inside
						if (lastMode !== 'swap') {
							isCircumstantialInvert = options.invertSwap || differentLevel;
						}

						direction = _getSwapDirection(evt, target, axis,
							options.swapThreshold, options.invertedSwapThreshold == null ? options.swapThreshold : options.invertedSwapThreshold,
							isCircumstantialInvert,
							lastTarget === target);
						lastMode = 'swap';
					} else {
						// Insert at position
						direction = _getInsertDirection(target);
						lastMode = 'insert';
					}
					if (direction === 0) return completed(false);

					realDragElRect = null;
					lastTarget = target;

					lastDirection = direction;

					targetRect = _getRect(target);

					var nextSibling = target.nextElementSibling,
						after = false;

					after = direction === 1;

					var moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, after);

					if (moveVector !== false) {
						if (moveVector === 1 || moveVector === -1) {
							after = (moveVector === 1);
						}

						_silent = true;
						setTimeout(_unsilent, 30);

						if (isOwner) {
							activeSortable._hideClone();
						} else {
							activeSortable._showClone(this);
						}

						if (after && !nextSibling) {
							el.appendChild(dragEl);
						} else {
							target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
						}

						// Undo chrome's scroll adjustment
						if (scrolledPastTop) {
							_scrollBy(scrolledPastTop, 0, scrollBefore - scrolledPastTop.scrollTop);
						}

						parentEl = dragEl.parentNode; // actualization

						// must be done before animation
						if (targetBeforeFirstSwap !== undefined && !isCircumstantialInvert) {
							targetMoveDistance = abs(targetBeforeFirstSwap - _getRect(target)[side1]);
						}
						changed();

						return completed(true);
					}
				}

				if (el.contains(dragEl)) {
					return completed(false);
				}
			}

			return false;
		},

		_animate: function (prevRect, target) {
			var ms = this.options.animation;

			if (ms) {
				var currentRect = _getRect(target);

				if (target === dragEl) {
					realDragElRect = currentRect;
				}

				if (prevRect.nodeType === 1) {
					prevRect = _getRect(prevRect);
				}

				// Check if actually moving position
				if ((prevRect.left + prevRect.width / 2) !== (currentRect.left + currentRect.width / 2)
					|| (prevRect.top + prevRect.height / 2) !== (currentRect.top + currentRect.height / 2)
				) {
					var matrix = _matrix(this.el),
						scaleX = matrix && matrix.a,
						scaleY = matrix && matrix.d;

					_css(target, 'transition', 'none');
					_css(target, 'transform', 'translate3d('
						+ (prevRect.left - currentRect.left) / (scaleX ? scaleX : 1) + 'px,'
						+ (prevRect.top - currentRect.top) / (scaleY ? scaleY : 1) + 'px,0)'
					);

					this._repaint(target);
					_css(target, 'transition', 'transform ' + ms + 'ms' + (this.options.easing ? ' ' + this.options.easing : ''));
					_css(target, 'transform', 'translate3d(0,0,0)');
				}

				(typeof target.animated === 'number') && clearTimeout(target.animated);
				target.animated = setTimeout(function () {
					_css(target, 'transition', '');
					_css(target, 'transform', '');
					target.animated = false;
				}, ms);
			}
		},

		_repaint: function(target) {
			return target.offsetWidth;
		},

		_offMoveEvents: function() {
			_off(document, 'touchmove', this._onTouchMove);
			_off(document, 'pointermove', this._onTouchMove);
			_off(document, 'dragover', nearestEmptyInsertDetectEvent);
			_off(document, 'mousemove', nearestEmptyInsertDetectEvent);
			_off(document, 'touchmove', nearestEmptyInsertDetectEvent);
		},

		_offUpEvents: function () {
			var ownerDocument = this.el.ownerDocument;

			_off(ownerDocument, 'mouseup', this._onDrop);
			_off(ownerDocument, 'touchend', this._onDrop);
			_off(ownerDocument, 'pointerup', this._onDrop);
			_off(ownerDocument, 'touchcancel', this._onDrop);
			_off(document, 'selectstart', this);
		},

		_onDrop: function (/**Event*/evt) {
			var el = this.el,
				options = this.options;
			awaitingDragStarted = false;
			scrolling = false;
			isCircumstantialInvert = false;
			pastFirstInvertThresh = false;

			clearInterval(this._loopId);

			clearInterval(pointerElemChangedInterval);
			_clearAutoScrolls();
			_cancelThrottle();

			clearTimeout(this._dragStartTimer);

			_cancelNextTick(this._cloneId);
			_cancelNextTick(this._dragStartId);

			// Unbind events
			_off(document, 'mousemove', this._onTouchMove);


			if (this.nativeDraggable) {
				_off(document, 'drop', this);
				_off(el, 'dragstart', this._onDragStart);
				_off(document, 'dragover', this._handleAutoScroll);
				_off(document, 'dragover', _checkAlignment);
			}

			if (Safari) {
				_css(document.body, 'user-select', '');
			}

			this._offMoveEvents();
			this._offUpEvents();

			if (evt) {
				if (moved) {
					evt.cancelable && evt.preventDefault();
					!options.dropBubble && evt.stopPropagation();
				}

				ghostEl && ghostEl.parentNode && ghostEl.parentNode.removeChild(ghostEl);

				if (rootEl === parentEl || (putSortable && putSortable.lastPutMode !== 'clone')) {
					// Remove clone
					cloneEl && cloneEl.parentNode && cloneEl.parentNode.removeChild(cloneEl);
				}

				if (dragEl) {
					if (this.nativeDraggable) {
						_off(dragEl, 'dragend', this);
					}

					_disableDraggable(dragEl);
					dragEl.style['will-change'] = '';

					// Remove class's
					_toggleClass(dragEl, putSortable ? putSortable.options.ghostClass : this.options.ghostClass, false);
					_toggleClass(dragEl, this.options.chosenClass, false);

					// Drag stop event
					_dispatchEvent(this, rootEl, 'unchoose', dragEl, parentEl, rootEl, oldIndex, null, oldDraggableIndex, null, evt);

					if (rootEl !== parentEl) {
						newIndex = _index(dragEl);
						newDraggableIndex = _index(dragEl, options.draggable);

						if (newIndex >= 0) {
							// Add event
							_dispatchEvent(null, parentEl, 'add', dragEl, parentEl, rootEl, oldIndex, newIndex, oldDraggableIndex, newDraggableIndex, evt);

							// Remove event
							_dispatchEvent(this, rootEl, 'remove', dragEl, parentEl, rootEl, oldIndex, newIndex, oldDraggableIndex, newDraggableIndex, evt);

							// drag from one list and drop into another
							_dispatchEvent(null, parentEl, 'sort', dragEl, parentEl, rootEl, oldIndex, newIndex, oldDraggableIndex, newDraggableIndex, evt);
							_dispatchEvent(this, rootEl, 'sort', dragEl, parentEl, rootEl, oldIndex, newIndex, oldDraggableIndex, newDraggableIndex, evt);
						}

						putSortable && putSortable.save();
					}
					else {
						if (dragEl.nextSibling !== nextEl) {
							// Get the index of the dragged element within its parent
							newIndex = _index(dragEl);
							newDraggableIndex = _index(dragEl, options.draggable);

							if (newIndex >= 0) {
								// drag & drop within the same list
								_dispatchEvent(this, rootEl, 'update', dragEl, parentEl, rootEl, oldIndex, newIndex, oldDraggableIndex, newDraggableIndex, evt);
								_dispatchEvent(this, rootEl, 'sort', dragEl, parentEl, rootEl, oldIndex, newIndex, oldDraggableIndex, newDraggableIndex, evt);
							}
						}
					}

					if (Sortable.active) {
						/* jshint eqnull:true */
						if (newIndex == null || newIndex === -1) {
							newIndex = oldIndex;
							newDraggableIndex = oldDraggableIndex;
						}
						_dispatchEvent(this, rootEl, 'end', dragEl, parentEl, rootEl, oldIndex, newIndex, oldDraggableIndex, newDraggableIndex, evt);

						// Save sorting
						this.save();
					}
				}

			}
			this._nulling();
		},

		_nulling: function() {
			rootEl =
			dragEl =
			parentEl =
			ghostEl =
			nextEl =
			cloneEl =
			lastDownEl =

			scrollEl =
			scrollParentEl =
			autoScrolls.length =

			pointerElemChangedInterval =
			lastPointerElemX =
			lastPointerElemY =

			tapEvt =
			touchEvt =

			moved =
			newIndex =
			oldIndex =

			lastTarget =
			lastDirection =

			realDragElRect =

			putSortable =
			activeGroup =
			Sortable.active = null;

			savedInputChecked.forEach(function (el) {
				el.checked = true;
			});

			savedInputChecked.length = 0;
		},

		handleEvent: function (/**Event*/evt) {
			switch (evt.type) {
				case 'drop':
				case 'dragend':
					this._onDrop(evt);
					break;

				case 'dragenter':
				case 'dragover':
					if (dragEl) {
						this._onDragOver(evt);
						_globalDragOver(evt);
					}
					break;

				case 'selectstart':
					evt.preventDefault();
					break;
			}
		},


		/**
		 * Serializes the item into an array of string.
		 * @returns {String[]}
		 */
		toArray: function () {
			var order = [],
				el,
				children = this.el.children,
				i = 0,
				n = children.length,
				options = this.options;

			for (; i < n; i++) {
				el = children[i];
				if (_closest(el, options.draggable, this.el, false)) {
					order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
				}
			}

			return order;
		},


		/**
		 * Sorts the elements according to the array.
		 * @param  {String[]}  order  order of the items
		 */
		sort: function (order) {
			var items = {}, rootEl = this.el;

			this.toArray().forEach(function (id, i) {
				var el = rootEl.children[i];

				if (_closest(el, this.options.draggable, rootEl, false)) {
					items[id] = el;
				}
			}, this);

			order.forEach(function (id) {
				if (items[id]) {
					rootEl.removeChild(items[id]);
					rootEl.appendChild(items[id]);
				}
			});
		},


		/**
		 * Save the current sorting
		 */
		save: function () {
			var store = this.options.store;
			store && store.set && store.set(this);
		},


		/**
		 * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
		 * @param   {HTMLElement}  el
		 * @param   {String}       [selector]  default: `options.draggable`
		 * @returns {HTMLElement|null}
		 */
		closest: function (el, selector) {
			return _closest(el, selector || this.options.draggable, this.el, false);
		},


		/**
		 * Set/get option
		 * @param   {string} name
		 * @param   {*}      [value]
		 * @returns {*}
		 */
		option: function (name, value) {
			var options = this.options;

			if (value === void 0) {
				return options[name];
			} else {
				options[name] = value;

				if (name === 'group') {
					_prepareGroup(options);
				}
			}
		},


		/**
		 * Destroy
		 */
		destroy: function () {
			var el = this.el;

			el[expando] = null;

			_off(el, 'mousedown', this._onTapStart);
			_off(el, 'touchstart', this._onTapStart);
			_off(el, 'pointerdown', this._onTapStart);

			if (this.nativeDraggable) {
				_off(el, 'dragover', this);
				_off(el, 'dragenter', this);
			}
			// Remove draggable attributes
			Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function (el) {
				el.removeAttribute('draggable');
			});

			this._onDrop();

			sortables.splice(sortables.indexOf(this.el), 1);

			this.el = el = null;
		},

		_hideClone: function() {
			if (!cloneEl.cloneHidden) {
				_css(cloneEl, 'display', 'none');
				cloneEl.cloneHidden = true;
				if (cloneEl.parentNode && this.options.removeCloneOnHide) {
					cloneEl.parentNode.removeChild(cloneEl);
				}
			}
		},

		_showClone: function(putSortable) {
			if (putSortable.lastPutMode !== 'clone') {
				this._hideClone();
				return;
			}

			if (cloneEl.cloneHidden) {
				// show clone at dragEl or original position
				if (rootEl.contains(dragEl) && !this.options.group.revertClone) {
					rootEl.insertBefore(cloneEl, dragEl);
				} else if (nextEl) {
					rootEl.insertBefore(cloneEl, nextEl);
				} else {
					rootEl.appendChild(cloneEl);
				}

				if (this.options.group.revertClone) {
					this._animate(dragEl, cloneEl);
				}
				_css(cloneEl, 'display', '');
				cloneEl.cloneHidden = false;
			}
		}
	};

	function _closest(/**HTMLElement*/el, /**String*/selector, /**HTMLElement*/ctx, includeCTX) {
		if (el) {
			ctx = ctx || document;

			do {
				if (
					selector != null &&
					(
						selector[0] === '>' ?
						el.parentNode === ctx && _matches(el, selector) :
						_matches(el, selector)
					) ||
					includeCTX && el === ctx
				) {
					return el;
				}

				if (el === ctx) break;
				/* jshint boss:true */
			} while (el = _getParentOrHost(el));
		}

		return null;
	}


	function _getParentOrHost(el) {
		return (el.host && el !== document && el.host.nodeType)
			? el.host
			: el.parentNode;
	}


	function _globalDragOver(/**Event*/evt) {
		if (evt.dataTransfer) {
			evt.dataTransfer.dropEffect = 'move';
		}
		evt.cancelable && evt.preventDefault();
	}


	function _on(el, event, fn) {
		el.addEventListener(event, fn, IE11OrLess ? false : captureMode);
	}


	function _off(el, event, fn) {
		el.removeEventListener(event, fn, IE11OrLess ? false : captureMode);
	}


	function _toggleClass(el, name, state) {
		if (el && name) {
			if (el.classList) {
				el.classList[state ? 'add' : 'remove'](name);
			}
			else {
				var className = (' ' + el.className + ' ').replace(R_SPACE, ' ').replace(' ' + name + ' ', ' ');
				el.className = (className + (state ? ' ' + name : '')).replace(R_SPACE, ' ');
			}
		}
	}


	function _css(el, prop, val) {
		var style = el && el.style;

		if (style) {
			if (val === void 0) {
				if (document.defaultView && document.defaultView.getComputedStyle) {
					val = document.defaultView.getComputedStyle(el, '');
				}
				else if (el.currentStyle) {
					val = el.currentStyle;
				}

				return prop === void 0 ? val : val[prop];
			}
			else {
				if (!(prop in style) && prop.indexOf('webkit') === -1) {
					prop = '-webkit-' + prop;
				}

				style[prop] = val + (typeof val === 'string' ? '' : 'px');
			}
		}
	}

	function _matrix(el) {
		var appliedTransforms = '';
		do {
			var transform = _css(el, 'transform');

			if (transform && transform !== 'none') {
				appliedTransforms = transform + ' ' + appliedTransforms;
			}
			/* jshint boss:true */
		} while (el = el.parentNode);

		if (window.DOMMatrix) {
			return new DOMMatrix(appliedTransforms);
		} else if (window.WebKitCSSMatrix) {
			return new WebKitCSSMatrix(appliedTransforms);
		} else if (window.CSSMatrix) {
			return new CSSMatrix(appliedTransforms);
		}
	}


	function _find(ctx, tagName, iterator) {
		if (ctx) {
			var list = ctx.getElementsByTagName(tagName), i = 0, n = list.length;

			if (iterator) {
				for (; i < n; i++) {
					iterator(list[i], i);
				}
			}

			return list;
		}

		return [];
	}



	function _dispatchEvent(
		sortable, rootEl, name,
		targetEl, toEl, fromEl,
		startIndex, newIndex,
		startDraggableIndex, newDraggableIndex,
		originalEvt
	) {
		sortable = (sortable || rootEl[expando]);
		var evt,
			options = sortable.options,
			onName = 'on' + name.charAt(0).toUpperCase() + name.substr(1);
		// Support for new CustomEvent feature
		if (window.CustomEvent && !IE11OrLess && !Edge) {
			evt = new CustomEvent(name, {
				bubbles: true,
				cancelable: true
			});
		} else {
			evt = document.createEvent('Event');
			evt.initEvent(name, true, true);
		}

		evt.to = toEl || rootEl;
		evt.from = fromEl || rootEl;
		evt.item = targetEl || rootEl;
		evt.clone = cloneEl;

		evt.oldIndex = startIndex;
		evt.newIndex = newIndex;

		evt.oldDraggableIndex = startDraggableIndex;
		evt.newDraggableIndex = newDraggableIndex;

		evt.originalEvent = originalEvt;
		evt.pullMode = putSortable ? putSortable.lastPutMode : undefined;

		if (rootEl) {
			rootEl.dispatchEvent(evt);
		}

		if (options[onName]) {
			options[onName].call(sortable, evt);
		}
	}


	function _onMove(fromEl, toEl, dragEl, dragRect, targetEl, targetRect, originalEvt, willInsertAfter) {
		var evt,
			sortable = fromEl[expando],
			onMoveFn = sortable.options.onMove,
			retVal;
		// Support for new CustomEvent feature
		if (window.CustomEvent && !IE11OrLess && !Edge) {
			evt = new CustomEvent('move', {
				bubbles: true,
				cancelable: true
			});
		} else {
			evt = document.createEvent('Event');
			evt.initEvent('move', true, true);
		}

		evt.to = toEl;
		evt.from = fromEl;
		evt.dragged = dragEl;
		evt.draggedRect = dragRect;
		evt.related = targetEl || toEl;
		evt.relatedRect = targetRect || _getRect(toEl);
		evt.willInsertAfter = willInsertAfter;

		evt.originalEvent = originalEvt;

		fromEl.dispatchEvent(evt);

		if (onMoveFn) {
			retVal = onMoveFn.call(sortable, evt, originalEvt);
		}

		return retVal;
	}

	function _disableDraggable(el) {
		el.draggable = false;
	}

	function _unsilent() {
		_silent = false;
	}

	/**
	 * Gets nth child of el, ignoring hidden children, sortable's elements (does not ignore clone if it's visible)
	 * and non-draggable elements
	 * @param  {HTMLElement} el       The parent element
	 * @param  {Number} childNum      The index of the child
	 * @param  {Object} options       Parent Sortable's options
	 * @return {HTMLElement}          The child at index childNum, or null if not found
	 */
	function _getChild(el, childNum, options) {
		var currentChild = 0,
			i = 0,
			children = el.children;

		while (i < children.length) {
			if (
				children[i].style.display !== 'none' &&
				children[i] !== ghostEl &&
				children[i] !== dragEl &&
				_closest(children[i], options.draggable, el, false)
			) {
				if (currentChild === childNum) {
					return children[i];
				}
				currentChild++;
			}

			i++;
		}
		return null;
	}

	/**
	 * Gets the last child in the el, ignoring ghostEl or invisible elements (clones)
	 * @param  {HTMLElement} el       Parent element
	 * @return {HTMLElement}          The last child, ignoring ghostEl
	 */
	function _lastChild(el) {
		var last = el.lastElementChild;

		while (last && (last === ghostEl || _css(last, 'display') === 'none')) {
			last = last.previousElementSibling;
		}

		return last || null;
	}

	function _ghostIsLast(evt, axis, el) {
		var elRect = _getRect(_lastChild(el)),
			mouseOnAxis = axis === 'vertical' ? evt.clientY : evt.clientX,
			mouseOnOppAxis = axis === 'vertical' ? evt.clientX : evt.clientY,
			targetS2 = axis === 'vertical' ? elRect.bottom : elRect.right,
			targetS1Opp = axis === 'vertical' ? elRect.left : elRect.top,
			targetS2Opp = axis === 'vertical' ? elRect.right : elRect.bottom,
			spacer = 10;

		return (
			axis === 'vertical' ?
				(mouseOnOppAxis > targetS2Opp + spacer || mouseOnOppAxis <= targetS2Opp && mouseOnAxis > targetS2 && mouseOnOppAxis >= targetS1Opp) :
				(mouseOnAxis > targetS2 && mouseOnOppAxis > targetS1Opp || mouseOnAxis <= targetS2 && mouseOnOppAxis > targetS2Opp + spacer)
		);
	}

	function _getSwapDirection(evt, target, axis, swapThreshold, invertedSwapThreshold, invertSwap, isLastTarget) {
		var targetRect = _getRect(target),
			mouseOnAxis = axis === 'vertical' ? evt.clientY : evt.clientX,
			targetLength = axis === 'vertical' ? targetRect.height : targetRect.width,
			targetS1 = axis === 'vertical' ? targetRect.top : targetRect.left,
			targetS2 = axis === 'vertical' ? targetRect.bottom : targetRect.right,
			dragRect = _getRect(dragEl),
			invert = false;


		if (!invertSwap) {
			// Never invert or create dragEl shadow when target movemenet causes mouse to move past the end of regular swapThreshold
			if (isLastTarget && targetMoveDistance < targetLength * swapThreshold) { // multiplied only by swapThreshold because mouse will already be inside target by (1 - threshold) * targetLength / 2
				// check if past first invert threshold on side opposite of lastDirection
				if (!pastFirstInvertThresh &&
					(lastDirection === 1 ?
						(
							mouseOnAxis > targetS1 + targetLength * invertedSwapThreshold / 2
						) :
						(
							mouseOnAxis < targetS2 - targetLength * invertedSwapThreshold / 2
						)
					)
				)
				{
					// past first invert threshold, do not restrict inverted threshold to dragEl shadow
					pastFirstInvertThresh = true;
				}

				if (!pastFirstInvertThresh) {
					var dragS1 = axis === 'vertical' ? dragRect.top : dragRect.left,
						dragS2 = axis === 'vertical' ? dragRect.bottom : dragRect.right;
					// dragEl shadow (target move distance shadow)
					if (
						lastDirection === 1 ?
						(
							mouseOnAxis < targetS1 + targetMoveDistance // over dragEl shadow
						) :
						(
							mouseOnAxis > targetS2 - targetMoveDistance
						)
					)
					{
						return lastDirection * -1;
					}
				} else {
					invert = true;
				}
			} else {
				// Regular
				if (
					mouseOnAxis > targetS1 + (targetLength * (1 - swapThreshold) / 2) &&
					mouseOnAxis < targetS2 - (targetLength * (1 - swapThreshold) / 2)
				) {
					return _getInsertDirection(target);
				}
			}
		}

		invert = invert || invertSwap;

		if (invert) {
			// Invert of regular
			if (
				mouseOnAxis < targetS1 + (targetLength * invertedSwapThreshold / 2) ||
				mouseOnAxis > targetS2 - (targetLength * invertedSwapThreshold / 2)
			)
			{
				return ((mouseOnAxis > targetS1 + targetLength / 2) ? 1 : -1);
			}
		}

		return 0;
	}

	/**
	 * Gets the direction dragEl must be swapped relative to target in order to make it
	 * seem that dragEl has been "inserted" into that element's position
	 * @param  {HTMLElement} target       The target whose position dragEl is being inserted at
	 * @return {Number}                   Direction dragEl must be swapped
	 */
	function _getInsertDirection(target) {
		var dragElIndex = _index(dragEl),
			targetIndex = _index(target);

		if (dragElIndex < targetIndex) {
			return 1;
		} else {
			return -1;
		}
	}


	/**
	 * Generate id
	 * @param   {HTMLElement} el
	 * @returns {String}
	 * @private
	 */
	function _generateId(el) {
		var str = el.tagName + el.className + el.src + el.href + el.textContent,
			i = str.length,
			sum = 0;

		while (i--) {
			sum += str.charCodeAt(i);
		}

		return sum.toString(36);
	}

	/**
	 * Returns the index of an element within its parent for a selected set of
	 * elements
	 * @param  {HTMLElement} el
	 * @param  {selector} selector
	 * @return {number}
	 */
	function _index(el, selector) {
		var index = 0;

		if (!el || !el.parentNode) {
			return -1;
		}

		while (el && (el = el.previousElementSibling)) {
			if ((el.nodeName.toUpperCase() !== 'TEMPLATE') && el !== cloneEl && (!selector || _matches(el, selector))) {
				index++;
			}
		}

		return index;
	}

	function _matches(/**HTMLElement*/el, /**String*/selector) {
		if (!selector) return;

		selector[0] === '>' && (selector = selector.substring(1));

		if (el) {
			try {
				if (el.matches) {
					return el.matches(selector);
				} else if (el.msMatchesSelector) {
					return el.msMatchesSelector(selector);
				} else if (el.webkitMatchesSelector) {
					return el.webkitMatchesSelector(selector);
				}
			} catch(_) {
				return false;
			}
		}

		return false;
	}

	var _throttleTimeout;
	function _throttle(callback, ms) {
		return function () {
			if (!_throttleTimeout) {
				var args = arguments,
					_this = this;

				_throttleTimeout = setTimeout(function () {
					if (args.length === 1) {
						callback.call(_this, args[0]);
					} else {
						callback.apply(_this, args);
					}

					_throttleTimeout = void 0;
				}, ms);
			}
		};
	}

	function _cancelThrottle() {
		clearTimeout(_throttleTimeout);
		_throttleTimeout = void 0;
	}

	function _extend(dst, src) {
		if (dst && src) {
			for (var key in src) {
				if (src.hasOwnProperty(key)) {
					dst[key] = src[key];
				}
			}
		}

		return dst;
	}

	function _clone(el) {
		if (Polymer && Polymer.dom) {
			return Polymer.dom(el).cloneNode(true);
		}
		else if ($) {
			return $(el).clone(true)[0];
		}
		else {
			return el.cloneNode(true);
		}
	}

	function _saveInputCheckedState(root) {
		savedInputChecked.length = 0;

		var inputs = root.getElementsByTagName('input');
		var idx = inputs.length;

		while (idx--) {
			var el = inputs[idx];
			el.checked && savedInputChecked.push(el);
		}
	}

	function _nextTick(fn) {
		return setTimeout(fn, 0);
	}

	function _cancelNextTick(id) {
		return clearTimeout(id);
	}


	/**
	 * Returns the "bounding client rect" of given element
	 * @param  {HTMLElement} el                The element whose boundingClientRect is wanted
	 * @param  {[HTMLElement]} container       the parent the element will be placed in
	 * @param  {[Boolean]} adjustForTransform  Whether the rect should compensate for parent's transform
	 * @return {Object}                        The boundingClientRect of el
	 */
	function _getRect(el, adjustForTransform, container, adjustForFixed) {
		if (!el.getBoundingClientRect && el !== win) return;

		var elRect,
			top,
			left,
			bottom,
			right,
			height,
			width;

		if (el !== win && el !== _getWindowScrollingElement()) {
			elRect = el.getBoundingClientRect();
			top = elRect.top;
			left = elRect.left;
			bottom = elRect.bottom;
			right = elRect.right;
			height = elRect.height;
			width = elRect.width;
		} else {
			top = 0;
			left = 0;
			bottom = window.innerHeight;
			right = window.innerWidth;
			height = window.innerHeight;
			width = window.innerWidth;
		}

		if (adjustForFixed && el !== win) {
			// Adjust for translate()
			container = container || el.parentNode;

			// solves #1123 (see: https://stackoverflow.com/a/37953806/6088312)
			// Not needed on <= IE11
			if (!IE11OrLess) {
				do {
					if (container && container.getBoundingClientRect && _css(container, 'transform') !== 'none') {
						var containerRect = container.getBoundingClientRect();

						// Set relative to edges of padding box of container
						top -= containerRect.top + parseInt(_css(container, 'border-top-width'));
						left -= containerRect.left + parseInt(_css(container, 'border-left-width'));
						bottom = top + elRect.height;
						right = left + elRect.width;

						break;
					}
					/* jshint boss:true */
				} while (container = container.parentNode);
			}
		}

		if (adjustForTransform && el !== win) {
			// Adjust for scale()
			var matrix = _matrix(container || el),
				scaleX = matrix && matrix.a,
				scaleY = matrix && matrix.d;

			if (matrix) {
				top /= scaleY;
				left /= scaleX;

				width /= scaleX;
				height /= scaleY;

				bottom = top + height;
				right = left + width;
			}
		}

		return {
			top: top,
			left: left,
			bottom: bottom,
			right: right,
			width: width,
			height: height
		};
	}


	/**
	 * Checks if a side of an element is scrolled past a side of it's parents
	 * @param  {HTMLElement}  el       The element who's side being scrolled out of view is in question
	 * @param  {String}       side     Side of the element in question ('top', 'left', 'right', 'bottom')
	 * @return {HTMLElement}           The parent scroll element that the el's side is scrolled past, or null if there is no such element
	 */
	function _isScrolledPast(el, side) {
		var parent = _getParentAutoScrollElement(el, true),
			elSide = _getRect(el)[side];

		/* jshint boss:true */
		while (parent) {
			var parentSide = _getRect(parent)[side],
				visible;

			if (side === 'top' || side === 'left') {
				visible = elSide >= parentSide;
			} else {
				visible = elSide <= parentSide;
			}

			if (!visible) return parent;

			if (parent === _getWindowScrollingElement()) break;

			parent = _getParentAutoScrollElement(parent, false);
		}

		return false;
	}

	/**
	 * Returns the scroll offset of the given element, added with all the scroll offsets of parent elements.
	 * The value is returned in real pixels.
	 * @param  {HTMLElement} el
	 * @return {Array}             Offsets in the format of [left, top]
	 */
	function _getRelativeScrollOffset(el) {
		var offsetLeft = 0,
			offsetTop = 0,
			winScroller = _getWindowScrollingElement();

		if (el) {
			do {
				var matrix = _matrix(el),
					scaleX = matrix.a,
					scaleY = matrix.d;

				offsetLeft += el.scrollLeft * scaleX;
				offsetTop += el.scrollTop * scaleY;
			} while (el !== winScroller && (el = el.parentNode));
		}

		return [offsetLeft, offsetTop];
	}

	// Fixed #973:
	_on(document, 'touchmove', function(evt) {
		if ((Sortable.active || awaitingDragStarted) && evt.cancelable) {
			evt.preventDefault();
		}
	});


	// Export utils
	Sortable.utils = {
		on: _on,
		off: _off,
		css: _css,
		find: _find,
		is: function (el, selector) {
			return !!_closest(el, selector, el, false);
		},
		extend: _extend,
		throttle: _throttle,
		closest: _closest,
		toggleClass: _toggleClass,
		clone: _clone,
		index: _index,
		nextTick: _nextTick,
		cancelNextTick: _cancelNextTick,
		detectDirection: _detectDirection,
		getChild: _getChild
	};


	/**
	 * Create sortable instance
	 * @param {HTMLElement}  el
	 * @param {Object}      [options]
	 */
	Sortable.create = function (el, options) {
		return new Sortable(el, options);
	};


	// Export
	Sortable.version = '1.9.0';
	return Sortable;
});


/***/ }),

/***/ 525:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var core_js_modules_es_array_index_of__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(27);
/* harmony import */ var core_js_modules_es_array_index_of__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_index_of__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _assets_css_dialog_less__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(526);
/* harmony import */ var _assets_css_dialog_less__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_assets_css_dialog_less__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(72);
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_dom__WEBPACK_IMPORTED_MODULE_3__);


function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }





class Dialog extends react__WEBPACK_IMPORTED_MODULE_2___default.a.Component {
  constructor(props) {
    super(props);

    _defineProperty(this, "handleBodyClick", e => {
      if (!this.dialog.contains(e.target)) {
        this.props.onClose();
      }
    });

    _defineProperty(this, "refDialog", element => {
      this.dialog = element;
    });

    this.dialog = null;
  }

  componentDidMount() {
    document.addEventListener('click', this.handleBodyClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleBodyClick);
  }

  render() {
    const classList = ['dialog__body'];

    if (this.props.className) {
      classList.push(this.props.className);
    }

    const _this$props = this.props,
          onClose = _this$props.onClose,
          props = _objectWithoutProperties(_this$props, ["onClose"]);

    const dialog = react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("div", _extends({}, props, {
      ref: this.refDialog,
      className: classList.join(' ')
    }), this.props.children);
    return react_dom__WEBPACK_IMPORTED_MODULE_3___default.a.createPortal(dialog, document.body);
  }

}

/* harmony default export */ __webpack_exports__["a"] = (Dialog);

/***/ }),

/***/ 526:
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ 659:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: ./node_modules/react/index.js
var react = __webpack_require__(1);
var react_default = /*#__PURE__*/__webpack_require__.n(react);

// EXTERNAL MODULE: ./src/components/Header.jsx
var Header = __webpack_require__(416);

// EXTERNAL MODULE: ./src/components/Profiles.jsx + 2 modules
var Profiles = __webpack_require__(470);

// EXTERNAL MODULE: ./src/components/ScrollTop.jsx
var ScrollTop = __webpack_require__(466);

// EXTERNAL MODULE: ./src/components/Filters.jsx + 88 modules
var Filters = __webpack_require__(469);

// EXTERNAL MODULE: ./node_modules/mobx-react/index.module.js
var index_module = __webpack_require__(38);

// EXTERNAL MODULE: ./node_modules/prop-types/index.js
var prop_types = __webpack_require__(18);
var prop_types_default = /*#__PURE__*/__webpack_require__.n(prop_types);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.iterator.js
var es_array_iterator = __webpack_require__(14);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.map.js
var es_array_map = __webpack_require__(23);

// EXTERNAL MODULE: ./node_modules/core-js/modules/web.dom-collections.iterator.js
var web_dom_collections_iterator = __webpack_require__(15);

// EXTERNAL MODULE: ./node_modules/react-router/esm/react-router.js
var react_router = __webpack_require__(197);

// EXTERNAL MODULE: ./node_modules/react-router-dom/esm/react-router-dom.js
var react_router_dom = __webpack_require__(179);

// EXTERNAL MODULE: ./src/tools/getLogger.js
var getLogger = __webpack_require__(3);

// EXTERNAL MODULE: ./src/tools/getTitle.js
var getTitle = __webpack_require__(465);

// CONCATENATED MODULE: ./src/components/ProfileEditor/ProfileEditorProfiles.jsx




var _class, _class2, _temp, _class3, _class4, _temp2;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }








const uuid = __webpack_require__(477);

const Sortable = __webpack_require__(516);

const logger = Object(getLogger["a" /* default */])('ProfileEditorProfiles');

let ProfileEditorProfiles_ProfileEditorProfiles = Object(react_router["f" /* withRouter */])(_class = Object(index_module["c" /* observer */])(_class = (_temp = _class2 = class ProfileEditorProfiles extends react_default.a.Component {
  constructor(...args) {
    super(...args);

    _defineProperty(this, "sortable", null);

    _defineProperty(this, "refProfiles", node => {
      if (!node) {
        if (this.sortable) {
          this.sortable.destroy();
          this.sortable = null;
        }
      } else if (!this.sortable) {
        this.sortable = new Sortable(node, {
          group: 'profiles',
          handle: '.item__move',
          draggable: '.item',
          animation: 150,
          onStart: () => {
            node.classList.add('sorting');
          },
          onEnd: e => {
            node.classList.remove('sorting');
            const itemNode = e.item;
            const prevNode = itemNode.previousElementSibling;
            const nextNode = itemNode.nextElementSibling;
            const id = itemNode.dataset.id;
            const prevId = prevNode && prevNode.dataset.id;
            const nextId = nextNode && nextNode.dataset.id;
            this.profileEditorStore.moveProfile(id, prevId, nextId);
          }
        });
      }
    });

    _defineProperty(this, "handleSave", e => {
      e.preventDefault();
      this.profileEditorStore.save();
    });

    _defineProperty(this, "handleCreate", e => {
      e.preventDefault();
      const id = uuid();
      this.profileEditorStore.createProfile(id);
      this.props.history.push(`/profileEditor/${id}`);
    });
  }

  componentDidMount() {
    document.title = Object(getTitle["a" /* default */])('Edit profiles');

    if (window.ga) {
      window.ga('send', 'pageview', {
        page: location.href,
        title: document.title
      });
    }
  }
  /**@return ProfileEditorStore*/


  get profileEditorStore() {
    return this.props.profileEditorStore;
  }

  render() {
    const profiles = this.profileEditorStore.profiles.map(profileEditorProfileStore => {
      return react_default.a.createElement(ProfileEditorProfiles_ProfileEditorProfileItem, {
        key: profileEditorProfileStore.id,
        profileEditorStore: this.profileEditorStore,
        profileEditorProfileStore: profileEditorProfileStore
      });
    });
    return react_default.a.createElement("div", {
      className: "manager"
    }, react_default.a.createElement("div", {
      className: "manager__body"
    }, react_default.a.createElement("div", {
      className: "manager__sub_header manager__sub_header-profiles"
    }, react_default.a.createElement("a", {
      className: "manager__new_profile",
      href: "#create",
      onClick: this.handleCreate
    }, chrome.i18n.getMessage('newProfile'))), react_default.a.createElement("div", {
      ref: this.refProfiles,
      className: "manager__profiles"
    }, profiles), react_default.a.createElement("div", {
      className: "manager__footer"
    }, react_default.a.createElement("div", {
      className: "space"
    }), react_default.a.createElement("a", {
      className: "button manager__footer__btn",
      href: "#save",
      onClick: this.handleSave
    }, chrome.i18n.getMessage('save')))));
  }

}, _defineProperty(_class2, "propTypes", {
  profileEditorStore: prop_types_default.a.object.isRequired,
  history: prop_types_default.a.object
}), _temp)) || _class) || _class;

let ProfileEditorProfiles_ProfileEditorProfileItem = Object(react_router["f" /* withRouter */])(_class3 = Object(index_module["c" /* observer */])(_class3 = (_temp2 = _class4 = class ProfileEditorProfileItem extends react_default.a.Component {
  constructor(...args) {
    super(...args);

    _defineProperty(this, "handleRemove", e => {
      e.preventDefault();
      this.profileEditorStore.removeProfileById(this.profileEditorProfileStore.id);
    });

    _defineProperty(this, "handleClick", e => {
      if (e.target === this.item || e.target.classList.contains('item__name')) {
        this.props.history.push(`/profileEditor/${this.profileEditorProfileStore.id}`);
      }
    });

    _defineProperty(this, "item", null);

    _defineProperty(this, "refItem", element => {
      this.item = element;
    });
  }

  /**@return ProfileEditorStore*/
  get profileEditorStore() {
    return this.props.profileEditorStore;
  }
  /**@return ProfileEditorProfileStore*/


  get profileEditorProfileStore() {
    return this.props.profileEditorProfileStore;
  }

  render() {
    const profileEditorProfileStore = this.profileEditorProfileStore;
    return react_default.a.createElement("div", {
      ref: this.refItem,
      onClick: this.handleClick,
      "data-id": profileEditorProfileStore.id,
      className: "item"
    }, react_default.a.createElement("div", {
      className: "item__move"
    }), react_default.a.createElement("div", {
      className: "item__name"
    }, profileEditorProfileStore.name), react_default.a.createElement(react_router_dom["b" /* Link */], {
      to: `/profileEditor/${profileEditorProfileStore.id}`,
      className: "item__cell item__button button-edit",
      title: chrome.i18n.getMessage('edit')
    }), react_default.a.createElement("a", {
      onClick: this.handleRemove,
      className: "item__cell item__button button-remove",
      href: "#remove",
      title: chrome.i18n.getMessage('delete')
    }));
  }

}, _defineProperty(_class4, "propTypes", {
  profileEditorStore: prop_types_default.a.object.isRequired,
  profileEditorProfileStore: prop_types_default.a.object.isRequired,
  history: prop_types_default.a.object
}), _temp2)) || _class3) || _class3;

/* harmony default export */ var ProfileEditor_ProfileEditorProfiles = (ProfileEditorProfiles_ProfileEditorProfiles);
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.concat.js
var es_array_concat = __webpack_require__(182);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.from.js
var es_array_from = __webpack_require__(74);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.index-of.js
var es_array_index_of = __webpack_require__(27);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.slice.js
var es_array_slice = __webpack_require__(75);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.splice.js
var es_array_splice = __webpack_require__(55);

// EXTERNAL MODULE: ./node_modules/core-js/modules/web.dom-collections.for-each.js
var web_dom_collections_for_each = __webpack_require__(33);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.symbol.description.js
var es_symbol_description = __webpack_require__(112);

// EXTERNAL MODULE: ./src/assets/img/blank.svg
var blank = __webpack_require__(468);
var blank_default = /*#__PURE__*/__webpack_require__.n(blank);

// EXTERNAL MODULE: ./src/tools/getIconFromMeta.js
var getIconFromMeta = __webpack_require__(186);

// CONCATENATED MODULE: ./src/components/ProfileEditor/TackerStoreItem.jsx




var TackerStoreItem_class, TackerStoreItem_class2, TackerStoreItem_temp;

function TackerStoreItem_defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }







let TackerStoreItem_TackerStoreItem = Object(index_module["c" /* observer */])(TackerStoreItem_class = (TackerStoreItem_temp = TackerStoreItem_class2 = class TackerStoreItem extends react_default.a.Component {
  constructor(...args) {
    super(...args);

    TackerStoreItem_defineProperty(this, "state", {
      installed: false
    });

    TackerStoreItem_defineProperty(this, "handleInstall", e => {
      e.preventDefault();
      this.module.save();
      this.setState({
        installed: true
      });
    });

    TackerStoreItem_defineProperty(this, "handleUninstall", e => {
      e.preventDefault();
      this.module.deleteTacker();
      this.setState({
        installed: false
      });
    });

    TackerStoreItem_defineProperty(this, "handleFetch", e => {
      e.preventDefault();
      this.module.fetch();
    });

    TackerStoreItem_defineProperty(this, "handleItemClick", e => {
      this.handleFetch(e);
    });
  }

  /**@return {TrackerStoreResultStore}*/
  get module() {
    return this.props.module;
  }

  render() {
    const tracker = this.module;
    let fetchBtn = null;
    let installBtn = null;
    let supportBtn = null;
    let homepageBtn = react_default.a.createElement("a", {
      href: tracker.html_url,
      className: "item__button button-home",
      target: "_blank"
    });
    let name = tracker.name;
    let icon = blank_default.a;
    let version = null;
    let description = null;
    let author = null;
    let handleClick = null;

    if (tracker.meta) {
      name = tracker.meta.name || name;
      icon = Object(getIconFromMeta["a" /* default */])(tracker.meta) || icon;
      version = tracker.meta.version;

      if (tracker.meta.description) {
        description = tracker.meta.description;
      }

      if (tracker.meta.supportURL) {
        supportBtn = react_default.a.createElement("a", {
          href: tracker.meta.supportURL,
          className: "item__button button-support",
          target: "_blank"
        });
      }

      if (tracker.meta.author) {
        author = react_default.a.createElement("div", {
          className: "item__cell item__author"
        }, tracker.meta.author);
      }

      if (tracker.hasTracker || this.state.installed) {
        installBtn = react_default.a.createElement("a", {
          onClick: this.handleUninstall,
          className: "item__button button-remove",
          href: "#uninstall",
          title: chrome.i18n.getMessage('delete')
        });
      } else {
        installBtn = react_default.a.createElement("a", {
          onClick: this.handleInstall,
          className: "item__button button-plus",
          href: "#install",
          title: chrome.i18n.getMessage('add')
        });
      }
    } else {
      fetchBtn = react_default.a.createElement("a", {
        onClick: this.handleFetch,
        className: "item__button button-info",
        href: "#fetch",
        title: chrome.i18n.getMessage('fetchMeta')
      });
      handleClick = this.handleItemClick;
    }

    return react_default.a.createElement("div", {
      className: "item"
    }, react_default.a.createElement("div", {
      className: "item__cell item__icon"
    }, react_default.a.createElement("img", {
      src: icon,
      alt: ""
    })), react_default.a.createElement("div", {
      onClick: handleClick,
      className: "item__cell item__name"
    }, name), react_default.a.createElement("div", {
      onClick: handleClick,
      className: "item__cell item__desc"
    }, react_default.a.createElement("div", {
      className: "desc"
    }, description)), react_default.a.createElement("div", {
      className: "item__cell item__version"
    }, version), author, react_default.a.createElement("div", {
      className: "item__cell item__actions"
    }, fetchBtn, installBtn, supportBtn, homepageBtn));
  }

}, TackerStoreItem_defineProperty(TackerStoreItem_class2, "propTypes", {
  module: prop_types_default.a.object.isRequired
}), TackerStoreItem_temp)) || TackerStoreItem_class;

/* harmony default export */ var ProfileEditor_TackerStoreItem = (TackerStoreItem_TackerStoreItem);
// CONCATENATED MODULE: ./src/components/ProfileEditor/TackerStore.jsx


var TackerStore_class, TackerStore_class2, TackerStore_temp;

function TackerStore_defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }






let TackerStore_TackerStore = Object(index_module["c" /* observer */])(TackerStore_class = (TackerStore_temp = TackerStore_class2 = class TackerStore extends react_default.a.Component {
  /**@return ProfileEditorStore*/
  get profileEditorStore() {
    return this.props.profileEditorStore;
  }

  componentDidMount() {
    if (!this.profileEditorStore.trackerStore) {
      this.profileEditorStore.createTrackerStore();
      this.profileEditorStore.trackerStore.fetch();
    }
  }

  render() {
    let items = null;

    if (this.profileEditorStore.trackerStore) {
      if (this.profileEditorStore.trackerStore.state !== 'done') {
        return `Loading: ${this.profileEditorStore.trackerStore.state}`;
      }

      items = this.profileEditorStore.trackerStore.results.map(module => {
        return react_default.a.createElement(ProfileEditor_TackerStoreItem, {
          key: module.download_url,
          module: module
        });
      });
    }

    return react_default.a.createElement("div", {
      className: "manager__trackers"
    }, items);
  }

}, TackerStore_defineProperty(TackerStore_class2, "propTypes", {
  profileEditorStore: prop_types_default.a.object.isRequired,
  showOptions: prop_types_default.a.bool.isRequired
}), TackerStore_temp)) || TackerStore_class;

/* harmony default export */ var ProfileEditor_TackerStore = (TackerStore_TackerStore);
// CONCATENATED MODULE: ./src/components/ProfileEditor/ProfileEditorTrackerItem.jsx




var _dec, ProfileEditorTrackerItem_class, ProfileEditorTrackerItem_class2, ProfileEditorTrackerItem_temp;

function ProfileEditorTrackerItem_defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }







const ProfileEditorTrackerItem_logger = Object(getLogger["a" /* default */])('ProfileEditorTrackerItem');
let ProfileEditorTrackerItem_ProfileEditorTrackerItem = (_dec = Object(index_module["b" /* inject */])('rootStore'), _dec(ProfileEditorTrackerItem_class = Object(index_module["c" /* observer */])(ProfileEditorTrackerItem_class = (ProfileEditorTrackerItem_temp = ProfileEditorTrackerItem_class2 = class ProfileEditorTrackerItem extends react_default.a.Component {
  constructor(...args) {
    super(...args);

    ProfileEditorTrackerItem_defineProperty(this, "handleChecked", () => {
      if (this.checkbox.checked) {
        this.profileEditorProfileStore.addTracker(this.trackerStore.id);
      } else {
        this.profileEditorProfileStore.removeTracker(this.trackerStore.id);
      }
    });

    ProfileEditorTrackerItem_defineProperty(this, "handleClick", e => {
      e.preventDefault();
      this.checkbox.checked = !this.checkbox.checked;
      this.handleChecked();
    });

    ProfileEditorTrackerItem_defineProperty(this, "handleRemove", e => {
      e.preventDefault();
      this.trackersStore.deleteTracker(this.trackerStore.id);
      this.trackersStore.saveTrackers();
    });

    ProfileEditorTrackerItem_defineProperty(this, "checkbox", null);

    ProfileEditorTrackerItem_defineProperty(this, "refCheckbox", element => {
      this.checkbox = element;
    });

    ProfileEditorTrackerItem_defineProperty(this, "handleUpdate", e => {
      e.preventDefault();
      this.trackerStore.update();
    });

    ProfileEditorTrackerItem_defineProperty(this, "stopPropagation", e => {
      e.stopPropagation();
    });

    ProfileEditorTrackerItem_defineProperty(this, "handleProxyChange", e => {
      this.profileTrackerStore.options.setEnableProxy(this.enableProxy.checked);
    });

    ProfileEditorTrackerItem_defineProperty(this, "enableProxy", null);

    ProfileEditorTrackerItem_defineProperty(this, "refEnableProxy", element => {
      this.enableProxy = element;
    });
  }

  /**@return RootStore*/
  get rootStore() {
    return this.props.rootStore;
  }
  /**@return TrackersStore*/


  get trackersStore() {
    return this.rootStore.trackers;
  }
  /**@return ProfileEditorProfileStore*/


  get profileEditorProfileStore() {
    return this.props.profileEditorProfileStore;
  }
  /**@return {ProfileEditorProfileTrackerStore|TrackerStore}*/


  get trackerStore() {
    return this.props.trackerStore;
  }
  /**@return ProfileEditorProfileTrackerStore*/


  get profileTrackerStore() {
    return this.props.profileEditorProfileStore.getProfileTracker(this.trackerStore.id);
  }

  render() {
    const tracker = this.trackerStore;
    const checked = this.props.checked;
    const classList = ['item'];

    if (checked) {
      classList.push('item__selected');
    }

    let updateBtn = null;
    let supportBtn = null;
    let homepageBtn = null;
    let deleteBtn = null;
    let author = null;
    let icon = tracker.getIconUrl() || blank_default.a;
    const name = tracker.meta.name || tracker.id;
    let version = tracker.meta.version;

    if (tracker.updateState === 'pending') {
      version = '...';
    }

    if (tracker.meta.supportURL) {
      supportBtn = react_default.a.createElement("a", {
        href: tracker.meta.supportURL,
        className: "item__button button-support",
        target: "_blank"
      });
    }

    if (tracker.meta.updateURL || tracker.meta.downloadURL) {
      updateBtn = react_default.a.createElement("a", {
        onClick: this.handleUpdate,
        className: "item__button button-update",
        href: "#update",
        title: chrome.i18n.getMessage('update')
      });
    }

    if (tracker.meta.homepageURL) {
      homepageBtn = react_default.a.createElement("a", {
        href: tracker.meta.homepageURL,
        className: "item__button button-home",
        target: "_blank"
      });
    }

    if (tracker.meta.author) {
      author = react_default.a.createElement("div", {
        className: "item__cell item__author"
      }, tracker.meta.author);
    }

    if (!tracker.isEditorProfileTrackerStore) {
      deleteBtn = react_default.a.createElement("a", {
        onClick: this.handleRemove,
        className: "item__button button-remove",
        href: "#remove",
        title: chrome.i18n.getMessage('delete')
      });
    }

    const optionList = [];

    if (this.props.showOptions) {
      if (checked && this.profileTrackerStore) {
        optionList.push(react_default.a.createElement("div", {
          key: 'enableProxy',
          className: "option__item"
        }, react_default.a.createElement("label", null, react_default.a.createElement("input", {
          ref: this.refEnableProxy,
          defaultChecked: this.profileTrackerStore.options.enableProxy,
          onChange: this.handleProxyChange,
          type: "checkbox"
        }), react_default.a.createElement("span", null, chrome.i18n.getMessage('enableProxy')))));
      }
    }

    let options = null;

    if (optionList.length) {
      options = react_default.a.createElement("div", {
        onClick: this.stopPropagation,
        className: "options"
      }, optionList);
    }

    return react_default.a.createElement("div", {
      className: classList.join(' '),
      "data-id": tracker.id
    }, react_default.a.createElement("div", {
      className: "item__cell item__move"
    }), react_default.a.createElement("div", {
      className: "item__cell item__checkbox"
    }, react_default.a.createElement("input", {
      ref: this.refCheckbox,
      onChange: this.handleChecked,
      type: "checkbox",
      defaultChecked: checked
    })), react_default.a.createElement("div", {
      className: "item__cell item__icon"
    }, react_default.a.createElement("img", {
      src: icon,
      alt: ""
    })), react_default.a.createElement("div", {
      onClick: this.handleClick,
      className: "item__cell item__name"
    }, name), react_default.a.createElement("div", {
      onClick: this.handleClick,
      className: "item__cell item__desc"
    }, react_default.a.createElement("div", {
      className: "desc"
    }, tracker.meta.description || null), options), react_default.a.createElement("div", {
      className: "item__cell item__version"
    }, version), author, react_default.a.createElement("div", {
      className: "item__cell item__actions"
    }, updateBtn, supportBtn, homepageBtn, react_default.a.createElement(react_router_dom["b" /* Link */], {
      to: `/editor/tracker/${tracker.id}`,
      className: "item__cell item__button button-edit",
      target: "_blank",
      title: chrome.i18n.getMessage('edit')
    }), deleteBtn));
  }

}, ProfileEditorTrackerItem_defineProperty(ProfileEditorTrackerItem_class2, "propTypes", {
  rootStore: prop_types_default.a.object,
  profileEditorProfileStore: prop_types_default.a.object.isRequired,
  trackerStore: prop_types_default.a.object.isRequired,
  showOptions: prop_types_default.a.bool.isRequired,
  checked: prop_types_default.a.bool.isRequired
}), ProfileEditorTrackerItem_temp)) || ProfileEditorTrackerItem_class) || ProfileEditorTrackerItem_class);
/* harmony default export */ var ProfileEditor_ProfileEditorTrackerItem = (ProfileEditorTrackerItem_ProfileEditorTrackerItem);
// EXTERNAL MODULE: ./src/components/Dialog.jsx
var Dialog = __webpack_require__(525);

// CONCATENATED MODULE: ./src/components/ProfileEditor/ProfileEditorProfile.jsx










var ProfileEditorProfile_dec, ProfileEditorProfile_class, ProfileEditorProfile_class2, ProfileEditorProfile_temp, ProfileEditorProfile_class3, ProfileEditorProfile_class4, ProfileEditorProfile_temp2, _class5, _class6, _temp3;

function ProfileEditorProfile_defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }











const ProfileEditorProfile_Sortable = __webpack_require__(516);

const ProfileEditorProfile_logger = Object(getLogger["a" /* default */])('ProfileEditorProfile');
let ProfileEditorProfile_ProfileEditorProfile = (ProfileEditorProfile_dec = Object(index_module["b" /* inject */])('rootStore'), ProfileEditorProfile_dec(ProfileEditorProfile_class = Object(index_module["c" /* observer */])(ProfileEditorProfile_class = (ProfileEditorProfile_temp = ProfileEditorProfile_class2 = class ProfileEditorProfile extends react_default.a.Component {
  constructor(...args) {
    super(...args);

    ProfileEditorProfile_defineProperty(this, "state", {
      showOptions: false,
      showStore: false,
      sourcesDialog: false,
      repos: []
    });

    ProfileEditorProfile_defineProperty(this, "handleChangeName", () => {
      this.profileEditorProfileStore.setName(this.name.value);
    });

    ProfileEditorProfile_defineProperty(this, "name", null);

    ProfileEditorProfile_defineProperty(this, "refName", element => {
      this.name = element;
    });

    ProfileEditorProfile_defineProperty(this, "handleSearchChange", e => {
      const input = e.currentTarget;
      this.profileEditorProfileStore.setFilterText(input.value);
      this.profileEditorProfileStore.setCategory('all');
    });

    ProfileEditorProfile_defineProperty(this, "handleSave", e => {
      e.preventDefault();
      this.profileEditorStore.save();
    });

    ProfileEditorProfile_defineProperty(this, "handleShowOptions", e => {
      e.preventDefault();
      this.setState({
        showOptions: !this.state.showOptions
      });
    });

    ProfileEditorProfile_defineProperty(this, "handleCategoryClick", type => {
      if (this.state.showStore) {
        this.setState({
          showStore: false
        });
      }

      this.profileEditorProfileStore.setCategory(type);
    });

    ProfileEditorProfile_defineProperty(this, "handleStoreClick", () => {
      this.setState({
        showStore: true
      });
    });

    ProfileEditorProfile_defineProperty(this, "handleOpenSourcesDialog", e => {
      e.preventDefault();
      this.setState({
        sourcesDialog: true,
        repos: this.optionsStore.options.repositories.slice(0)
      });
    });

    ProfileEditorProfile_defineProperty(this, "onCloseSourcesDialog", () => {
      this.setState({
        sourcesDialog: false,
        repos: null
      });
    });

    ProfileEditorProfile_defineProperty(this, "handleSourcesSubmit", e => {
      e.preventDefault();
      this.optionsStore.options.setValue('repositories', this.state.repos);
      this.optionsStore.save();
      this.onCloseSourcesDialog();
    });

    ProfileEditorProfile_defineProperty(this, "handleSourcesCancel", e => {
      e.preventDefault();
      this.onCloseSourcesDialog();
    });

    ProfileEditorProfile_defineProperty(this, "repositoryInput", null);

    ProfileEditorProfile_defineProperty(this, "refRepositoryInput", element => {
      this.repositoryInput = element;
    });

    ProfileEditorProfile_defineProperty(this, "repositorySelect", null);

    ProfileEditorProfile_defineProperty(this, "refRepositorySelect", element => {
      this.repositorySelect = element;
    });

    ProfileEditorProfile_defineProperty(this, "handleSourceSelectChange", e => {
      this.repositoryInput.value = this.repositorySelect.value;
    });

    ProfileEditorProfile_defineProperty(this, "handlePutRepository", e => {
      e.preventDefault();
      const repos = this.state.repos.slice(0);
      const url = this.repositoryInput.value;

      if (repos.indexOf(url) === -1) {
        repos.push(url);
        this.setState({
          repos
        });
      }
    });

    ProfileEditorProfile_defineProperty(this, "handleDeleteRepository", e => {
      e.preventDefault();
      const repos = this.state.repos.slice(0);
      Array.from(this.repositorySelect.selectedOptions).forEach(option => {
        const url = option.value;
        const pos = repos.indexOf(url);

        if (pos !== -1) {
          repos.splice(pos, 1);
        }
      });
      this.setState({
        repos
      });
    });

    ProfileEditorProfile_defineProperty(this, "handleSourcesRefresh", e => {
      e.preventDefault();
      this.profileEditorStore.trackerStore.fetch();
    });
  }

  componentDidMount() {
    document.title = Object(getTitle["a" /* default */])(`Edit profile "${this.profileEditorProfileStore.name}"`);

    if (window.ga) {
      window.ga('send', 'pageview', {
        page: location.href,
        title: document.title
      });
    }
  }

  /**@return ProfileEditorStore*/
  get profileEditorStore() {
    return this.props.profileEditorStore;
  }
  /**@return ProfileEditorProfileStore*/


  get profileEditorProfileStore() {
    return this.props.profileEditorProfileStore;
  }
  /**@return OptionsStore*/


  get optionsStore() {
    return this.props.rootStore.options;
  }

  render() {
    const categories = ['all', 'withoutList', 'selected'].map(type => {
      const isActive = !this.state.showStore && type === this.profileEditorProfileStore.category;
      const count = this.profileEditorProfileStore.getTrackerCountByCategory(type);
      const title = chrome.i18n.getMessage('filter_' + type);
      return react_default.a.createElement(ProfileEditorProfile_ProfileEditorFilterButton, {
        key: `category-${type}`,
        title: title,
        onClick: this.handleCategoryClick,
        count: count,
        isActive: isActive,
        type: type
      });
    });
    categories.unshift(react_default.a.createElement(ProfileEditorProfile_ProfileEditorFilterButton, {
      key: `category-${'store'}`,
      title: chrome.i18n.getMessage('external_trackers'),
      onClick: this.handleStoreClick,
      isActive: this.state.showStore,
      type: 'store'
    }));
    let sourcesDialog = null;
    let listControls = [];
    let trackerList = null;

    if (this.state.showStore) {
      trackerList = react_default.a.createElement(ProfileEditor_TackerStore, {
        profileEditorStore: this.props.profileEditorStore,
        showOptions: this.state.showOptions
      });
      listControls.push(react_default.a.createElement("button", {
        key: 'sources',
        onClick: this.handleOpenSourcesDialog,
        className: "styled-button"
      }, chrome.i18n.getMessage('sources')));
      listControls.push(react_default.a.createElement("button", {
        key: 'refresh',
        onClick: this.handleSourcesRefresh,
        className: "styled-button refresh-icon left-offset",
        title: chrome.i18n.getMessage('refresh')
      }));

      if (this.state.sourcesDialog) {
        const options = this.state.repos.map(url => {
          return react_default.a.createElement("option", {
            key: url,
            value: url
          }, url);
        });
        sourcesDialog = react_default.a.createElement(Dialog["a" /* default */], {
          className: "dialog-repositories",
          onClose: this.onCloseSourcesDialog
        }, react_default.a.createElement("form", {
          onSubmit: this.handleSourcesSubmit
        }, react_default.a.createElement("label", {
          className: "dialog__label",
          htmlFor: "selectRepoUrls"
        }, chrome.i18n.getMessage('repositories')), react_default.a.createElement("div", null, react_default.a.createElement("select", {
          ref: this.refRepositorySelect,
          onChange: this.handleSourceSelectChange,
          id: "selectRepoUrls",
          multiple: true
        }, options)), react_default.a.createElement("div", null, react_default.a.createElement("button", {
          onClick: this.handleDeleteRepository,
          className: "styled-button",
          type: "button"
        }, chrome.i18n.getMessage('delete'))), react_default.a.createElement("label", {
          className: "dialog__label",
          htmlFor: "repoUrl"
        }, chrome.i18n.getMessage('add_repository')), react_default.a.createElement("div", null, react_default.a.createElement("input", {
          ref: this.refRepositoryInput,
          className: "input__input",
          id: "repoUrl",
          type: "text",
          placeholder: "https://..."
        })), react_default.a.createElement("div", null, react_default.a.createElement("button", {
          onClick: this.handlePutRepository,
          className: "styled-button",
          type: "button"
        }, chrome.i18n.getMessage('add'))), react_default.a.createElement("div", {
          className: "dialog__button_box"
        }, react_default.a.createElement("input", {
          value: chrome.i18n.getMessage('save'),
          className: "styled-button",
          type: "submit"
        }), react_default.a.createElement("input", {
          onClick: this.handleSourcesCancel,
          value: chrome.i18n.getMessage('cancel'),
          className: "styled-button",
          type: "button"
        }))));
      }
    } else {
      trackerList = react_default.a.createElement(ProfileEditorProfile_ProfileEditorTackerList, {
        key: this.profileEditorProfileStore.category,
        profileEditorProfileStore: this.profileEditorProfileStore,
        showOptions: this.state.showOptions
      });
      const showOptionsClassList = ['styled-button view-icon'];

      if (this.state.showOptions) {
        showOptionsClassList.push('pressed');
      }

      listControls.push(react_default.a.createElement("button", {
        key: 'view',
        onClick: this.handleShowOptions,
        className: showOptionsClassList.join(' '),
        title: chrome.i18n.getMessage('advanced_options')
      }));
    }

    return react_default.a.createElement("div", {
      className: "manager"
    }, react_default.a.createElement("div", {
      className: "manager__body"
    }, react_default.a.createElement("div", {
      className: "manager__sub_header sub_header__profile"
    }, react_default.a.createElement("div", {
      className: "profile__input"
    }, react_default.a.createElement("input", {
      ref: this.refName,
      className: "input__input",
      type: "text",
      defaultValue: this.profileEditorProfileStore.name,
      onChange: this.handleChangeName
    }))), react_default.a.createElement("div", {
      className: "manager__sub_header sub_header__filter"
    }, react_default.a.createElement("div", {
      className: "filter__box"
    }, categories), react_default.a.createElement("div", {
      className: "filter__search"
    }, react_default.a.createElement("input", {
      className: "input__input filter__input",
      type: "text",
      placeholder: chrome.i18n.getMessage('quickSearch'),
      onChange: this.handleSearchChange
    }))), trackerList, react_default.a.createElement("div", {
      className: "manager__footer"
    }, listControls, react_default.a.createElement("div", {
      className: "space"
    }), react_default.a.createElement(react_router_dom["b" /* Link */], {
      to: '/codeMaker',
      target: "_blank",
      className: "button manager__footer__btn"
    }, chrome.i18n.getMessage('createCode')), react_default.a.createElement(react_router_dom["b" /* Link */], {
      to: '/editor/tracker',
      target: "_blank",
      className: "button manager__footer__btn"
    }, chrome.i18n.getMessage('add')), react_default.a.createElement("button", {
      className: "styled-button",
      onClick: this.handleSave
    }, chrome.i18n.getMessage('save')))), sourcesDialog);
  }

}, ProfileEditorProfile_defineProperty(ProfileEditorProfile_class2, "propTypes", {
  profileEditorStore: prop_types_default.a.object.isRequired,
  profileEditorProfileStore: prop_types_default.a.object.isRequired
}), ProfileEditorProfile_temp)) || ProfileEditorProfile_class) || ProfileEditorProfile_class);

let ProfileEditorProfile_ProfileEditorTackerList = Object(index_module["c" /* observer */])(ProfileEditorProfile_class3 = (ProfileEditorProfile_temp2 = ProfileEditorProfile_class4 = class ProfileEditorTackerList extends react_default.a.Component {
  constructor(...args) {
    super(...args);

    ProfileEditorProfile_defineProperty(this, "state", {
      trackerIds: []
    });

    ProfileEditorProfile_defineProperty(this, "sortable", null);

    ProfileEditorProfile_defineProperty(this, "refTrackers", node => {
      if (!node) {
        if (this.sortable) {
          this.sortable.destroy();
          this.sortable = null;
        }
      } else if (!this.sortable) {
        // fix sortable bug with checkbox
        node.getElementsByTagName = ((node, getElementsByTagName) => {
          return tagName => {
            if (tagName === 'input') {
              tagName = 'null-input';
            }

            return getElementsByTagName.call(node, tagName);
          };
        })(node, node.getElementsByTagName);

        const getPrevSelectedTracker = node => {
          node = node.previousElementSibling;

          while (node && !node.classList.contains('item__selected')) {
            node = node.previousElementSibling;
          }

          return node;
        };

        const getNextSelectedTracker = node => {
          node = node.nextElementSibling;

          while (node && !node.classList.contains('item__selected')) {
            node = node.nextElementSibling;
          }

          return node;
        };

        this.sortable = new ProfileEditorProfile_Sortable(node, {
          group: 'trackers',
          handle: '.item__move',
          draggable: '.item',
          animation: 150,
          onStart: () => {
            node.classList.add('sorting');
          },
          onEnd: e => {
            node.classList.remove('sorting');
            const itemNode = e.item;
            const prevNode = getPrevSelectedTracker(itemNode);
            const nextNode = getNextSelectedTracker(itemNode);
            const id = itemNode.dataset.id;
            const prevId = prevNode && prevNode.dataset.id;
            const nextId = nextNode && nextNode.dataset.id;
            this.profileEditorProfileStore.moveTracker(id, prevId, nextId);
          }
        });
      }
    });
  }

  /**@return ProfileEditorProfileStore*/
  get profileEditorProfileStore() {
    return this.props.profileEditorProfileStore;
  }

  render() {
    const trackerIds = this.state.trackerIds;
    const removedIds = trackerIds.slice(0);
    const checkedTrackerIds = this.profileEditorProfileStore.selectedTrackerIds;
    const checkedTrackers = [];
    const uncheckedTrackers = [];

    const appendTracker = trackerStore => {
      const checked = checkedTrackerIds.indexOf(trackerStore.id) !== -1;
      const item = react_default.a.createElement(ProfileEditor_ProfileEditorTrackerItem, {
        key: `tracker-${trackerStore.id}`,
        profileEditorProfileStore: this.profileEditorProfileStore,
        trackerStore: trackerStore,
        showOptions: this.props.showOptions,
        checked: checked
      });

      if (checked) {
        checkedTrackers.push(item);
      } else {
        uncheckedTrackers.push(item);
      }
    };

    this.profileEditorProfileStore.categoryTrackers.forEach(trackerStore => {
      const id = trackerStore.id;
      const pos = removedIds.indexOf(id);

      if (pos !== -1) {
        removedIds.splice(pos, 1);
      }

      if (trackerIds.indexOf(id) === -1) {
        trackerIds.push(id);
      }

      appendTracker(trackerStore);
    });

    if (!this.profileEditorProfileStore.filterText) {
      removedIds.forEach(id => {
        const trackerStore = this.profileEditorProfileStore.getTrackerById(id);

        if (trackerStore) {
          appendTracker(trackerStore);
        }
      });
    }

    return react_default.a.createElement("div", {
      ref: this.refTrackers,
      className: "manager__trackers"
    }, checkedTrackers.concat(uncheckedTrackers));
  }

}, ProfileEditorProfile_defineProperty(ProfileEditorProfile_class4, "propTypes", {
  profileEditorProfileStore: prop_types_default.a.object.isRequired,
  showOptions: prop_types_default.a.bool.isRequired
}), ProfileEditorProfile_temp2)) || ProfileEditorProfile_class3;

let ProfileEditorProfile_ProfileEditorFilterButton = Object(index_module["c" /* observer */])(_class5 = (_temp3 = _class6 = class ProfileEditorFilterButton extends react_default.a.Component {
  constructor(...args) {
    super(...args);

    ProfileEditorProfile_defineProperty(this, "handleClick", e => {
      e.preventDefault();
      this.props.onClick(this.props.type);
    });
  }

  render() {
    const type = this.props.type;
    const classList = ['filter__item'];

    if (this.props.isActive) {
      classList.push('item__selected');
    }

    let count = null;

    if (typeof this.props.count === 'number') {
      count = react_default.a.createElement("span", {
        className: "item__count"
      }, this.props.count);
    }

    return react_default.a.createElement("a", {
      className: classList.join(' '),
      onClick: this.handleClick,
      href: '#'
    }, this.props.title, ' ', count);
  }

}, ProfileEditorProfile_defineProperty(_class6, "propTypes", {
  title: prop_types_default.a.string.isRequired,
  type: prop_types_default.a.string.isRequired,
  isActive: prop_types_default.a.bool.isRequired,
  count: prop_types_default.a.number,
  onClick: prop_types_default.a.func.isRequired
}), _temp3)) || _class5;

/* harmony default export */ var ProfileEditor_ProfileEditorProfile = (ProfileEditorProfile_ProfileEditorProfile);
// CONCATENATED MODULE: ./src/pages/ProfileEditor.jsx
var ProfileEditor_dec, ProfileEditor_class, ProfileEditor_class2, ProfileEditor_temp, _dec2, ProfileEditor_class3, ProfileEditor_class4, ProfileEditor_temp2;

function ProfileEditor_defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }












const ProfileEditor_logger = Object(getLogger["a" /* default */])('ProfileEditor');
let ProfileEditor_ProfileEditor = (ProfileEditor_dec = Object(index_module["b" /* inject */])('rootStore'), ProfileEditor_dec(ProfileEditor_class = Object(index_module["c" /* observer */])(ProfileEditor_class = (ProfileEditor_temp = ProfileEditor_class2 = class ProfileEditor extends react_default.a.Component {
  constructor(props) {
    super(props);

    if (this.props.rootStore.profiles.state === 'idle') {
      this.props.rootStore.profiles.fetchProfiles();
    }

    if (this.props.rootStore.trackers.state === 'idle') {
      this.props.rootStore.trackers.fetchTrackers();
    }
  }
  /**@return RootStore*/


  get rootStore() {
    return this.props.rootStore;
  }
  /**@return ProfilesStore*/


  get profilesStore() {
    return this.rootStore.profiles;
  }
  /**@return TrackersStore*/


  get trackersStore() {
    return this.rootStore.trackers;
  }

  render() {
    const profilesStore = this.profilesStore;
    const trackersStore = this.trackersStore;

    if (profilesStore.state !== 'done') {
      return `Loading profiles: ${profilesStore.state}`;
    }

    if (trackersStore.state !== 'done') {
      return `Loading trackers: ${trackersStore.state}`;
    }

    return react_default.a.createElement("div", {
      className: "page-ctr profile-editor"
    }, react_default.a.createElement(Header["a" /* default */], null), react_default.a.createElement("div", {
      className: "content content-row"
    }, react_default.a.createElement("div", {
      className: "parameter_box"
    }, react_default.a.createElement(Profiles["a" /* default */], null), react_default.a.createElement(Filters["a" /* default */], null)), react_default.a.createElement("div", {
      className: "main"
    }, react_default.a.createElement(ProfileEditor_ProfileEditorPage, {
      id: this.props.id
    }))), react_default.a.createElement(ScrollTop["a" /* default */], null));
  }

}, ProfileEditor_defineProperty(ProfileEditor_class2, "propTypes", {
  rootStore: prop_types_default.a.object,
  id: prop_types_default.a.string
}), ProfileEditor_temp)) || ProfileEditor_class) || ProfileEditor_class);
let ProfileEditor_ProfileEditorPage = (_dec2 = Object(index_module["b" /* inject */])('rootStore'), _dec2(ProfileEditor_class3 = Object(index_module["c" /* observer */])(ProfileEditor_class3 = (ProfileEditor_temp2 = ProfileEditor_class4 = class ProfileEditorPage extends react_default.a.Component {
  constructor(props) {
    super(props);

    if (!this.profileEditorStore) {
      this.rootStore.createProfileEditor();
    }
  }
  /**@return RootStore*/


  get rootStore() {
    return this.props.rootStore;
  }
  /**@return ProfileEditorStore*/


  get profileEditorStore() {
    return this.rootStore.profileEditor;
  }

  componentWillUnmount() {
    this.rootStore.destroyProfileEditor();
  }

  render() {
    const profile = this.profileEditorStore.getProfileById(this.props.id);

    if (profile) {
      return react_default.a.createElement(ProfileEditor_ProfileEditorProfile, {
        profileEditorStore: this.profileEditorStore,
        profileEditorProfileStore: profile
      });
    } else if (this.props.id) {
      return react_default.a.createElement(react_router["a" /* Redirect */], {
        to: `/profileEditor`
      });
    } else {
      return react_default.a.createElement(ProfileEditor_ProfileEditorProfiles, {
        profileEditorStore: this.profileEditorStore
      });
    }
  }

}, ProfileEditor_defineProperty(ProfileEditor_class4, "propTypes", {
  rootStore: prop_types_default.a.object,
  id: prop_types_default.a.string
}), ProfileEditor_temp2)) || ProfileEditor_class3) || ProfileEditor_class3);
/* harmony default export */ var pages_ProfileEditor = __webpack_exports__["default"] = (ProfileEditor_ProfileEditor);

/***/ })

}]);
//# sourceMappingURL=chunk-15.js.map