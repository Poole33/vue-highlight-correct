// 给错别字加下划线(html)
export function add_error_words_underline(errorWordsArr, html) {
    if (!errorWordsArr && errorWordsArr.length == 0) return;

    let _offsetIdx = 0; // 偏移次数，每加一个错别字标签，加一
    let _reviseWordDiffLength = 0; // 替换字 与 被替换字 的字数差值，累加
    let _correctWordAccLength = 0; // u标签中添加属性 值为 正确的字 添加标签需要累加

    errorWordsArr.forEach(errorWordObj => {
        const _errWordObj = { ...errorWordObj };
        const _tagLength = 23 + 14;
        const _offsetNum = _offsetIdx * _tagLength + _correctWordAccLength + _reviseWordDiffLength;
        const _wordLength = _errWordObj.ori_frag.length;
        const _wordIdx = (+_errWordObj.index_begin) + (+_errWordObj.begin_pos);

        const _subWord = html.substring(_wordIdx + _offsetNum, _wordIdx + _wordLength + _offsetNum); // 原文截取 要标记的字

        // 与接口数据对比，接口数据 与 要标记的字 相同才标记，避免标记错误
        if (_subWord == _errWordObj.ori_frag) {
            let _replaceContent = ''; // 标记后的内容

            if (!_errWordObj.is_edit && !_errWordObj.is_overlook) {
                _replaceContent = `<u id="correct-${_wordIdx}" data-correct="${_errWordObj.correct_frag}">${_errWordObj.ori_frag}</u>`;
            } else if (_errWordObj.is_edit) {
                _replaceContent = _errWordObj.correct_frag;
            } else if (_errWordObj.is_overlook) {
                _replaceContent = _errWordObj.ori_frag;
            }

            // 替换文本
            html = html.substring(0, _wordIdx + _offsetNum) + _replaceContent + html.substring(_wordIdx + _wordLength + _offsetNum, html.length);

            // 加了下划线标签 偏移次数加1
            if (!_errWordObj.is_edit && !_errWordObj.is_overlook) {
                _offsetIdx += 1;
                // u标签属性内的正确文本，累加
                _correctWordAccLength += (_errWordObj.correct_frag.length + _wordIdx.toString().length);
            }

            // 替换完文字，根据替换文字的字差，计算偏移量
            if (_errWordObj.is_edit) _reviseWordDiffLength += (errorWordObj.correct_frag.length - errorWordObj.ori_frag.length);
        }
    });
    return html;
}

