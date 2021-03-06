/** @jsx React.DOM */

function initApp() {

	function decode(str) {
		return decodeURIComponent(str);
	}

	function encode(str) {
		return encodeURIComponent(str);
	}

	function justGetSearch(str) {
		var search = str;
		if (search.indexOf('/') > -1) {
			search = search.substring(search.lastIndexOf('/') + 1);
		}
		if (search.indexOf('?') === 0) {
			search = search.substring(search.lastIndexOf('?') + 1);
		}
		return search;
	}

	function decodeAndSplit(str) {
		return decode(justGetSearch(str)).split('&').join('\n');
	}

	function decodeAndStringifyJSON(str) {

		var search = justGetSearch(str);
		var decoded = decode(search);

		var parts = decoded.split('&');
		var obj = {};

		parts.forEach(function(part) {
			var bits = part.split('=');
			var key = bits[0];
			var value = bits[1] && bits[1].length > 0 ? bits[1].trim() : '';

			if (value.indexOf('{') === 0 || value.indexOf('[') === 0) {
				try {
					value = JSON.parse(value);
				} catch(e){}
			}
			obj[key] = value;
		});

		return JSON.stringify(obj, null, '\t');
	}

	var EXAMPLE_URL = 'param%3DsomeValue%26emptyParam%3D%26ajsonobect%3D%7B%22foo%22%3A%22bar%22%2C%22arr%22%3A%5B1%2C2%2C3%5D%7D%26ajsonarray%3D%5B1%2C2%2C3%2C%7B%22a%22%3A%22b%22%7D%5D';

	var URLDecoderApp = React.createClass({displayName: 'URLDecoderApp',

		getInitialState: function() {
			var defaultInput = window.location.search || '';
			if (defaultInput.indexOf('?') === 0) {
				defaultInput = defaultInput.slice(1);
			}

			return {
				selectedTab: 'entry',
				input: defaultInput,
				html: '',
				focused: false
			};
		},
	
		render: function() {
			var body;

			switch (this.state.selectedTab) {
				case 'entry':
					var warning;
					if (!this.state.input && !this.state.focused) {
						warning = 
							React.DOM.div( {className:"warning"}, 
								React.DOM.a( {href:"#", onClick:this._handleHideWarning}, 
									"Click to enter a URL"
								)
							);
					}

					body = 
						React.DOM.div(null, 
							warning,
							React.DOM.textarea( 
								{ref:"textarea",
								rows:20, 
								style:{textAlign: 'left', width: '100%'},
								onChange:this._handleTextChange,
								onFocus:this._handleFocus,
								onBlur:this._handleBlur,
								value:this.state.input} 
							)
						);
					break;
				case 'decode':
				case 'encode':
				case 'json':
				case 'split':
					if (this.state.html) {
						body = React.DOM.pre( {className:"decoded"}, this.state.html);
					} else {
						body = 
							React.DOM.div( {className:"warning"}, 
								React.DOM.a( {href:"#", onClick:this._handleHideWarning}, 
									"You must enter a url first"
								)
							);
					}
					break;
			}



			return (
				React.DOM.div( {className:"container"}, 
					React.DOM.div( {className:"nav-main"}, 
						React.DOM.div( {className:"wrap"}, 
							React.DOM.div( {className:"nav-home"}, 
								"URL Decoder"
							)
						)
					),
					React.DOM.div( {className:"hero"}, 
						React.DOM.div( {className:"minitext"}, 
							"A simple ", React.DOM.a( {href:"http://en.wikipedia.org/wiki/Url_encoding", target:"_blank", title:"What is URL encoding?"}, "URL decoder"),"."+' '+  
							"Enter a URL to decode or", 
							React.DOM.a( {href:"#", onClick:this._handleExample},  " Click Here " ), " for an example"
						),
						TabMenu( 
							{onSelect:this._handleTabSelect, 
							areActionsEnabled:this.state.input.length > 0,
							selectedTab:this.state.selectedTab}
						),
						React.DOM.div( {className:"info"}, 
							this._createInfo()
						)
					),
					React.DOM.section( {className:"content wrap"}, 
						body
					)
				)
			);
		},

		_createInfo: function() {
			var str = this.state.input.trim();

			if (!str) {
				return '';
			}

			var paramCount = -1;
			try {
				var decoded = decode(str);
				var parts = decoded.split('&').filter(function(part) {
					return part.trim().length > 0;
				});
				paramCount = parts.length;
			} catch(e) {
				// Invalid URL
			}

			return [
				['Url length:', this.state.input.length],
				paramCount > -1 ? ['Param Count:', parts.length] : ['Invalid URL', '']
			].map(function(info) {
				return (
					React.DOM.span( {className:"infopart"}, 
						React.DOM.b(null, info[0]),info[1]
					)
				);
			});
		},

		_handleExample: function() {
			this.setState({
				input: EXAMPLE_URL,
				selectedTab: 'entry'
			});
		},

		_handleTabSelect: function(type) {

			var html = this.state.html;
			var input = this.state.input;

			if (input) {
				try {
					switch (type) {
						case 'decode':
							html = decode(this.state.input);
							break;
						case 'encode':
							html = encode(this.state.input);
							break;
						case 'split':
							html = decodeAndSplit(this.state.input);
							break;
						case 'json':
							html = decodeAndStringifyJSON(this.state.input);
							break;
					}
				} catch(e) {
					html = 'Invalid URL';
				}
			} else {
				html = '';
			}

			this.setState({
				html: html,
				selectedTab: type
			})
		},

		_handleTextChange: function(evt) {
			this.setState({
				input: evt.target.value.trim()
			})
		},

		_handleFocus: function() {
			this.setState({focused: true});
		},

		_handleBlur: function() {
			setTimeout(function() {
				this.setState({focused: false});
			}.bind(this), 500);
		},

		_handleHideWarning: function() {
			this.setState({
				selectedTab: 'entry'
			}, function() {
				// Wait for the async state to be applied, then focus the node
				this.refs.textarea.getDOMNode().focus();
			}.bind(this));
		}
	
	});

	var TabMenu = React.createClass({displayName: 'TabMenu',
		propTypes: {
			onSelect: React.PropTypes.func.isRequired,
			selectedTab: React.PropTypes.string.isRequired,
			areActionsEnabled: React.PropTypes.bool.isRequired
		},

      	render: function() {
	      	return (
	      		React.DOM.div( {className:"buttons-unit"}, 
	      			this._createTab('entry', 'URL'),
	      			this._createTab('decode', 'Decode'),
	      			this._createTab('split', 'Split'),
	      			this._createTab('json', 'JSON'),
	      			this._createTab('encode', 'Encode')
	      		)
	      	);
	    },

	    _createTab: function(type, label) {
	    	return Tab( {onSelect:this.props.onSelect, type:type, isSelected:type === this.props.selectedTab}, label);
	    }
	});

	var Tab = React.createClass({displayName: 'Tab',
		propTypes: {
			type: React.PropTypes.string.isRequired,
			isSelected: React.PropTypes.bool
		},

		render: function() {
			var className = 'button' + (this.props.isSelected ? ' selected-button' : '');

			return (
				React.DOM.a( 
					{className:className,
					href:"#", 
					onClick:this._handleClick}, 
					this.props.children
				)
			);
		},

		_handleClick: function(evt) {
			evt.preventDefault();
			this.props.onSelect(this.props.type);
		}
	});

	var TabSeparator = React.createClass({displayName: 'TabSeparator',
		render: function() {
			return React.DOM.span( {style:{padding: '10px'}}, '-');
		}
	})

	function renderApp() {

		React.renderComponent(
		  URLDecoderApp(null ),
		  document.getElementById('root')
		);
	}

	renderApp();
}


