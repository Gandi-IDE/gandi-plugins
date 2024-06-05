# 插件实现方法说明
这个插件，调用了Gandi-IDE的一个功能。使用 OpenTeacherMode 
这是Gandi的附带功能，但在编辑器中没有对应UI。
# 如何测试
由于实现方法特殊，所以请使用 ./Packaged-diles/HideCode.js 使用custom-plugin插件加载文件测试。
# 安全性
使用Gandi原生方法，实现方法无安全隐患
eval方法没有使用用户输入，绝对安全。