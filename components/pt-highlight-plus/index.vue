<template>
    <div class="q-highlight-box">
        <!-- 输入区域 -->
        <div
            ref="ref-highlight"
            :placeholder="placeholder"
            :class="['q-contenteditable', contentType, `font-size-${fontSize}`, { 'out-max-words': isOverMaxWords }, inputClassName]"
            :style="{'height': height || 'auto', 'background': backgroundColor }"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            :contenteditable="!isDisabled"
            :key="componentKey"
            @input="input_content"
            @keydown="keydown_content"
            @keyup="keyup_content"
            @blur="blur_box"
            @paste="paste_content_check"
            @click="click_u_tag"
        >
        </div>

        <!-- 纠错词弹框 -->
        <div ref="ref-tooltip" class="q-correct-tooltip" v-if="errorWords.length > 0" @click.stop="() => {}">
            <span class="q-correct-tooltip-diamond"></span>
            <div class="q-correct-tooltip-content">
                <!-- 正确字提示框 -->
                <span
                    class="q-correct-word"
                    ref="ref-tooltip-word"
                    @click="click_correct_word_tooltip"
                >
                </span>
            </div>
        </div>

        <span ref="ref-placeholder" :class="['q-placeholder', `font-size-${fontSize}`, {'hidden': isHidePlaceholder}]" @click="focuse_div">{{placeholder}}</span>
    </div>
</template>

<script>
import { replace_nbsp, replace_sapce, product_highLight_html, del_html_tag_except_p, replace_html_to_text, replace_text_to_p, get_total_word_num, polyfill_ie_paste, del_u_tag } from './tools/highlight';
import { add_error_words_underline, add_erro_underline_by_regex, filter_u_tag, set_range } from './tools/correct';
import { check_repeat_paragraph } from './tools/repeat';
import { uuid } from '@assets/js/tools';
// import debounce from 'lodash/debounce';

export default {
    name: 'QHighlightPro',
    props: {
        content: { type: String, default: '' },
        placeholder: { type: String, default: '' },
        highLightInfo: { type: Object, default: () => {} },
        height: { type: String, default: 'auto' },
        contentType: { type: String, default: 'book' }, // 高亮文本的类型，根据不同的类型，格式形式略有不同
        fontSize: { type: String, default: '12' }, // 字体大小设置
        maxWords: { type: Number, default: 5000 }, // 最大字数限制
        backgroundColor: { type: String, default: '' }, // 护眼色
        errorWordsArrs: { type: Array, default: () => [] }, // 错别字
        inputClassName: { type: String, default: '' },
        isSingleWordValidate: { type: Boolean, default: false }, // 是否全局校验单个英文字母为敏感词
        isSingleNumberValidate: { type: Boolean, default: false }, // 是否全局校验单个数字为敏感词
        isDisabled: { type: Boolean, default: false }, // 是否可以编辑
        isConentIncludePtag: { type: Boolean, default: true }, // 传递的展示content是否包含html标签
        isReturnContentIncludePtag: { type: Boolean, default: true }, // 返回的content是否需要包含p标签格式
        isClickTooltip: { type: Boolean, default: true }, // 是否可以点击弹框纠错
        isInputBackContent: { type: Boolean, default: false }, // 每次输入是否返回输入后的数据
        isRealtimeFormat: { type: Boolean, default: true }, // 是否鼠标移除焦点对文本内容进行格式化（空格）
        isRealtimeHighlight: { type: Boolean, default: true }, // 是否鼠标移除焦点对文本内容进行高亮标记
        isRealtimeCorrect: { type: Boolean, default: true }, // 是否实时纠错
        onRealTimeCheck: { type: Function, default: () => {} } // 实时检测方法
    },
    model: {
        prop: 'content',
        event: 'input'
    },
    components: {},
    data() {
        // this.input_content_check = debounce(this.input_content_check, 5000);
        return {
            isOverMaxWords: false,
            componentKey: 1,
            isInit: false, // 是否已经初始化过数据
            errorWords: [],
            isHidePlaceholder: false
        };
    },
    computed: {},
    watch: {
        content: {
            handler() {
                // 数据 只初始化第一次
                if (!this.isInit) this.init_data();
            }
        }
    },
    created() {},
    mounted() {
        document.addEventListener('click', this.hidden_tooltip);
        this.$once('hook:beforeDestroy', function() {
            document.removeEventListener('click', this.hidden_tooltip);
        });

        this.$refs['ref-highlight'].innerHTML = '<p><br></p>'; // 默认没值的时候，保证输入的时候是在p标签内，不直接赋值eidtcontent，是为了保证editContent为空，直接设置editcontent怕影响别的地方功能
    },
    methods: {
        init_data(content = this.content) { // 初始化数据
            this.isInit = true;
            if (!content) return;

            // 有内容，移除placeholder
            // this.$refs['ref-placeholder'].classList.add('hidden');
            this.isHidePlaceholder = true;

            // 给组件内部使用的错字数组赋值
            if (this.errorWordsArrs) this.errorWords = JSON.parse(JSON.stringify(this.errorWordsArrs));

            let _content = content;
            // 标记错别字
            _content = add_error_words_underline(this.errorWords, _content);

            // 不含p标签的文本加上p标签
            if (!this.isConentIncludePtag || !content.includes('<p>')) _content = replace_text_to_p(_content);

            // 添加高亮
            _content = product_highLight_html(_content, this.highLightInfo, this.isSingleWordValidate, this.isSingleNumberValidate);

            // 给页面绑定数据
            if (!_content) {
                this.isHidePlaceholder = false;
                _content = '<p class="js-range-dom"><br></p>';
            }
            this.$refs['ref-highlight'].innerHTML = _content;
            // this.componentKey += 1; // 强制更新组件，保证忽略后重新检测能更新视图

            // 返回当前页面的纠错的错词信息，保持组件外和组件内展示保持一致
            this.get_current_u_tag();
            // 初始化时，告诉外部当前字数
            this.notice_total_words_to_outside(this.$refs['ref-highlight'].innerText);
        },
        blur_box(event) { // 光标移出 重新检测敏感词
            const _html = replace_nbsp(event.target.innerHTML);

            if (this.isRealtimeFormat) this.format_content_by_outside(); // 是否自动焦点移除排版
            if (this.isRealtimeHighlight) this.upload_highlight_info_by_outside(this.highLightInfo); // 是否自动焦点移除高亮
            this.format_back_html(_html);
        },
        input_content(event) { // 输入文本时
            this.notice_total_words_to_outside(event.target.innerText); // 返回当前输入后的总字数
            const _totalWords = get_total_word_num(event.target.innerText);
            if (!this.isInit) this.isInit = true; // 当开始输入后，即使之前的初始值为空，也不再执行init_data方法
            // this.$refs['ref-placeholder'].classList.add('hidden'); // 输入时隐藏placeholder
            this.isHidePlaceholder = true;
            this.hidden_tooltip(); // 输入时隐藏已经展示的错字弹框
            this.get_current_u_tag(); // 输入后更新目前页面中的纠错信息个数，避免删除错字信息后外部弹框没有更新

            // 未知情况 || 复制
            if (!(event.inputType == 'historyUndo' || event.inputType == '')) {
                // 暂时移出输入实时监测
                // const _inputDom = this.get_focuse_dom();
                if (event.inputType == 'insertParagraph') this.enter_content_check(_totalWords);
                // else this.input_content_check(_inputDom);
            }

            // 是否实时返回输入数据
            if (this.isInputBackContent) this.format_back_html(event.target.innerHTML);

            // 保证编辑框内部有个p标签，避免删除到空之后，输入内容按照div分行。一影响样式，二影响返回数据
            const _editDom = this.$refs['ref-highlight'];
            if (!_editDom.innerText.replace(/\s+/g, '')) {
                // this.$refs['ref-placeholder'].classList.remove('hidden');
                this.isHidePlaceholder = false;
                _editDom.innerHTML = '<p class="js-range-dom"><br></p>';
                // 保证firefox删除为空时，输入光标不在p标签上，导致样式出错
                set_range(this.$refs['ref-highlight'].getElementsByClassName('js-range-dom')[0]);
            }
        },
        keydown_content(event) {
            this.isOverMaxWords = false;
            const _KeyEnum = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Meta', 'Control', 'Backspace'];
            // 超出字体最大限制，禁止输入
            if (!_KeyEnum.includes(event.key) && !event.ctrlKey && !event.metaKey) {
                if (get_total_word_num(event.target.innerText) >= this.maxWords) {
                    event.preventDefault();
                    this.$refs['ref-highlight'].blur();
                    this.isOverMaxWords = true;
                }
            }
        },
        keyup_content(event) {
            this.notice_total_words_to_outside(event.target.innerText); // 返回当前输入后的总字数 兼容ie
        },

        /** 纠错弹框相关方法 begin */
        hidden_tooltip() { // 隐藏tooltip
            const _tooltip = this.$refs['ref-tooltip'];
            if (!_tooltip) return;
            _tooltip.style.display = 'none';
        },
        click_u_tag(event) { // 点击u标签的一些处理
            const _dom = this.get_tag_by_name(event.target, 'u');
            if (_dom && _dom.nodeName == 'U') {
                _dom.id = `utag-${uuid()}`; // 设置唯一id用于点击正确词弹框替换
                event.stopPropagation(); // 阻止冒泡，防止触发外部绑定的隐藏方法
                const _oriWord = _dom.dataset.ori;
                // 如果错别字框中的内容与原始错字不符，则去除错字标记
                if (_oriWord != _dom.innerText) {
                    _dom.outerText = _dom.innerText;
                    this.get_current_u_tag();
                } else this.show_tooltip(_dom);
            }
        },
        show_tooltip(event) { // 处理u标签的点击执行内容
            const _tooltip = this.$refs['ref-tooltip'];
            if (event.classList.contains('overlook')) return;
            if (!_tooltip) return;

            _tooltip.style.display = 'block';
            _tooltip.style.top = event.offsetTop + 22 + 'px';
            _tooltip.style.left = event.offsetLeft - 15 + 'px';

            const _correctWord = event.dataset.correct;
            // 给正确字提示框赋值
            const _tooltipCorrectWord = this.$refs['ref-tooltip-word'];
            _tooltipCorrectWord.innerText = _correctWord || '建议删除';
            _tooltipCorrectWord.dataset.utagid = event.id;
            _tooltipCorrectWord.dataset.correct = _correctWord;
        },
        click_correct_word_tooltip(event) { // 点击正确词提示框
            if (!this.isClickTooltip) return; // 是否需要点击tooltip替换错字功能
            const _container = this.$refs['ref-highlight']; // 父容器
            const _utagID = event.target.dataset.utagid;
            const _correctWord = event.target.dataset.correct;
            _container.querySelector(`#${_utagID}`).outerHTML = _correctWord;

            this.$refs['ref-tooltip'].style.display = 'none';
            this.notice_total_words_to_outside(_container.innerText);
            this.get_current_u_tag();
            this.format_back_html(_container.innerHTML); // 触发给父组件实时数据
        },
        /** 纠错弹框相关方法 end */

        /** 实时检测错别字用到的方法 begin */
        input_content_check(dom) { // 输入内容时检测
            if (!dom) return;
            const _inputDom = this.get_focuse_dom();
            if (!_inputDom || dom.innerHTML != _inputDom.innerHTML) return; // 因为有5秒的debounce，保证执行时和触发时的dom内容相同才进行接口请求，输入后光标移到别处不触发实时监测

            // 焦点不在编辑框 不继续执行(get_focuse_dom方法已改写，获取到的节点肯定在编辑框内)
            if (!_inputDom.innerText.replace(/\s+/g, '')) return;
            _inputDom.innerHTML = _inputDom.innerText;
            set_range(_inputDom);
            this.use_api_real_time(_inputDom.innerText);
        },
        enter_content_check(passTotalWords) { // 输入回车时检测
            const _inputDom = this.get_focuse_dom();
            if (!_inputDom) return;
            if (_inputDom.innerText == '\n') _inputDom.innerHTML = '<br>'; // 兼容在纠错词后换行，导致下一行中会填充u标签的问题
            const _checkDom = _inputDom.previousSibling; // 如果输入的是回车，获取前一个dom
            // _checkDom.innerHTML = _checkDom.innerText;
            // set_range(_inputDom);
            this.use_api_real_time(_checkDom.innerText, passTotalWords, 'enter');
        },
        paste_content_check(event) { // 复制粘贴时检测
            const _inputDom = this.get_focuse_dom();
            let _text = '';
            if (window.clipboardData && window.clipboardData.getData) {
                // IE
                _text = window.clipboardData.getData('Text');
            } else if (event.clipboardData) {
                event.preventDefault();
                _text = event.clipboardData.getData('text/plain');
                // 换行等处理
                _text = _text.replace(/\r\n/gi, '<br/>').replace(/\n/gi, '<br/>').split('<br/>').filter(item => item != '');
                _text = _text.map((item, idx) => {
                    // 兼容firefox 在当前行复制会自动换行（首行不加p） && 内容为空时复制首行要加p
                    if (idx != 0 || !_inputDom || !_inputDom.innerText) return `<p>${item}</p>`;
                    else if (idx == 0) return item;
                }).join('');
                _text = replace_sapce(_text);
                document.execCommand('insertHTML', false, _text); // ie11及以下版本不支持此方法
            }
            // 调用接口
            this.use_api_real_time(_text);
            this.notice_total_words_to_outside(this.$refs['ref-highlight'].innerText); // 返回当前输入后的总字数
        },
        async use_api_real_time(checkContent, passTotalWords, inputType) { // 请求接口获取实时检测的数据
            if (!this.isRealtimeCorrect) return;
            if (!checkContent.replace(/\s+/g, '')) return; // 检测内容为空不校验
            this.get_current_u_tag(); // 因为检测前会删除纠错标签，所以开始时获取下页面的纠错标签

            const _res = await this.onRealTimeCheck(checkContent);
            if (_res.code != '200') return;
            // 检测前后总字数不一样不进行错字标记，可能因为光标丢失导致输入内容有问题
            if (inputType == 'enter' && passTotalWords != get_total_word_num(this.$refs['ref-highlight'].innerText)) return;
            // 没有纠错信息 不走下面内容
            if (_res.data && _res.data.length > 0) {
                // 给编辑的标签添加标记，用作后续定位光标
                this.remove_all_range_class();
                const _focuseDom = this.get_focuse_dom();
                if (_focuseDom) _focuseDom.classList.add('js-range-dom');

                _res.data.forEach(erroInfo => {
                    this.errorWords = [...this.errorWords, ...erroInfo.errorWords];
                });

                // 根据纠错内容添加纠错标签
                const _content = this.$refs['ref-highlight'].innerHTML;
                const _realTimeContent = add_erro_underline_by_regex(_res.data, _content);
                this.$refs['ref-highlight'].innerHTML = _realTimeContent;

                // 光标定位
                this.$nextTick(() => {
                    const _dom = this.$refs['ref-highlight'].getElementsByClassName('js-range-dom')[0];
                    set_range(_dom, inputType);
                });
            }
            this.get_current_u_tag(); // 返回当前页面的纠错的错词信息，保持组件外和组件内展示保持一致
        },
        get_current_u_tag() {
            this.$nextTick(() => {
                const _container = this.$refs['ref-highlight'];
                if (!_container) return;
                const _uTagArrs = _container.getElementsByTagName('u');
                this.$emit('realtimeErrorWords', filter_u_tag(_uTagArrs, this.errorWords));
            });
        },
        /** 实时检测错别字用到的方法 end */

        /** 组件外部访问的方法 begin */
        position_error_word_by_outside(errObj) { // 定位到错字
            const _tagName = this.get_u_data_tag_name(errObj);
            const _curDom = this.$refs['ref-highlight'].querySelector(`u:not(.overlook)[data-tag=${_tagName}]`);
            if (!_curDom) return;
            _curDom.scrollIntoView(false);

            _curDom.classList.add('q-correct-edit-highlight');
            const _timer = setTimeout(() => {
                _curDom.classList.remove('q-correct-edit-highlight');
                clearTimeout(_timer);
            }, 3000);
        },
        replace_error_word_by_outside(errObj) { // 替换错字
            const _tagName = this.get_u_data_tag_name(errObj);
            const _curDom = this.$refs['ref-highlight'].querySelector(`u:not(.overlook)[data-tag=${_tagName}]`);
            if (!_curDom) return;
            _curDom.outerHTML = errObj.correct_frag;
            const _contentDom = this.$refs['ref-highlight'];
            this.get_current_u_tag();
            this.notice_total_words_to_outside(_contentDom.innerText);
            this.format_back_html(_contentDom.innerHTML);
        },
        replace_all_error_words_by_outside(errArr) { // 替换全部错字
            errArr.forEach((errObj) => {
                const _tagName = this.get_u_data_tag_name(errObj);
                const _curDom = this.$refs['ref-highlight'].querySelectorAll(`u:not(.overlook)[data-tag=${_tagName}]`);
                if (!_curDom) return;
                _curDom.forEach(item => {
                    item.outerHTML = errObj.correct_frag;
                });
            });
            const _contentDom = this.$refs['ref-highlight'];
            this.notice_total_words_to_outside(_contentDom.innerText);
            this.format_back_html(_contentDom.innerHTML);
        },
        overlook_error_word_by_outside(errObj) { // 忽略错别字
            const _tagName = this.get_u_data_tag_name(errObj);
            const _curDom = this.$refs['ref-highlight'].querySelector(`u:not(.overlook)[data-tag=${_tagName}]`);
            if (!_curDom) return;
            _curDom.classList.add('overlook');
            this.get_current_u_tag();
        },
        overlook_all_error_words_by_outside(errArr) { // 忽略全部错别字
            errArr.forEach(errObj => {
                const _tagName = this.get_u_data_tag_name(errObj);
                const _curDom = this.$refs['ref-highlight'].querySelectorAll(`u:not(.overlook)[data-tag=${_tagName}]`);
                if (!_curDom) return;
                _curDom.forEach(item => {
                    item.classList.add('overlook');
                });
            });
        },
        withdraw_overlook_by_outside(errObj) { // 撤销忽略
            const _tagName = this.get_u_data_tag_name(errObj);
            const _curDom = this.$refs['ref-highlight'].querySelectorAll(`u[data-tag=${_tagName}]`);
            if (!_curDom) return;
            _curDom.forEach(item => {
                item.classList.remove('overlook');
            });
        },
        format_content_by_outside() { // 由外部触发自动排版
            _html = polyfill_ie_paste(this.$refs['ref-highlight'].innerHTML);
            let _html = replace_sapce(_html);
            this.$refs['ref-highlight'].innerHTML = _html;
            // this.componentKey += 1; // 强制更新组件，输入空格后，把空格过滤掉之后，数据没有变化，不强制更新组件，页面上的空格将没有去除
        },
        upload_highlight_info_by_outside(highlightInfo = {}) { // 外部更新敏感词信息，重新标亮
            this.$refs['ref-highlight'].innerHTML = product_highLight_html(this.$refs['ref-highlight'].innerHTML, highlightInfo, this.isSingleWordValidate, this.isSingleNumberValidate);
        },
        check_repeat_paragraph_by_outside() { // 外部调用，检测重复的段落信息
            this.format_content_by_outside();
            this.remove_all_repeat_class();
            const _container = this.$refs['ref-highlight'];
            const _repeatInfo = check_repeat_paragraph(_container.childNodes);
            _repeatInfo.repeatArr.forEach(repeatIdx => {
                _container.childNodes[repeatIdx].classList.add('repeat-paragraph');
            });
            return _repeatInfo;
        },
        clear_error_words_by_outside() { // 去除u标签纠错词
            const _container = this.$refs['ref-highlight'];
            if (!_container || !_container.innerHTML) return;
            _container.innerHTML = del_u_tag(_container.innerHTML);
        },
        recheck_error_word_by_outside(errArr) { // 重新检测错别字
            if (!errArr || errArr.length == 0) return;
            this.errorWords = [];
            errArr.forEach(erroInfo => {
                this.errorWords = [...this.errorWords, ...erroInfo.errorWords];
            });
            this.clear_error_words_by_outside();
            // 根据纠错内容添加纠错标签
            const _content = this.$refs['ref-highlight'].innerHTML;
            const _realTimeContent = add_erro_underline_by_regex(errArr, _content);
            this.$refs['ref-highlight'].innerHTML = _realTimeContent;
            this.get_current_u_tag(); // 返回当前页面的纠错的错词信息，保持组件外和组件内展示保持一致
        },
        /** 组件外部访问的方法 end */

        /** 功能方法 begin */
        focuse_div() { // 聚焦到输入框,placeholder用到的方法
            this.$refs['ref-highlight'].focus();
        },
        notice_total_words_to_outside(text) { // 告诉外部当前有多少字数
            this.$emit('totalWords', get_total_word_num(text));
        },
        format_back_html(html){ // 格式化数据，返回
            // 兼容chrome浏览器输入第二个空格为&nbsp;
            let _html = replace_nbsp(html);
            // 修改后的数据重新赋值
            if (this.isReturnContentIncludePtag) _html = del_html_tag_except_p(_html);
            else _html = replace_html_to_text(_html);
            this.$emit('input', _html);
        },
        remove_all_range_class() { // 去除所有的定位光标标签
            if (!this.$refs['ref-highlight']) return;
            const _rangeArr = Array.from(this.$refs['ref-highlight'].getElementsByClassName('js-range-dom'));
            _rangeArr.forEach(item => {
                item.classList.remove('js-range-dom');
            });
        },
        remove_all_repeat_class() { //  去除所有重复样式
            if (!this.$refs['ref-highlight']) return;
            const _repeatArr = Array.from(this.$refs['ref-highlight'].getElementsByClassName('repeat-paragraph'));
            _repeatArr.forEach(item => {
                item.classList.remove('repeat-paragraph');
            });
        },
        get_focuse_dom() {
            // 找到需要校验的dom节点
            let _inputDom = window.getSelection().getRangeAt(0).endContainer;
            _inputDom = this.get_tag_by_name(_inputDom, 'p');
            return _inputDom;
        },
        get_u_data_tag_name(errObj) { // 获取u标签上的data-tag
            let _idNum = (+errObj.index_begin) + (+errObj.begin_pos);
            if (errObj.is_realtime == '1') _idNum = errObj.uid;
            return `js-correct-${_idNum}`;
        },
        get_tag_by_name(dom, searchTagName = 'u') { // 点击纠错词时，获取到u标签dom，通过递归实现查找
            if (!this.$refs['ref-highlight']) return;
            const _isContains = this.$refs['ref-highlight'].contains(dom); // 当前dom是否包含在当前编辑框内
            if (!dom || !_isContains) return; // dom不存在或者找到的dom不在编辑框节点时，不继续往上找
            const _tagName = dom.localName;
            if (_tagName == searchTagName) {
                return dom;
            } else return this.get_tag_by_name(dom.parentElement, searchTagName);
        }
        /** 功能方法 end */
    }
};
</script>

<style lang="scss" scoped>
$fontSizeArr: (10 11 12 13 14 15 16 17 18 19 20 21 22);

.q-highlight-box {
    position: relative;
}

.q-contenteditable {
    border: 1px solid var(--theme-border-base);
    background: var(--theme-bg-eyecase) !important;
    color: var(--theme-font-chapter);
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
    /deep/.repeat-paragraph {
        background: var(--theme-bg-repeat);
    }
}
@for $i from 1 through length($fontSizeArr){
    .font-size-#{nth($fontSizeArr, $i)}{
        font-size: #{nth($fontSizeArr, $i)}px !important;
    }
}

.out-max-words {
    border: 2px solid var(--theme-border-error);
}

/deep/mark {
    padding: 0px;
    &.ban {
        background: var(--theme-bg-ban);
        * {
            background: var(--theme-bg-ban) !important;
        }
    }
    &.danger {
        background: var(--theme-bg-danger);
        * {
            background: var(--theme-bg-danger) !important;
        }
    }
    &.sensitive {
        background: var(--theme-bg-sensitive);
    }
}

/deep/u { // 错别字下划线
    text-decoration: none;
    &:not(.overlook) {
        // border-bottom: 3px var(--theme-border-error) solid;
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='6' height='3' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 2.5C1.5 2.5 1.5 1 3 1s1.5 1.5 3 1.5' stroke='%23ff4f00' fill='none' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: repeat-x;
        background-position: 0 100%;
        word-break: break-all;
        padding-bottom: 1px;
        &:active {
            background: var(--theme-bg-error-active);
        }
    }
}

// 对比，暂时与纠错冲突
/deep/i {
    background: #bbd8f7;
}

.q-correct-tooltip {
    display: none;
    position: absolute;
    background: var(--theme-bg-tooltip);
    width: -webkit-fit-content;
    width: fit-content;
    min-width: 42px;
    border-radius: 4px;
    white-space: nowrap;
    box-shadow: 0 2px 8px 0 var(--theme-shadow-base);
    z-index: 10;
    .q-correct-tooltip-diamond {
        display: block;
        position: absolute;
        width: 8px;
        height: 8px;
        background-color: var(--theme-bg-tooltip);
        top: -4px;
        left: 50%;
        -webkit-transform: translateX(-50%) rotate(45deg);
        transform: translateX(-50%) rotate(45deg);
        -webkit-transform-origin: center;
        transform-origin: center;
        box-shadow: -3px -3px 7px var(--theme-shadow-base);
    }
    .q-correct-tooltip-content {
        font-family: PingFangSC-Regular;
        font-size: 14px;
        line-height: 34px;
        padding: 0 12px;
        border-radius: 4px;
        .q-correct-word {
            font-size: 12px;
            line-height: 20px;
            text-decoration: none;
            color: var(--theme-font-link);
            cursor: pointer;
            &:hover {
                color: var(--theme-font-link-hover);
            }
        }
    }
}

/deep/.q-correct-edit-highlight {
    -webkit-animation-name: QCorrectHighlight;
    -webkit-animation-duration: 3s;
    -webkit-animation-timing-function: linear;
    -webkit-animation-iteration-count: 1;
    -webkit-animation-direction: alternate;
    animation-name: QCorrectHighlight;
    animation-duration: 3s;
    animation-timing-function: linear;
    animation-iteration-count: 1;
    animation-direction: alternate;
}

@keyframes QCorrectHighlight
{
    from {background: var(--theme-bg-error-animation);}
    to {background: none;}
}

.q-placeholder {
    color: var(--theme-font-placeholder);
    cursor: text;
    user-select: none;
    padding: 0px 10px;
    margin-block-start: 1em;
    margin-block-end: 1em;
    position: absolute;
    z-index: 99;
    left: 2px;
    top: 0px;
    text-indent: 2em;
    pointer-events: none;
    &.hidden {
        display: none;
    }
}

.error-word-undline {
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='6' height='3' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 2.5C1.5 2.5 1.5 1 3 1s1.5 1.5 3 1.5' stroke='%23ff4f00' fill='none' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: repeat-x;
    background-position: 0 100%;
    word-break: break-all;
    padding-bottom: 1px;
}
</style>
