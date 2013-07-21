;(function (Sync,prototype) {
	for (var i in prototype) {
		Sync.prototype[i] = prototype[i];
	}
	window.Sync = Sync;
})(
	function Sync() {
		this.frameCells = [];
		this.activatedFrames = {};
	},
	{
		iframes: null,
		build: function sync_build(formElement,outputElement) {
			this.formElement = formElement;
			this.outputElement = outputElement;
			this.bindEvents();
			this.buildFrameCells();
		},
		bindEvents: function () {
			this.formSubmitListenerBinding = this.formSubmitListener.bind(this)
			this.formElement.addEventListener("submit", this.formSubmitListenerBinding);
			this.checkboxChangeListenerBinding = this.checkboxChangeListener.bind(this);
			this.formElement.addEventListener("change",this.checkboxChangeListenerBinding,true);
			this.loadListenerBinding = this.loadListener.bind(this);
			document.addEventListener("load",this.loadListenerBinding,true)
		},
		formSubmitListenerBinding: null,
		formSubmitListener: function (event) {
			var url = event.target.querySelector("#url").value;
			for (var i in this.activatedFrames) {
				this.activatedFrames[i].src = url;
			}
			event.preventDefault();
		},
		checkboxChangeListenerBinding: null,
		checkboxChangeListener: function (event) {
			if (event.target.type!="checkbox") {
				return;
			}
			if (event.target.checked) {
				this.activateFrame(event.target.value);
			} else {
				this.deactivateFrame(event.target.value)
			}
		},
		loadListener: function (event) {
			new this.IFrameEventListener(event.target,this)
		},
		buildFrameCells: function () {
			[].forEach.apply(
				this.formElement.querySelectorAll("input[type=checkbox]"),
				[this.buildFrameCellFromCheckbox,this]
			);
			this.frameCells.forEach(this.appendCell,this)
		},
		buildFrame: function (width,index) {
			var cell = document.createElement("div"),
				header =document.createElement("div"),
				iframe = document.createElement("iframe");
			header.innerHTML = width;
			cell.className = "cell"
			cell.id ="syncCell"+index;
			cell.style.minWidth = width+"px";
			cell.appendChild(header)
			cell.appendChild(iframe)
			return cell;
		},
		buildFrameCellFromCheckbox: function (checkbox,index) {
			var frameWidth = checkbox.value,
				frameCell = this.buildFrame(frameWidth,index)
			this.frameCells.push(frameCell)
			this.frameCells["cell"+frameWidth] = frameCell;
		},
		appendCell: function (cellElement) {
			this.outputElement.appendChild(cellElement)
		},
		activateFrame: function (width) {
			this.frameCells["cell"+width].classList.add("activated");
			this.activatedFrames["cell"+width] = this.frameCells["cell"+width].querySelector("iframe");	
		},
		deactivateFrame: function (width) {
			this.frameCells["cell"+width].classList.remove("activated");
			delete this.activatedFrames[width];
		},
		handleFrameEvent: function (iframe,event) {
			if (!event.mocked) {
				for (var i in this.activatedFrames) {
					if (this.activatedFrames[i] != iframe) {
						this.eventDuplicator.duplicateEvent(event,this.activatedFrames[i],this.selectorBuilder.getSelector(event.target));
					}  
				}
			}
		}
	}
);

(function (IFrameEventListener,prototype) {
	window.Sync.prototype.IFrameEventListener = IFrameEventListener;
	for (var i in prototype) {
		IFrameEventListener.prototype[i] = prototype[i];
	}
})(
	function IFrameEventListener(iframe,sync) {
		this.iframe = iframe;
		this.document = iframe.contentDocument;
		this.sync = sync;
		this.bindEvents();
	},
	{
		frameEvents: ["click"],
		bindEvents: function () {
			this.frameEvents.forEach(
				function (eventName) {
					this.document.addEventListener(eventName,this,true)
				},
				this
			);
		},
		handleEvent: function (event) {
			this.sync.handleFrameEvent(this.iframe,event)
		}
	}
);

(function (EventDuplicator,prototype) {
	for (var i in prototype) {
		EventDuplicator.prototype[i] = prototype[i];
	}
	window.Sync.prototype.eventDuplicator = new EventDuplicator()
})(
	function EventDuplicator() {

	},
	{
		duplicateEvent:function (event,targetFrame,selector) {
			var possibleTargets = targetFrame.contentDocument.querySelectorAll(selector),
				target,
				localEvent;
			if (possibleTargets.length == 1) {
				target = possibleTargets[0];
				
			} else {
				var targets = [].filter.apply(possibleTargets,[function (element) {
					return this.compareElement(event.target,element)
				},this]);
				if (targets.length == 1) {
					target = targets[0];
				} else {
					throw new Error("unable to decide which element to target")
				}
			}
			localEvent = this.createLocalEvent(event,target);
		},
		compareElement: function (element1,element2) {
			if (element1.textContent == element2.textContent) {
				return true
			}
			return false
		},
		createLocalEvent: function (event,newTarget) {
			var localWindow = newTarget.ownerDocument.defaultView,
				newEvent = this.eventFactories[this.getEventConstructor(event)](event,newTarget);
			newTarget.dispatchEvent(newEvent);
		},
		getEventConstructor: function (event) {
			return event.constructor.toString().match(/^function\s*([^(]*)\s*\(/)[1];
		},
		eventFactories: {
			MouseEvent: function (srcEvent,target) {
				var event = new MouseEvent(srcEvent.type);
				event.initMouseEvent(
					srcEvent.type, 
                    srcEvent.canBubbleArg, 
                    srcEvent.cancelableArg, 
                    target.ownerDocument.defaultView, 
                    srcEvent.detail, 
                    srcEvent.screenX, 
                    srcEvent.screenY, 
                    srcEvent.clientX, 
                    srcEvent.clientY, 
                    srcEvent.ctrlKey, 
                    srcEvent.altKey, 
                    srcEvent.shiftKey, 
                    srcEvent.metaKey, 
                    srcEvent.buttonArg, 
                    null//srcEvent.relatedTargetArg
                );
                event.mocked = true;
                return event;
			}

		}

	}
);
(function (SelectorBuilder,prototype){
	for (var i in prototype) {
		SelectorBuilder.prototype[i] = prototype[i];
	}
	window.Sync.prototype.selectorBuilder = new SelectorBuilder()
})(
	function SelectorBuilder() {


	},
	{
		getSelector: function(element) {
			var selectorArray = [],
				currentElement = element,
				body = element.ownerDocument.body;
			while (currentElement && currentElement!=body.parentElement) {
				selectorArray.push(this.getElementSelector(currentElement));
				currentElement = currentElement.parentElement;
			}
			return selectorArray.reverse().join('>')
		},
		getElementSelector: function (element) {
			var selector = [element.tagName.toLowerCase()];
			if (element.id) {
				selector.push('#'+element.id);
			} else {//it's a bit of a hard one because javascript can change the dom/element completely!!!


			}
			return selector.join('')
		}

	}

)