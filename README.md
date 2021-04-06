# 描述
1. 根据关键词 进行高亮
2. 根据错别字 进行划线标识，并可以替换和定位

# 何时使用
当需求中有 需要对展示的内容进行敏感词或错别字标记时，可以使用此功能。

# 展示效果
![效果图](https://tva1.sinaimg.cn/large/008eGmZEgy1gpa2eonuw1g30zq06ab2d.gif)
[图片预览](https://tva1.sinaimg.cn/large/008eGmZEgy1gpa2eonuw1g30zq06ab2d.gif)


# 代码演示
```html
<pt-highlight-plus
ref="ref-hl"
v-model="highLightInfo.content"
:highLightInfo="highLightInfo"
:errorWordsArrs="errorWordsArrs"
height="200"
formatType="book"
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
                    'index_begin': '0',
                    'index_end': '20',
                    'begin_pos': '11',
                    'end_pos': '12',
                    'source_begin_pos': '11',
                    'source_end_pos': '12',
                    'ori_frag': '加',
                    'correct_frag': '减',
                    'score': '1'
                }
			]
		};
	},
	methods: {
		position_word() { // 定位错别字
			this.$refs['ref-hl'].position_correct_word_by_outside(this. errorWordsArrs[0]);
        },
		replace_word() { // 替换错别字
			this.$refs['ref-hl'].replace_correct_word_by_outside(this. errorWordsArrs[0]);
        }}
};
```

# API
| 参数  | 说明  | 类型  | 默认值  | 版本  |
| ------------ | ------------ | ------------ | ------------ | ------------ |
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

# 事件
| 事件名称  | 说明  | 回调参数  |
| ------------ | ------------ | ------------ |
|  totalWords  | 内容总字数，编辑时，实时返回字数  | totalWords  |
