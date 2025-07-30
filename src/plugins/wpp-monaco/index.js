
const WppMonaco = ({ vm, registerSettings, msg }) => {
	const supportedAssetTypes = vm.runtime.gandi.supportedAssetTypes
	const wpp_asset = { contentType: 'text/plain', name: 'Wpp', runtimeFormat: 'wpp', immutable: true }

	if (!supportedAssetTypes.includes(wpp_asset)) {
		supportedAssetTypes.push(wpp_asset)
	}
	const register = registerSettings(
		msg("plugins.wppMonaco.title"),
		"plugin-wpp-monaco",
		[
			{
				key: "plugin-wpp-monaco",
				label: msg("plugins.wppMonaco.title"),
				description: msg("plugins.wppMonaco.description"),
				items: [],
			},
		],
		"",
	);
	const monaco = window.monaco
	console.log(monaco)
	monaco.languages.register({ id: 'wpp', extensions: ['.wpp'], mimetypes: ['text/plain'] })
	monaco.languages.setMonarchTokensProvider('wpp', {
		keywords:['if'],
		tokenizer: {
			root: [
				[/\/\/.*$/, { token: "comment.line.wpp" }],//WPP语法1:不支持多行注释，注释应以//开头
				[/((if|elif|for|while|return|task|on)(?=\()|else(?={))/, { token: "keyword.wpp" }],//WPP语法:if,elif,for,while后加()为内置函数,else直接加{
				[/[a-zA-z\u4e00-\u9fa5][\w\u4e00-\u9fa5]*\w*(?=\s*\(.*\)\s*{)/,{ token: "entity.name.function.wpp" }],
				[/[{}]+/,{token:'delimiter.curly'}],
				[/[\(\)]+/,{token:'delimiter.parenthesis'}],
				[/[\[\]]+/,{token:'delimiter.square'}],
				[/let(?=\s+[a-zA-z\u4e00-\u9fa5][\w\u4e00-\u9fa5]*\s*=)/, { token: "keyword.wpp" }],
				[/this*/, { token: "keyword.wpp"}],
				[/[a-zA-z\u4e00-\u9fa5][\w\u4e00-\u9fa5]*/, { token: "identifier.wpp"}],
				[/(=|==|>=|<=|>|<|\+|\-|\*|\/)/, { token: ''}],
				[/(?<![a-zA-z\u4e00-\u9fa5])\d+\.?\d*(?![a-zA-z\u4e00-\u9fa5])/, {token: 'number.wpp'}]
			]
		}
	})
	monaco.languages.setLanguageConfiguration('wpp', {
		autoClosingPairs: [
			{ open: '{', close: '}' },
			{ open: '[', close: ']' },
			{ open: '(', close: ')' }
		],
		surroundingPairs: [
			{ open: '{', close: '}' },
			{ open: '[', close: ']' },
			{ open: '(', close: ')' }
		]
	})
	return {
		dispose: () => {
			/** Remove some side effects */
			register.dispose()
		},
	};
};

export default WppMonaco;
