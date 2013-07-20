;(function (Sync,prototype) {
	for (var i in prototype) {
		Sync.prototype[i] = prototype[i];
	}
	window.Sync = Sync;
})(
	function Sync() {
		this.frameCells = [];
		this.activatedFrames = {}
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
			this.formSubmitHandlerBinding = this.formSubmitHandler.bind(this)
			this.formElement.addEventListener("submit", this.formSubmitHandlerBinding);
			this.checkboxChangeHandlerBinding = this.checkboxChangeHandler.bind(this);
			this.formElement.addEventListener("change",this.checkboxChangeHandlerBinding,true);
		},
		formSubmitHandlerBinding: null,
		formSubmitHandler: function (event) {
			event.preventDefault()
		},
		checkboxChangeHandlerBinding: null,
		checkboxChangeHandler: function (event) {
			if (event.target.checked) {
				this.activateFrame(event.target.value);
			} else {
				this.deactivateFrame(event.target.value)
			}
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
			this.frameCells[frameWidth] = frameCell;
		},
		appendCell: function (cellElement) {
			this.outputElement.appendChild(cellElement)
		},
		activateFrame: function (width) {
			this.frameCells[width].classList.add("activated");
			delete this.activatedFrames[width];
		},
		deactivateFrame: function (width) {
			this.frameCells[width].classList.remove("activated");
			this.activatedFrames[width] = this.frameCells[width].querySelector("iframe");
		}
	}
);