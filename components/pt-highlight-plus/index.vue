<template>
    <div>
        <div
        id="js-pt-contenteditable"
        :class="['pt-contenteditable', contentType, `font-size-${fontSize}`, isOutMaxWords]"
        :style="{'height': height || 'auto', 'background': backgroundColor }"
        :contenteditable="!isDisabled"
        v-html="editContent"
        @input="input_content"
        @blur="blur_box"
        @click="click_box">
        </div>

        <div class="pt-correct-tooltip" id="js-correct-tooltip">
            <span class="pt-correct-tooltip-diamond"></span>
            <div class="pt-correct-tooltip-content">
                <span class="pt-correct-word" id="js-correct-word"></span>
            </div>
        </div>
    </div>
</template>

<script>
import { replace_nbsp, product_highLight_html, del_html_tag_include_p, replace_html_to_text, replace_text_to_p, del_all_html_tag } from './tools/highlight';
import { add_error_words_underline } from './tools/correct';

export default {
    name: 'PtHighlightPlus',
    props: {
        content: { type: String, default: '' },
        highLightInfo: { type: Object, default: () => {} },
        height: { type: String, default: 'auto' },
        contentType: { type: String, default: 'book' }, // 高亮文本的类型，根据不同的类型，格式形式略有不同
        isSingleWordValidate: { type: Boolean, default: false }, // 是否全局校验单个英文字母为敏感词
        isSingleNumberValidate: { type: Boolean, default: false }, // 是否全局校验单个数字为敏感词
        isDisabled: { type: Boolean, default: false }, // 是否可以编辑
        fontSize: { type: String, default: '12' }, // 字体大小设置
        maxWords: { type: Number, default: 5000 }, // 最大字数限制
        isConentIncludePtag: { type: Boolean, default: true }, // 传递的展示content是否包含html标签
        isReturnContentIncludePtag: { type: Boolean, default: true }, // 返回的content是否需要包含p标签格式
        backgroundColor: { type: String, default: '' }, // 护眼色
        errorWordsArrs: { type: Array, default: () => [] } // 错别字
    },
    model: {
        prop: 'content',
        event: 'input'
    },
    components: {},
    data() {
        return {
            editContent: '',
            inputHTML: '', // 每次输入后的innerHTML
            totalWords: 0
        };
    },
    computed: {
        isOutMaxWords() {
            return this.totalWords > this.maxWords ? 'out-max-words' : '';
        }
    },
    watch: {
        content: {
            deep: true,
            handler(newval, oldval) {
                // console.log('watch');
                // 数据 只初始化第一次
                if (!oldval) {
                    this.init_data();
                    // this.click_u_tag();
                }
            }
        }
    },
    created() {
        // this.init_data();
        // this.check_max_word(this.content, this.maxWords);
    },
    mounted() {
        // this.click_u_tag();
    },
    methods: {
        init_data(content = this.content, errArr = this.errorWordsArrs) { // 初始化数据
            let _content = content;
            // 标记错别字
            _content = add_error_words_underline(errArr, _content);
            this.inputHTML = _content;

            // 不含p标签的文本加上p标签
            if (!this.isConentIncludePtag) _content = replace_text_to_p(_content);
            _content = product_highLight_html(_content, this.highLightInfo, this.isSingleWordValidate, this.isSingleNumberValidate);

            this.editContent = _content;

            // 初始化时，判断下字数是否超出最大字数
            this.check_max_word(this.content, this.maxWords);
            // 初始化错别字绑定点击事件
            this.click_u_tag();
        },
        blur_box() { // 光标移出 重新检测敏感词
            this.editContent = product_highLight_html(this.inputHTML, this.highLightInfo, this.isSingleWordValidate, this.isSingleNumberValidate);

            this.click_u_tag();
        },
        input_content(event) { // 输入文本时
            this.check_max_word(event.target.innerHTML, this.maxWords);
            this.format_back_html(event.target.innerHTML);
        },
        check_max_word(html, maxWords) { // 检测字数是否超出最大字数
            let _inputContent = replace_nbsp(html);
            _inputContent = del_all_html_tag(_inputContent);
            // 最终的字数不包含空格与换行符
            const _totalWords = _inputContent.replace(/\s/gi, '').length;
            this.totalWords = _totalWords;
            if (_totalWords < maxWords) {
                this.$emit('totalWords', _totalWords);
                return true;
            } else {
                alert(`超出最大字数限制${maxWords}`);
                return false;
            }
        },
        format_back_html(html){ // 格式化数据，返回
            // 兼容chrome浏览器输入第二个空格为&nbsp;
            let _html = replace_nbsp(html);
            // 修改后的数据重新赋值
            this.inputHTML = _html;
            if (this.isReturnContentIncludePtag) _html = del_html_tag_include_p(_html);
            else _html = replace_html_to_text(_html);
            this.$emit('input', _html);
        },
        click_box() { // 点击编辑区域时
            const _tooltip = document.getElementById('js-correct-tooltip');
            _tooltip.style.display = 'none';
        },
        click_u_tag() { // 点击u标签的一些处理
            this.$nextTick(() => {
                document.getElementsByTagName('u').forEach(uTag => {
                    uTag.onclick = (event) => {
                        event.stopPropagation();
                        if (event.target.localName == 'mark') this.handle_u(event.path[1]);
                        else this.handle_u(event.target);
                    };
                });
            });
        },
        handle_u(eventT) { // 处理u标签的点击执行内容
            const _tooltip = document.getElementById('js-correct-tooltip');
            if (eventT.classList.contains('overlook')) return;
            const _correctWord = eventT.dataset.correct;

            _tooltip.style.display = 'block';
            _tooltip.style.top = eventT.offsetTop + 22 + 'px';
            _tooltip.style.left = eventT.offsetLeft - 15 + 'px';

            this.click_tooltip(eventT.id, _correctWord);
        },
        click_tooltip(uTagId, correctWord) { // 点击错词弹框
            const _tooltip = document.getElementById('js-correct-tooltip');
            const _tooltipCorrectWord = document.getElementById('js-correct-word');
            _tooltipCorrectWord.innerText = correctWord || 'empty';

            _tooltipCorrectWord.onclick = () => {
                document.getElementById(uTagId).outerText = correctWord;
                _tooltip.style.display = 'none';
                this.$emit('clickCorrectTooltip', this.errorWordsArrs.find(item => item.id == uTagId));
                const _contentDom = document.getElementById('js-qm-contenteditable'); // 最外面的框
                this.format_back_html(_contentDom.innerHTML); // 触发给父组件实时数据
            };
        },
        position_correct_word_by_outside(errObj) { // 定位到错字
            const _idNum = (+errObj.index_begin) + (+errObj.begin_pos);
            const _id = `correct-${_idNum}`;
            const _curDom = document.getElementById(_id);
            if (!_curDom) return;
            _curDom.scrollIntoView(false);
            _curDom.classList.add('qm-correct-edit-highlight');
            setTimeout(() => {
                _curDom.classList.remove('qm-correct-edit-highlight');
            }, 1000);
        },
        replace_correct_words_by_outside(errArr) { // 替换错字
            errArr.forEach((errObj) => {
                const _idNum = (+errObj.index_begin) + (+errObj.begin_pos);
                const _id = `correct-${_idNum}`;
                const _curDom = document.getElementById(_id);
                if (!_curDom) return;
                _curDom.outerHTML = errObj.correct_frag;
            });
            const _contentDom = document.getElementById('js-qm-contenteditable');
            this.format_back_html(_contentDom.innerHTML);
        },
        overlook_correct_words_by_outside(errArr) { // 忽略错别字
            errArr.forEach(errObj => {
                const _idNum = (+errObj.index_begin) + (+errObj.begin_pos);
                const _id = `correct-${_idNum}`;
                const _curDom = document.getElementById(_id);
                if (!_curDom) return;
                _curDom.classList.add('overlook');
            });
        },
        withdraw_overlook_by_outside(errObj) { // 撤销忽略
            const _idNum = (+errObj.index_begin) + (+errObj.begin_pos);
            const _id = `correct-${_idNum}`;
            const _curDom = document.getElementById(_id);
            if (!_curDom) return;
            _curDom.classList.remove('overlook');
        }
    }
};
</script>

<style lang="scss" scoped>
$fontSizeArr: (10 11 12 13 14 15 16 17 18 19 20 21 22);
.pt-contenteditable {
    border: 1px solid #DCDFE6;
    border-radius: 5px;
    text-align: left;
    letter-spacing: 1px;
    font-family: Arial, simsun;
    word-break: break-word;
    padding: 0px 10px;
    overflow: hidden;
    overflow-y: auto;
    &.book {
        text-indent: 2em;
    }
}
@for $i from 1 through length($fontSizeArr){
    .font-size-#{nth($fontSizeArr, $i)}{
        font-size: #{nth($fontSizeArr, $i)}px !important;
    }
}

.out-max-words {
    border: 2px solid red;
}

/deep/mark {
    padding: 0px;
    &.ban {
        // color: $body-bg;
        background: $error-color;
    }
    &.danger {
        background: yellow;
    }
    &.sensitive {
        background: #05f505;
    }
}

/deep/u { // 错别字下划线
    text-decoration: none;
    border-bottom: 3px #b70000 solid;
    &:active {
        background: #ffdccc;
    }
}

/deep/i {
    background: #bbd8f7;
}

.pt-correct-tooltip {
    display: none;
    position: absolute;
    background: #fff;
    width: -webkit-fit-content;
    width: fit-content;
    min-width: 42px;
    border-radius: 4px;
    white-space: nowrap;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.15);
    z-index: 10;
    .pt-correct-tooltip-diamond {
        display: block;
        position: absolute;
        width: 8px;
        height: 8px;
        background-color: #fff;
        top: -4px;
        left: 50%;
        -webkit-transform: translateX(-50%) rotate(45deg);
        transform: translateX(-50%) rotate(45deg);
        -webkit-transform-origin: center;
        transform-origin: center;
        box-shadow: -3px -3px 7px rgba(0, 0, 0, 0.1);
    }
    .pt-correct-tooltip-content {
        font-family: PingFangSC-Regular;
        font-size: 14px;
        line-height: 34px;
        padding: 0 12px;
        border-radius: 4px;
        .pt-correct-word {
            font-size: 12px;
            line-height: 20px;
            text-decoration: none;
            color: #ff4f00;
            cursor: pointer;
            &:hover {
                color: #e83600;
            }
        }
    }
}

/deep/.pt-correct-edit-highlight {
    -webkit-animation-name: PtCorrectHighlight;
    -webkit-animation-duration: .75s;
    -webkit-animation-timing-function: linear;
    -webkit-animation-iteration-count: 1;
    -webkit-animation-direction: alternate;
    animation-name: PtCorrectHighlight;
    animation-duration: .75s;
    animation-timing-function: linear;
    animation-iteration-count: 1;
    animation-direction: alternate;
}

@keyframes PtCorrectHighlight
{
    from {background: #e83600;}
    to {background: none;}
}
</style>
