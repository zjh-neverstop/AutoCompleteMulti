AutoCompleteMulti
=================

实现自动完成功能的js类                                                         
1、数据获取方式：设置静态数据集、ajax方式、自定义数据获取函数                                    
2、可以控制是否启用匹配项的循环选择                                                   
3、可以控制是否使用默认静态数据集，在获取动态数据失败的情况下会显示                                   
4、支持多关键词自动完成，开启多关键词自动完成时，可以设置关键词分隔符，默认是空格                         
多关键词匹配时，自动识别当前正在输入的关键词，当用户选中某个匹配项后，自动将光标定位在该关键词后
面

//方式1：静态数据集

    var staticDatas = ["asd","axcv","qwerfd","dfghj","cvbnm","bbghty","ertgb","trefgc","cssdavb","abcdefg","trefgc","cssdavb","abcdefg"];
        /*
		var autoCompleteOption = {
                        controlId: "inpt",            //实现自动完成的控件ID
                        resultDivId: "tipList",		  //显示匹配结果的div的id
                        circleChoose: "true",         //是否开启循环选择
                        serverEndbled: "false",       //是否开启服务器端匹配
                        useStaticDatas:"true",        //是否使用静态数据
						serverEnabled: "false",		  //是否开启服务器端匹配
						hasMultiKeyword: "true",      //是否开启多关键词自动完成
                        datas:staticDatas	          
                    };
            
        var auto = new AutoCompleteMulti(autoCompleteOption);
        auto.init();
		*/

        //方式2：自定义数据获取函数
        
        var autoCompleteOption = {
                        controlId: "inpt",				//实现自动完成的控件ID
                        resultDivId: "tipList",			//显示匹配结果的div的id
                        circleChoose: "true",			//是否开启循环选择
						useStaticDatas:"true",          //是否使用静态数据
						datas:staticDatas,
                        getCompleteDatas: function(){	//自定义数据获取函数
                            var datas = null;
                            //enter your code to get the data
                            return datas;
                        }
                    };
            
        var auto = new AutoCompleteMulti(autoCompleteOption);
        auto.init();
        

        //方式3：ajax获取数据
        /*
        var autoCompleteOption = {
                        controlId: "inpt",			//实现自动完成的控件ID
                        resultDivId: "tipList",		//显示匹配结果的div的id
                        circleChoose: "true",		//是否开启循环选择
						useStaticDatas:"true",        //是否使用静态数据
						datas:staticDatas,
						serverEnabled: "true",     //是否开启服务器端匹配
                        serverUrl: "AutoCompleteHandler.ashx"  //服务器处理地址
                    };
            
        var auto = new AutoCompleteMulti(autoCompleteOption);
        auto.init();
        */
