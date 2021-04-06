// 格式化$nbsp;为' '
export function replace_nbsp(html) {
    return html.replace(/&nbsp;/gi, ' ');
}
// 生成 页面高亮需要的数据  即 div里的内容
export function product_highLight_html(editContent, highLightData, isSingleWordValidate = false, isSingleNumberValidate = false) {
    let _html = editContent;
    _html = _html.replace(/<\/?((mark|\/mark)).*?>/gi, '');

    // 当开启单个英文字母和数字校验时，才进行单个英文字母和数字的校验
    if (isSingleWordValidate){
        _html = _html.replace(/([a-z])(?!([a-z]*>))/gim, `<mark class="danger">$&</mark>`);
    }

    if (isSingleNumberValidate){
        _html = _html.replace(/[0-9]/g, '<mark class="danger">$&</mark>');
    }

    // 敏感词高亮
    _html = add_bg_color_by_words(highLightData.sensitiveWords, _html, 'sensitive');

    // 高危词高亮
    _html = add_bg_color_by_words(highLightData.dangerWords, _html, 'danger');

    // 禁词高亮
    _html = add_bg_color_by_words(highLightData.banWords, _html, 'ban');

    return _html;
}

// 通过词，给词加背景色，相比没抽离，相对更占用内存空间
export function add_bg_color_by_words(words, html, className) {
    let _words = [];
    if (words) _words = Array.from(new Set(words.split(',')));

    if (_words.length > 0){
        _words.forEach(n => {
            if (isNaN(n)){
                n = format_first_initial_include_special_symbol(n);
                if (n.search(/^[A-Za-z]+$/) != -1) {
                    html = format_english_word(n, html, className);
                } else html = html.replace(new RegExp(n, 'gi'), `<mark class=${className}>$&</mark>`);
            }
        });
    }
    return html;
}

// 给英文添加高亮
function format_english_word(word, html, className) {
    html = html.replace(new RegExp(`${word}(?!([a-z]|[0-9]| |=|"|[^x00-xff])*>)`, 'gi'), `<mark class=${className}>$&</mark>`);
    return html;
}

// 格式化首字母特殊符号
function format_first_initial_include_special_symbol(word) {
    const _specialSymbol = ['+', '|', '?', '.', '*'];
    const _firstInitial = word.slice(0, 1);
    if (_specialSymbol.includes(_firstInitial)) word = '\\' + word;
    return word;
}

// 去除 除<p></p>标签外的所有html标签
export function del_html_tag_include_p(html) {
    return html.replace(/<\/?(?!(p|\/p)).*?>/gi, '');
}

// 去除所有html标签
export function del_all_html_tag(html) {
    return html.replace(/<\/?.+?>/gi, '');
}

// 把html文本替换成不含html的有换行的文本
export function replace_html_to_text(content) {
    if (!content) return '';

    let _text = content.replace(/<p><\/p>/gi, '');

    const _chapterArr = _text.split(/<\/p>/gi);
    // 最后一个为空的话 去除
    if (!_chapterArr[_chapterArr.length]) _chapterArr.pop();
    // 所有的不是p的标签都移除
    _text = _chapterArr.join('\n').replace(/<\/?.+?>/g, '');
    return _text;
}

// 把换行符的text文本替换成p标签
export function replace_text_to_p(text) {
    if (!text) return '';
    // eslint-disable-next-line no-irregular-whitespace
    const _pTag = '<p>' + text + '</p>';
    return _pTag.replace(/\n/gi, '</p><p>');
}
