;(function (Sync,prototype) {
	for (var i in prototype) {
		Sync.prototype[i] = prototype[i];
	}
	window.Sync = Sync;
})(
	function Sync() {
		
	},
	{
		build: function sync_build(formElement,outputElement) {
			this.formElement = formElement;
			this.outputElement = outputElement;
			this.bindEvents()
		},
		bindEvents: function () {
			this.boundFormSubmitHandler = this.formSubmitHandler.bind(this)
			this.formElement.addEventListener("submit", this.boundFormSubmitHandler);
			this.boundCheckboxChangeHandler = this.checkboxChangeHandler.bind(this);
			this.formElement.addEventListener("change",this.checkboxChangeHandler,true);
		},
		formSubmitHandler: function (event) {
			console.log(this,event.target)
			event.preventDefault()
		},
		checkboxChangeHandler: function (event) {
			console.log(event.target)
		}
	}
);