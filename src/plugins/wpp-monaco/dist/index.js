//用于直接通过自定义插件加载
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
		keywords: ['if'],
		tokenizer: {
			root: [
				[/\/\/.*$/, { token: "comment.line.wpp" }],//WPP语法1:不支持多行注释，注释应以//开头
				[/((if|elif|for|while|return|task|on|rmtask)(?=\()|else(?={))/, { token: "keyword.wpp" }],//WPP语法:if,elif,for,while后加()为内置函数,else直接加{
				[/(break|continue)/, { token: "keyword.wpp" }],
				[/[a-zA-z\u4e00-\u9fa5][\w\u4e00-\u9fa5]*\w*(?=\s*\(.*\))/, { token: "entity.name.function.wpp" }],
				// [/(?<=.)[a-zA-z\u4e00-\u9fa5][\w\u4e00-\u9fa5]*/, {token: 'string.wpp'}], //monaco不支持正向后行断言
				[/let(?=\s+[a-zA-z\u4e00-\u9fa5][\w\u4e00-\u9fa5]*\s*=)/, { token: "keyword.wpp" }],
				[/this*/, { token: "keyword.wpp" }],
				[/\$[a-zA-z\u4e00-\u9fa5][\w\u4e00-\u9fa5]*\$/, { token: "identifier.wpp" }],
				[/[a-zA-z\u4e00-\u9fa5][\w\u4e00-\u9fa5]*(?=\s*=)/, { token: "identifier.wpp" }],
				[/(=|==|>=|<=|>|<|\+|\-|\*|\/)/, { token: '' }],
				// [/(?<![a-zA-z\u4e00-\u9fa5])\d+\.?\d*(?![a-zA-z\u4e00-\u9fa5])/, {token: 'number.wpp'}], //负向也没有
				[/\d+\.?\d*(?![a-zA-z\u4e00-\u9fa5])/, { token: 'number.wpp' }],
				[/(\'|\").*?\1/, { token: 'string.wpp' }],
				[/[{}]+/, { token: 'delimiter.curly' }],
				[/[\(\)]+/, { token: 'delimiter.parenthesis' }],
				[/[\[\]]+/, { token: 'delimiter.square' }],
			]
		}
	})
	monaco.languages.setLanguageConfiguration('wpp', {
		autoClosingPairs: [
			{ open: '{', close: '}' },
			{ open: '[', close: ']' },
			{ open: '(', close: ')' },
			{ open: '\'', close: '\'' },
			{ open: '\"', close: '\"' },
		],
		surroundingPairs: [
			{ open: '{', close: '}' },
			{ open: '[', close: ']' },
			{ open: '(', close: ')' }
		]
	})
	const keyword_suggestions = [
		{
			label: 'let VAR = DATA',
			insertText: 'let  = ',
			detail: '赋值或修改一个变量,VAR为变量名,DATA为数据'
		},
		{
			label: 'if(COND){}',
			insertText: 'if(){}',
			detail: '当条件成立时，执行此分支'
		},
		{
			label: 'elif(COND){}',
			insertText: 'elif(){}',
			detail: '当if分支不成立时，检查条件是否成立，成立则进行此分支'
		},
		{
			label: 'else{}',
			insertText: 'else{}',
			detail: '当if分支和elif分支都不成立时，进行此分支'
		}
	]
	keyword_suggestions.map(m=>{
		m.kind = monaco.languages.CompletionItemKind.Keyword;
		m.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
	})
	monaco.languages.registerCompletionItemProvider('wpp', {
		provideCompletionItems: (model, position) => {
			/**
			 * @type{string}
			 */
			const lineText = model.getValueInRange({
				startLineNumber:position.lineNumber,
				startColumn:1,
				endLineNumber:position.lineNumber,
				endColumn:position.column
			})
			const charPos = lineText.search(/\S/)
			console.log(lineText)
			console.log(charPos)
			const suggestions = [];
			keyword_suggestions.map(m=>{
				m.range = new monaco.Range(
					position.lineNumber,charPos+1,
					position.lineNumber,position.column
				)
				suggestions.push(m);
			})
			console.log(suggestions)
			return { suggestions:suggestions};
		}
	});
	return {
		dispose: () => {
			/** Remove some side effects */
			register.dispose()
		},
	};
};

window.Scratch.plugins.register(WppMonaco,"Monaco for wpp")
