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
	console.log(vm.runtime)
	let warnLimit = 3
	vm.runtime.on('TARGET_BLOCKS_CHANGED',()=>{
		if(!vm.runtime?.['ext_WitCatInterpreter']){
			if(warnLimit>0){
				console.warn('未加载白猫的wpp,方法解释补全不可用')
				warnLimit--
			}
			return
		}
		const wpp = vm.runtime['ext_WitCatInterpreter']
		console.log(wpp)
	})

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
		},
		{
			label: 'task()',
			insertText: 'task($1)',
			detail: '传入一个参数，线程名。此代码将会调用一个线程，若不存在指定线程将不会执行，此代码返回调用的线程的返回值，若没有返回值，返回 null'
		},
		{
			label:'on(){}',
			insertText: 'on($1){}',
			detail: '传入一个参数，线程名。此代码将会创建一个线程，线程可以被调用执行。'
		},
		{
			label:'break',
			insertText: 'break',
			detail: '在循环里面调用，退出循环，在线程中调用，退出线程'
		},
		{
			label:'continue',
			insertText: 'continue',
			detail: ' 在循环里面调用，下一次循环，在线程中调用，退出线程'
		},
		{
			label:'rmtask()',
			insertText: 'rmtask($1)',
			detail: '传入一个参数，线程名。 移除某个使用task指定的线程缓存'
		},
		{
			label:'while() {}',
			insertText: 'while() {}',
			detail: '如果第一个参数的返回值为true，则继续重复执行，否则，停止循环继续执行下面的'
		},
		{
			label:'for() {}',
			insertText: 'for($1) {}',
			detail: '传入三个参数，初始值，终值，步长。在循环开始时执行初始值，每次循环结束后执行步长，每次循环开始时，通过终值等于true来判断是否继续循环还是退出循环执行下面的'
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
