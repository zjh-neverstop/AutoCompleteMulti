/**
 * 实现自动完成功能的js类
 * 1、数据获取方式：设置静态数据集、ajax方式、自定义数据获取函数
 * 2、可以控制是否启用匹配项的循环选择
 * 3、可以控制是否使用默认静态数据集，在获取动态数据失败的情况下会显示
 * 4、支持多关键词自动完成
 * Created by 赵晶浩 on 2014-7-7.
 * Updated by 赵晶浩 on 2014-7-31
 * Update content:添加了在输入框中输入多个关键词的自动完成功能，自动识别当前正在输入的关键词，需要设置关键词分隔符，默认为空格
 *                通过将commonObj提升为特权变量，修正了同一个页面中多个控件自动完成的冲突问题
 *                为了尽量保持原有类的封闭性，将新增内容封装在KeywordRange类中，这样原有类只需修改少量代码
 * Updated by 赵晶浩 on 2014-8-04
 * Update content:多关键词匹配时，当用户选中某个匹配项后，自动将光标定位在该关键词后面
 */

(function() {

    var is_IE = (navigator.appName == "Microsoft Internet Explorer");

    /**
     * 多关键词输入的情况下，用来处理keyword的内部类
     * @inputString 输入字符串
     * @separator 关键词分隔符
     * @constructor
     */
    function KeywordRange(inputString, separator) {

        //输入字符串
        this.input = inputString || "";

        //关键词分隔符，默认为空格
        this.separator = separator || " ";

        //光标位置
        this.cursorPosition = -1;

        /**
         * 计算光标位置
         */
        this.getCursorPosition = function(domObj) {


            var position = 0;

            if (document.selection) {	//for IE
                domObj.focus();
                var sel = document.selection.createRange();
                sel.moveStart('character', -domObj.value.length);

                position = sel.text.length;
            } else if (domObj.selectionStart || domObj.selectionStart == '0') {
                position = domObj.selectionStart;
            }

            return position;
        };

        /**
         * 通过光标位置，计算当前正在输入的关键词及其起始位置与长度
         * @param str
         * @param cursorPosition
         * @returns {{start: number, length: (*|Number|number|length)}}
         */
        this.calcKeywordInfo = function(str, cursorPosition, separator) {
            var strs = str.split(separator);
            var length = strs.length;
            var currPosition = 0;
            for (var index = 0; index < length; index++) {
                currPosition += strs[index].length + separator.length;
                if (currPosition >= cursorPosition + 1) {
                    return {
                        currKeyword: strs[index],
                        start: currPosition - strs[index].length - separator.length,
                        length: strs[index].length
                    };
                } //end if
            } //end for
        } //end getPrePosition

        /**
         * 获取当前正在输入的关键词
         */
        this.getCurrentKeyword = function(obj) {
            var cursorP; //= this.getCursorPosition(obj);  //this.cursorPosition; ie用
            if (is_IE) {
                cursorP = this.cursorPosition;
            }
            else {
                cursorP = this.getCursorPosition(obj);
            }
            var result = this.calcKeywordInfo(this.input, cursorP, this.separator);
            if (result) {
                return result.currKeyword
            }
            else {
                return "";
            }

        };

        /**
         * 根据用户选择的匹配结果，计算输入字符串
         */
        this.getCompleteInputString = function(obj, inputContent, selectedKeyword) {
            var cursorP; // = this.getCursorPosition(obj);  //this.cursorPosition; ie用
            if (is_IE) {
                cursorP = this.cursorPosition;
            }
            else {
                cursorP = this.getCursorPosition(obj);
            }
            var result = this.calcKeywordInfo(inputContent, cursorP, this.separator);
            var fstStr = inputContent.substring(0, result.start);
            var lstStr = inputContent.substring(result.start + result.length);
            return fstStr + selectedKeyword + lstStr;
            //return this.input.replace(result.currKeyword, selectedKeyword);
        };

        /**
         * 设置自动完成输入字符串，并将光标定位在当前关键字的最后
         */
        this.setAutoCompleteString = function(obj, inputContent, selectedKeyword) {
            var cursorP; // = this.getCursorPosition(obj);  //this.cursorPosition; ie用
            if (is_IE) {
                cursorP = this.cursorPosition;
            }
            else {
                cursorP = this.getCursorPosition(obj);
            }
            var result = this.calcKeywordInfo(inputContent, cursorP, this.separator);
            var str = this.getCompleteInputString(obj, inputContent, selectedKeyword);
            obj.value = str;
            this.setCursorPosition(obj, result.start + selectedKeyword.length);

        };

        /**
         * 设置输入框光标位置
         */
        this.setCursorPosition = function(ctrl, pos) {
            //设置光标位置函数
            if (ctrl.setSelectionRange) {
                ctrl.focus();
                ctrl.setSelectionRange(pos, pos);
            } else if (ctrl.createTextRange) {
                var range = ctrl.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            }

        } //end setCursorPosition

    } //end KeywordRange





    /**
     * 构造函数
     * @param option
     * @constructor
     */
    function AutoComplete(option) {
        //需要实现自动完成功能的页面控件ID
        this.controlId = option.controlId;

        //匹配结果div的id
        this.resultDivId = option.resultDivId;

        //当前选中的项索引，第一项索引为0
        this.index = -1;

        //是否支持多关键字自动完成
        this.hasMultiKeyword = option.hasMultiKeyword || "false";

        //开启多关键字自动完成时，需要设置关键字分隔符，默认为空格
        this.separator = option.separator || " ";

        //静态数据集
        this.datas = option.datas;

        //动态获取的数据集
        this.dynamicDatas = null;

        //服务器端地址
        this.serverUrl = option.serverUrl;

        //匹配结果集合
        this.resultDatas = null;

        //ajax请求数据
        this.ajaxRequestData = option.ajaxRequestData;

        //主要用在一个后台页面处理多个前端自动完成请求的情况，根据此字段调用具体的后台方法
        this.actionName = option.actionName;

        //是否可以循环选择
        this.circleChoose = option.circleChoose || "true";

        //是否从服务器端获取数据
        this.serverEnabled = option.serverEnabled || "false";

        //是否使用静态数据
        //一般情况下，自动完成都是获取动态数据的，开启这个标志后，在获取动态数据失败的情况下会使用静态数据，默认为false
        this.useStaticDatas = option.useStaticDatas || "false";

        //驱动函数
        this.drivenFuc = null;

        //自定义数据获取方法
        this.getCompleteDatas = function() {
            if (typeof option.getCompleteDatas === 'function') {
                return option.getCompleteDatas();
            }
            else {
                return null;
            }

        };

        //初始化多关键词处理对象
        this.keywordHandler = new KeywordRange("", this.separator);


        //私有变量，封装后面常用的4个变量
        //var commonObj = {};

        //通过匿名函数来构造一个类似面向对象语言中的只读属性
        //初始化commonObj变量
        //注意：匿名函数中的this指向windows对象，这里需要将AutoComplete对象的引用赋值给that

        this.commonObj = {
            control: document.getElementById(this.controlId),
            results: document.getElementById(this.resultDivId),
            jControl: $(document.getElementById(this.controlId)),
            jResults: $(document.getElementById(this.resultDivId))
        };


        /**
         * 获取关键词
         */
        this.getKeyword = function() {
            if (this.hasMultiKeyword == "true") {
                this.keywordHandler.input = this.commonObj.jControl.val();
                return this.keywordHandler.getCurrentKeyword(this.commonObj.control);
            }
            else {
                return this.commonObj.jControl.val();
            }
        } //end getKeyword

        //只读属性
        /*this.getCommonObj = function(){
         return commonObj;
         }*/

    }

    /**
     * 原型方法
     */
    AutoComplete.prototype = {

        //指定构造函数
        constructor: AutoComplete,

        init: function() {

            var autoThisObj = this;

            document.onclick = function(event) {
                //$("#"+resultDivId).hide();
                var target = autoThisObj.getTarget(autoThisObj.getEvent(event));
                //alert(target.id);
                if (target.id == autoThisObj.controlId) {
                    return false;
                }
                autoThisObj.clearResults(autoThisObj);
            }

            autoThisObj.keyDownBind(autoThisObj, autoThisObj.commonObj.jResults);

            //兼容ie（ie浏览器下，当按下up与down键时，输入框会失去焦点，导致up与down键不起作用）
            this.commonObj.jResults.attr('tabindex', 1).bind("keydown", function(event) {
                $(this).focus();
                return false;
            });


            //给指定控件绑定keyup事件
            $("#" + autoThisObj.controlId).bind("keyup", function(event) {

                var e = autoThisObj.getEvent(event);
                var keyCode = e.keyCode;
                if ((keyCode == '40' || keyCode == '38' || keyCode == '37' || keyCode == '39' || keyCode == '13' || keyCode == '9')) {
                    return false;
                }

                autoThisObj.index = -1;
                autoThisObj.commonObj.results.scrollTop = 0;

                autoThisObj.keywordHandler.input = autoThisObj.commonObj.jControl.val();
                //alert(commonObj.control.id);
                var keyword = autoThisObj.getKeyword();

                if (keyword.length == 0) {
                    //jResults.hide();
                    autoThisObj.clearResults(autoThisObj);
                    return;
                }

                //获取动态数据集，自定义函数的优先级最高
                var autoDatas = autoThisObj.getCompleteDatas(); //调用自定义数据获取函数

                if ((autoDatas instanceof Array) && (autoDatas.length > 0)) {
                    autoThisObj.dynamicDatas = autoDatas;
                    autoThisObj.generateHtml(autoThisObj, autoThisObj.dynamicDatas);
                    autoThisObj.navigate(autoThisObj);
                }
                else if (autoThisObj.serverEnabled == "true") {  //服务器端获取数据

                    autoThisObj.getAjaxDatas(autoThisObj, keyword);
                    return;
                }
                
                if(!(autoDatas instanceof Array) && autoThisObj.useStaticDatas == "true" && autoThisObj.datas.length > 0){
					
					autoThisObj.generateHtml(autoThisObj, autoThisObj.datas);
                    autoThisObj.navigate(autoThisObj);
				}




            }); //end keyup()

        }, // end init()


        //获取事件对象
        getEvent: function() {
            var ev = window.event || arguments[0]; //IE,chrome  //event ? event : window.event;
            if (!ev) {   //firefox
                var c = this.getEvent.caller;
                while (c) {
                    ev = c.arguments[0];
                    if (ev && (Event == ev.constructor || MouseEvent == ev.constructor)) {
                        break;
                    }
                    c = c.caller;
                }
            }
            return ev;
        },

        //获取事件源
        getTarget: function(event) {
            return event.target || event.srcElement;
        },

        /**
         * 计算div的偏移量
         * @param obj
         * @returns {{left: (Number|number), top: (Number|number)}}
         */
        getOffset: function(obj) {
            var x = obj.offsetLeft || 0;
            var y = obj.offsetTop || 0;
            var temp = obj;
            while (temp.offsetParent) {
                temp = temp.offsetParent;
                x += temp.offsetLeft;
                y += temp.offsetTop;
            }
            //alert("x:"+x+" y:"+y);
            return { left: x, top: y };
        },

        /**
         * 将tagetDiv定位到sourceDiv下方，与sourceDic左对齐，宽度一致
         * @param sourceDiv
         * @param targetDiv
         */
        positionDiv: function(sourceDiv, targetDiv) {
            var obj = document.getElementById(sourceDiv);
            var xy = this.getOffset(obj);
            $("#" + targetDiv).css("left", xy.left);
            $("#" + targetDiv).css("width", $("#" + sourceDiv).outerWidth());
            $("#" + targetDiv).css("top", (xy.top + $("#" + sourceDiv).outerHeight()));

        },

        /**
         * 定义 up与down 按键功能
         * @param event
         * @param objectId
         * @returns {boolean}
         */
        navigate: function(autoThisObj) {

            this.keyDownBind(this, this.commonObj.jControl);

        },  // end navigate()

        /**
         * 给指定jquery元素绑定keydown事件，使其可以进行匹配项的选择
         */
        keyDownBind: function(autoThisObj, jObject) {

            var autoThisObj = this;
            jObject.unbind("keydown");
            jObject.keydown(function() {
                //兼容ie
                if (is_IE) {
                    if (this.id == autoThisObj.commonObj.control.id) {
                        autoThisObj.keywordHandler.cursorPosition = autoThisObj.keywordHandler.getCursorPosition(autoThisObj.commonObj.control);
                    }
                }


                var e = autoThisObj.getEvent();
                var key = e.keyCode;
                if (i == "" || !i)
                    i = -1;
                else
                    i = parseFloat(i);

                var itemCount = autoThisObj.commonObj.results.childNodes.length;

                if (key == '40') //Down
                {
                    autoThisObj.commonObj.jResults.focus();
                    for (var i = 0, len = itemCount; i < len; i++) { //重置
                        if (i % 2 == 0) {
                            autoThisObj.commonObj.results.childNodes[i].className = "item_even";
                        }
                        else {
                            autoThisObj.commonObj.results.childNodes[i].className = "item_odd";
                        }
                    }

                    autoThisObj.index++;

                    if (autoThisObj.index > itemCount - 1) {
                        if (autoThisObj.circleChoose == "true") {
                            autoThisObj.index = 0;
                            autoThisObj.commonObj.jResults.scrollTop(0);
                        }
                        else {
                            autoThisObj.index = itemCount - 1;
                        }
                    }

                    try {
                        autoThisObj.commonObj.results.childNodes[autoThisObj.index].className = "item_even chooseItem";
                        autoThisObj.commonObj.results.childNodes[autoThisObj.index - 1].className = (autoThisObj.index + 1) % 2 == 0 ? "item_even" : "item_odd";
                    }
                    catch (e) {

                    }

                    //以下两个判断语句用来将当前选中项置于div的可视范围内  padding*2+borderwidth = 2*2+1=5
                    if (($(autoThisObj.commonObj.results.childNodes[autoThisObj.index]).height() + 5) * (autoThisObj.index + 1) > autoThisObj.commonObj.jResults.scrollTop() + parseInt(autoThisObj.commonObj.results.style.height)) {
                        autoThisObj.commonObj.jResults.scrollTop(($(autoThisObj.commonObj.results.childNodes[autoThisObj.index]).height() + 5) * (autoThisObj.index + 1) - parseInt(autoThisObj.commonObj.results.style.height));

                    }
                    if (($(autoThisObj.commonObj.results.childNodes[autoThisObj.index]).height() + 5) * (autoThisObj.index) < autoThisObj.commonObj.jResults.scrollTop()) {
                        autoThisObj.commonObj.jResults.scrollTop(($(autoThisObj.commonObj.results.childNodes[autoThisObj.index]).height() + 5) * (autoThisObj.index));

                    }
                    return false;

                }
                else if (key == '38') //UP
                {
                    autoThisObj.commonObj.jResults.focus();
                    for (var i = 0, len = itemCount; i < len; i++) { //重置
                        if (i % 2 == 0) {
                            autoThisObj.commonObj.results.childNodes[i].className = "item_even";
                        }
                        else {
                            autoThisObj.commonObj.results.childNodes[i].className = "item_odd";
                        }
                    }

                    autoThisObj.index--;
                    if (autoThisObj.index < 0) {
                        autoThisObj.index = 0;
                        if (autoThisObj.circleChoose == "true") {
                            autoThisObj.index = itemCount - 1;
                            autoThisObj.commonObj.results.scrollTop = autoThisObj.commonObj.results.scrollHeight;
                        }
                        else {
                            autoThisObj.index = 0;
                        }
                    }

                    try {
                        autoThisObj.commonObj.results.childNodes[autoThisObj.index].className = "item_even chooseItem";
                        autoThisObj.commonObj.results.childNodes[autoThisObj.index + 1].className = (autoThisObj.index + 1) % 2 == 0 ? "item_even" : "item_odd";
                    }
                    catch (e) {

                    }

                    //以下两个判断语句用来将当前选中项置于div的可视范围内
                    if (($(autoThisObj.commonObj.results.childNodes[autoThisObj.index]).height() + 5) * (autoThisObj.index + 1) > autoThisObj.commonObj.jResults.scrollTop() + parseInt(autoThisObj.commonObj.results.style.height)) {
                        autoThisObj.commonObj.jResults.scrollTop(($(autoThisObj.commonObj.results.childNodes[autoThisObj.index]).height() + 5) * (autoThisObj.index + 1) - parseInt(autoThisObj.commonObj.results.style.height));
                    }
                    if (($(autoThisObj.commonObj.results.childNodes[autoThisObj.index]).height() + 5) * (autoThisObj.index) < autoThisObj.commonObj.jResults.scrollTop()) {
                        autoThisObj.commonObj.jResults.scrollTop(($(autoThisObj.commonObj.results.childNodes[autoThisObj.index]).height() + 5) * (autoThisObj.index));
                    }
                    return false;
                }
                else if (key == '13' || key == '9') // enter/tab
                {
                    if (autoThisObj.index == -1)
                        autoThisObj.index = 0;

                    if (autoThisObj.hasMultiKeyword == "true") {
                        //autoThisObj.commonObj.jControl.val(autoThisObj.keywordHandler.getCompleteInputString(autoThisObj.commonObj.control, $.trim(autoThisObj.commonObj.jControl.val()), autoThisObj.commonObj.results.childNodes[autoThisObj.index].innerHTML));
                        autoThisObj.keywordHandler.setAutoCompleteString(autoThisObj.commonObj.control, autoThisObj.commonObj.jControl.val(), autoThisObj.commonObj.results.childNodes[autoThisObj.index].innerHTML);
                    }
                    else {
                        autoThisObj.commonObj.jControl.val(autoThisObj.commonObj.results.childNodes[autoThisObj.index].innerHTML);
                    }


                    autoThisObj.clearResults(autoThisObj);
                    return false;
                }
                else {
                    return;
                }
            }); // end keydown
        },

        /**
         * ajax方式获取匹配结果集
         */
        getAjaxDatas: function(autoThisObj, keyword) {
            var autoThisObj = this;
            var jsonData = { keyword: keyword, type: autoThisObj.actionName };  // ajaxRequestData

            $.ajax({
                url: autoThisObj.serverUrl,
                data: jsonData,
                type: "POST",
                success: function(returnValue) {

                    if (returnValue.length > 0) {
                        autoThisObj.dynamicDatas = returnValue.split(',');
                    }
                    else {
                        autoThisObj.dynamicDatas = null;
                        autoThisObj.clearResults(autoThisObj);
                        return;
                    }

                    //
                    if (autoThisObj.dynamicDatas != null) {
                        autoThisObj.generateHtml(autoThisObj, autoThisObj.dynamicDatas);
                    }
                    else if (autoThisObj.useStaticDatas == "true" && autoThisObj.datas.length > 0) {
                        autoThisObj.generateHtml(autoThisObj, autoThisObj.datas);
                    }

                    autoThisObj.navigate(autoThisObj);
                },  //end success()
                error:function(){
					if (autoThisObj.useStaticDatas == "true" && autoThisObj.datas.length > 0) {
                        autoThisObj.generateHtml(autoThisObj, autoThisObj.datas);
						autoThisObj.navigate(autoThisObj);
                    }
				} //end error
            }); //end ajax()
        },

        /**
         * 获取数据后生成html，并绑定基本事件
         */
        generateHtml: function(autoThisObj, datas) {

            //var commonObj = this.getCommonObj();
            var autoThisObj = this;

            var length = datas.length;

            var htmlStr = "";

            if (length > 0) {

                for (var i = 0; i < length; i++) {
                    if (i % 2 == 0) {
                        htmlStr += "<div class='item_even'>" + datas[i] + "</div>";
                    }
                    else {
                        htmlStr += "<div class='item_odd'>" + datas[i] + "</div>";
                    }
                }

                //htmlStr = "<div class='resultCss' id='"+ autoThisObj.resultDivId +"'>" + htmlStr + "</div>";

                this.commonObj.jResults.html(htmlStr).show();

                //计算单个item的高度
                var itemHeight = $(".item_even").first().outerHeight();

                if (length >= 10) {
                    this.commonObj.jResults.height(10 * itemHeight);
                }
                else {
                    this.commonObj.jResults.height(length * itemHeight);
                }

                //调整结果div的宽度并定位
                this.positionDiv(autoThisObj.controlId, autoThisObj.resultDivId);

                //默认选中第一项
                autoThisObj.index = 0;
                this.commonObj.results.childNodes[autoThisObj.index].className = "item_even chooseItem";

                //给结果集中的每一项添加基本事件
                this.commonObj.jResults.find("[class^='item']").each(function() {
                    //点击事件
                    $(this).on("click", function() {
                        autoThisObj.commonObj.jResults.focus();
                        if (autoThisObj.hasMultiKeyword == "true") {
                            //autoThisObj.commonObj.jControl.val(autoThisObj.keywordHandler.getCompleteInputString(autoThisObj.commonObj.control, $.trim(autoThisObj.commonObj.jControl.val()), $(this).html()));
                            autoThisObj.keywordHandler.setAutoCompleteString(autoThisObj.commonObj.control, autoThisObj.commonObj.jControl.val(), $(this).html());
                            autoThisObj.clearResults(autoThisObj);
                            return false;
                        }
                        else {
                            autoThisObj.commonObj.jControl.val($(this).html());
                        }

                        autoThisObj.clearResults(autoThisObj);
                    });

                    //mouseover事件
                    $(this).mouseover(function() {
                        autoThisObj.index = $(this).index();
                        var results = document.getElementById(autoThisObj.controlId);
                        var itemCount = document.getElementById(autoThisObj.resultDivId).childNodes.length;
                        for (var i = 0, len = itemCount; i < len; i++) {
                            document.getElementById(autoThisObj.resultDivId).childNodes[i].className = i % 2 == 0 ? "item_even" : "item_odd";  //重置
                        }
                        document.getElementById(autoThisObj.resultDivId).childNodes[autoThisObj.index].className = "item_even chooseItem";

                    });



                });
            }
            else {
                this.clearResults(autoThisObj);
            }
        },

        /**
         * 清空结果div
         */
        clearResults: function(autoThisObj) {
            var results = document.getElementById(autoThisObj.resultDivId);
            var jResults = $(results);
            results.innerHTML = "";
            jResults.scrollTop(0);
            results.style.display = "none";
            jResults.css("height", "auto");
            autoThisObj.dynamicDatas = null;
            autoThisObj.index = 0;
            autoThisObj.keywordHandler.cursorPosition = -1;
        },

        //重置结果集
        resetResults: function(autoThisObj) {
            var results = document.getElementById(this.resultDivId);
            var jResults = $(results);
            this.commonObj.jResults.scrollTop(0);
            results.style.display = "none";
            autoThisObj.index = 0;

            var itemCount = results.childNodes.length;
            for (var i = 0, len = itemCount; i < len; i++) {
                results.childNodes[i].className = "item";  //重置
            }

            results.childNodes[autoThisObj.index].className = "item chooseItem";
        }


    }

    //将AutoComplete暴露到全局范围
    window.AutoCompleteMulti = AutoComplete;
})();
