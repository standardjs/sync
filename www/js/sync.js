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
		activatedFrames: null,
		historyId: "url",
		build: function sync_build(formElement,outputElement) {
			this.formElement = formElement;
			this.outputElement = outputElement;
			this.bindEvents();
			this.buildFrameCells();
			this.historyManager = new this.HistoryManager(this.historyId)
			this.historyManager.build()
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
			if (this.historyManager.validateUrl(url)) {
				for (var i in this.activatedFrames) {
					this.activatedFrames[i].src = url;
				}
			} else {
				alert("Please enter a valid url. \nNB: the url's must be on the same domain as this page")
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
			event.target.contentWindow.XMLHttpRequest = this.MockXMLHttpRequest
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
				var selector = this.selectorBuilder.getSelector(event.target)
				for (var i in this.activatedFrames) {
					if (this.activatedFrames[i] != iframe) {
						this.eventDuplicator.duplicateEvent(event,this.activatedFrames[i],selector);
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
		frameEvents: ["click","input","change","keydown","keyup","keypress"],
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
			var target = this.getTarget(event,targetFrame,selector);	
			this.createLocalEvent(event,target);
			this.syncElementStates(event.target,target)
		},
		getTarget: function (event,targetFrame,selector) {
			var possibleTargets,
				target,
				localEvent;
			if (selector) {
				possibleTargets = targetFrame.contentDocument.querySelectorAll(selector)
			} else {
				possibleTargets = [targetFrame.contentDocument]
			}
			if (possibleTargets.length == 1) {
				target = possibleTargets[0];
				
			} else {
				var targets = [].filter.apply(possibleTargets,[function (element) {
					return this.compareElement(event.target,element)
				},this]);
				if (targets.length == 1) {
					target = targets[0];
				} else {
					SafeError("unable to decide which element to target")
				}
			}
			return target;
		},
		syncElementStates: function (sourceElement, targetElement) {
			if ("value" in sourceElement) {
				targetElement.value = sourceElement.value
			}

		},
		compareElement: function (element1,element2) {
			if (element1.textContent == element2.textContent) {
				return true;
			}
			return false;
		},
		createLocalEvent: function (event,newTarget) {
			if (newTarget) {
			var localWindow = newTarget.ownerDocument? newTarget.ownerDocument.defaultView : newTarget.defaultView,
				newEvent = this.eventFactories[this.getEventConstructor(event)](event,newTarget);
			newTarget.dispatchEvent(newEvent);
			}
		},
		getEventConstructor: function (event) {
			return event.constructor.toString().match(/^function\s*([^(]*)\s*\(/)[1];
		},
		eventFactories: {
			MouseEvent: function (srcEvent,target) {
				var event = new MouseEvent(
					srcEvent.type, 
                    srcEvent.canBubble, 
                    srcEvent.cancelable, 
                    target.ownerDocument? target.ownerDocument.defaultView : target.defaultView, 
                    srcEvent.detail, 
                    srcEvent.screenX, 
                    srcEvent.screenY, 
                    srcEvent.clientX, 
                    srcEvent.clientY, 
                    srcEvent.ctrlKey, 
                    srcEvent.altKey, 
                    srcEvent.shiftKey, 
                    srcEvent.metaKey, 
                    srcEvent.button, 
                    null//srcEvent.relatedTargetArg
                );
                event.mocked = true;
                return event;
			},
			Event: function (srcEvent,target) {
				var event = new Event(
					srcEvent.type,
					srcEvent.bubbles,
					srcEvent.cancelable
				);
				event.mocked = true;
				return event
			},
			KeyboardEvent: function (srcEvent,target) {
				var event = new KeyboardEvent(
					srcEvent.type,
					srcEvent.bubbles,
					srcEvent.cancelable,
					target.ownerDocument? target.ownerDocument.defaultView : target.defaultView,
					srcEvent.char,
					srcEvent.key,
					srcEvent.location,
					srcEvent.modifiers,
					srcEvent.repeat,
					srcEvent.locale
				)

				event.mocked = true
				return event
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

);


(function (){


	function MockXMLHttpRequest() {
		this.request = new XMLHttpRequest();
		this.request.onload = this.onloadHandler.bind(this)
		this.id = MockXMLHttpRequest.count++
	}
	window.Sync.prototype.MockXMLHttpRequest = MockXMLHttpRequest;

	MockXMLHttpRequest.count = 0;
	MockXMLHttpRequest.all = {};
	MockXMLHttpRequest.prototype = {
		constructor: XMLHttpRequest,
		open: function (url,async,user,password) {
			var all = MockXMLHttpRequest.all
			var identifier = [].join.apply(arguments,['|']);
			this.request.lastOpenRequest = identifier;
			if (!all[identifier]) {
				all[identifier] = {request:this.request,mockRequests:[this],sent:false};
				this.request.open.apply(this.request,arguments);
			} else {
				all[identifier].mockRequests.push(this);
				if (all[identifier].loaded) {
					this.onloadHandler()
				}
			}
			
		},
		send: function () {
			var requests = MockXMLHttpRequest.all[this.request.lastOpenRequest];
			if (!requests.sent) {
				requests.request.send();
				requests.sent = true;
			}
		},
		onloadHandler: function () {
			var requests = MockXMLHttpRequest.all[this.request.lastOpenRequest],
				finishedRequest = requests.request;
			while (requests.mockRequests.length) {
				var request = requests.mockRequests.shift()
				request.mapRequestProperties(finishedRequest);
				request.onload();
			}
			requests.loaded = true;
		},
		mapRequestProperties: function (request) {
			Object.keys(request).forEach(
				function(key) {
					var type = typeof request[key]
					if (type!="function") {
						this[key] = request[key]
					}
				}, this
			)
		}
	}
	
})();

(function (Constructor,prototype) {
	for (var i in prototype) {
		Constructor.prototype[i] = prototype[i]
	}
	window.Sync.prototype.HistoryManager = Constructor;

})(
	function HistoryManager(inputId) {
		this.inputId = inputId;
		this.sessionHistory = [];
	},
	{
		inputId: "",
		datalist: null,
	build: function () {
		this.storageData = JSON.parse(localStorage.getItem(this.inputId));
		if (!this.storageData) {
			this.storageData = [];
		}
		this.datalist = this.createDataList();
	},
	createDataList: function () {
		var datalist = document.createElement("datalist"),
			input = document.getElementById(this.inputId);
		datalist.id = this.inputId + "DataList";
		this.storageData.forEach(
			function (item) {
				datalist.appendChild(this.createOption(item))
			},
			this
		);
		input.parentElement.appendChild(datalist)
		input.setAttribute("list",datalist.id);
		return datalist
	},
	createOption: function (value) {
		var option = document.createElement("option")
		option.value = value;
		return option
	},
	validateUrl: function (url) {
		var request = new XMLHttpRequest();
		request.open("HEAD",url,false);
		try {
		request.send()
		}
		catch (e) {
			SafeError(e)
			return false;
		}
		if (request.status!=404) {
			this.storeUrl(url);
			return true;
		} else {
			return false;
		}
	},
	storeUrl: function (url) {
		if (this.storageData.indexOf(url) == -1) {
			this.storageData.push(url);
			localStorage.setItem(this.inputId,JSON.stringify(this.storageData))
			this.datalist.appendChild(this.createOption(url));
		}
	}
});

function SafeError(error) {
	setTimeout(function () {
		throw error
	})
}