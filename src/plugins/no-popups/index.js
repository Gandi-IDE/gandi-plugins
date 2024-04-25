// @author: 多bug的啸天犬 @ CCW
// @date: 2021-04-25
// @version: 1.0.0
// @description: 禁止弹窗-插件
// @homepage: https://github.com/MoreBugOfDog/gandi-plugins/tree/main/src/plugins/no-popups
// @bugs: https://github.com/MoreBugOfDog/gandi-plugins/issues
// @license: MPL-2.0
// 这个插件的思路是，由于很多工程都使用了YUEN的系统信息拓展制作alert弹窗，但是测试时一般
// 不会想被打断，这样在编辑器内禁止alert弹窗，会增强编辑体验。
// 关闭插件，会恢复alert弹窗。
// 这个更改无法使用控制台测试，请使用YUEN的系统信息拓展。

const NoPopups = (context) => {
  
  // 恢复被覆写的alert的函数
  function getAlert(){
    　　var f = document.createElement("iframe");
    　　f.style.cssText = "border:0;width:0;height:0;display:none";
    　　document.body.appendChild(f);
    　　var d = f.contentWindow.document;
    　　d.write("<script type=\"text/javascript\">window.parent.alert = alert;<\/script>");
    　　d.close();
    }
  function noAlert(){
    // 覆写alert，使其弹窗功能失效 
    window.alert = () => {
        return false;
    }
  } 
  noAlert();
  
  
  return {
    dispose: () => {
      /** Remove some side effects */
      // 恢复Alert
      getAlert();
    },
  };
};


export default NoPopups;

