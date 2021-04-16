# 描述
1. 根据关键词 进行高亮
2. 根据错别字 进行划线标识，并可以替换和定位

# 何时使用
当需求中有 需要对展示的内容进行敏感词或错别字标记时，可以使用此功能。

# 展示效果
![效果图](https://tva1.sinaimg.cn/large/008eGmZEgy1gpa2eonuw1g30zq06ab2d.gif)
[图片预览](https://tva1.sinaimg.cn/large/008eGmZEgy1gpa2eonuw1g30zq06ab2d.gif)

# 组件代码
见结尾附件

# 代码演示
```html
<pt-highlight-plus
ref="ref-hl"
v-model="highLightInfo.content"
:highLightInfo="highLightInfo"
:errorWordsArrs="errorWordsArrs"
height="200"
formatType="book"
inputClassName="borderT"
backgroundColor="#F7F4ED">

</pt-highlight-plus>
```

```javascript
export default {
	data() {
		return {
			highLightInfo: {
					content: '',
					highLightWords: '', // 禁词
					sensitiveWords: '', // 敏感词
					dangerWords: '' // 高危词
			},
			errorWordsArrs: [
				{
					'index_begin': '2311',
					'index_end': '2435',
					'begin_pos': '40',
					'end_pos': '42',
					'source_begin_pos': '40',
					'source_end_pos': '42',
					'ori_frag': '闺密',
					'correct_frag': '闺蜜',
					'score': '1'
				}
			]
		};
	},
	methods: {
		position_word() { // 错别字定位方法
			this.$refs['ref-hl'].position_correct_word_by_outside(this.errorWordsArrs[0]);
		},
		replace_word() { // 错别字替换方法
			this.$refs['ref-hl'].replace_correct_words_by_outside(this.errorWordsArrs);
		},
		overlook_word() { // 错别字忽略方法
			this.$refs['ref-hl'].overlook_correct_words_by_outside(this.errorWordsArrs);
		},
		withdraw_overlook() { // 撤销忽略方法
			this.$refs['ref-hl'].withdraw_overlook_by_outside(this.errorWordsArrs[0]);
		},
		recheck() { // 重新检测错别字方法
			this.$refs['ref-hl'].init_data(this.contentHighlightData.content, this.errorWordsArrs);
		}
	};
```

# API
| 参数  | 说明  | 类型  | 默认值  | 版本  |
| ------------ | ------------ | ------------ | ------------ | ------------ |
|  v-model  | 输入框内容  | String  | 无 | 1.0  |
|  errorWordsArrs  | 错别字标识信息，用来标记出错误的文字  | Object  |{}  | 1.0  |
|  highLightInfo  | 组件所需数据，其中content为后端返回的数据，不需单独特殊处理，组件中统一进行处理  | Object  | 无  | 1.0  |
|  formatType  | 高亮文本的类型，根据不同的类型，格式形式略有不同(book\txt\title)   | String  | book  | 1.0  |
|  isSingleWordValidate  | 是否全局校验单个英文字母为敏感词 | Boolean  | false  | 1.0  |
|  isSingleNumberValidate  | 是否全局校验单个数字为敏感词  | Boolean  | false  | 1.0  |
|  isDisabled  | 是否可以编辑  | Boolean  | false  | 1.0  |
|  fontSize  | 字体大小设置 | String  | ’12’  | 1.0  |
|  maxWords  | 最大字数限制  | Number  | 5000  | 1.0  |
|  isConentIncludePtag  | 传递的展示content是否包含p标签  | Boolean  | true  | 1.0  |
|  isReturnContentIncludePtag  | 返回的content是否需要包含p标签格式  | Boolean  | true  | 1.0  |
|  backgroundColor  | 背景色  | String  | 无  | 1.0  |
|  height  | 编辑区域高度  | String  | auto  | 1.0  |
|  inputClassName  | 给编辑区域的容器添加class类名，用来个性化细节样式  | String  | 无 | 1.0  |

# 事件
| 事件名称  | 说明  | 回调参数  |
| ------------ | ------------ | ------------ |
|  totalWords  | 内容总字数，编辑时，实时返回字数  | totalWords  |
|  clickCorrectTooltip  | 点击tooltip弹框修改错字时，返回的修改错词的对象  |errObj  |