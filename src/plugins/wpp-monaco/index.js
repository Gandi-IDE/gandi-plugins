import { after } from "node:test";

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
		],
		onEnterRules: [
			{
				beforeText: /{$/,
				action: { indentAction: monaco.languages.IndentAction.Indent }
			},
			{
				beforeText: /}/,
				action: { indentAction: monaco.languages.IndentAction.Outdent }
			}
		]
	})
	const keyword_suggestions = [
		{
			label: 'let VAR = DATA',
			insertText: 'let $1 = ',
			detail: '赋值或修改一个变量,VAR为变量名,DATA为数据'
		},
		{
			label: 'if(COND) {}',
			insertText: 'if($1) {}',
			detail: '当条件成立时，执行此分支'
		},
		{
			label: 'elif(COND) {}',
			insertText: 'elif($1) {}',
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
			keyword_suggestions.map(suggestion=>{
				const m = JSON.parse(JSON.stringify(suggestion));
				m.range = new monaco.Range(
					position.lineNumber,charPos+1,
					position.lineNumber,position.column
				)
				suggestions.push(m);
			})
			if(lineText.trim().startsWith('}')){
				let indentLevel = 0;
				for(let lineCount = position.lineNumber - 1; lineCount >= 1; lineCount--){
					/**
					 * @type{string}
					 */
					const firstLineText = model.getLineContent(lineCount);
					if(firstLineText.trim().endsWith('{')){
						if(indentLevel > 0){
							indentLevel--;
						}else{
							console.log(firstLineText)
							if(firstLineText.trim().startsWith('if')|| firstLineText.trim().search('elif') !== -1){
								suggestions.map(m=>{
									if(m.label.startsWith('else') || m.label.startsWith('elif')){
										m.insertText = ' '+m.insertText
										m.range = new monaco.Range(
											position.lineNumber,lineText.lastIndexOf('}')+2,
											position.lineNumber,position.column
										)
									}
								})
							}
							break
						}
					}else if(firstLineText.trim().startsWith('}')){
						indentLevel++;
					}

				}
			}
			console.log(suggestions)
			return { suggestions:suggestions};
		}
	});
	// monaco.languages.registerDocumentFormattingEditProvider('wpp', {
    //   provideDocumentFormattingEdits(
	return {
		dispose: () => {
			/** Remove some side effects */
			register.dispose()
		},
	};
};

export default WppMonaco;
