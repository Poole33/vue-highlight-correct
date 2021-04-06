// 文本比较
export function text_diff(editContent, contrastContent) {
    // if (!op.eq_min) op.eq_min = 3;
    // if (!op.eq_index) op.eq_index = 5;
    const _eqMin = 3;
    const _eqIndex = 5;

    const ps = {
        v1_i: 0,
        v1_new_value: '',
        v2_i: 0,
        v2_new_value: ''
    };
    if (contrastContent === '' && editContent.length > 0) return `<i>${editContent}</i>`;

    while (ps.v1_i < contrastContent.length && ps.v2_i < editContent.length) {
        if (contrastContent[ps.v1_i] == editContent[ps.v2_i]) {
            // ps.v1_new_value += contrastContent[ps.v1_i].replace(/</g,"<").replace(">",">");
            ps.v2_new_value += editContent[ps.v2_i].replace(/</g, '<').replace('>', '>');
            ps.v1_i += 1;
            ps.v2_i += 1;
            // 值2增加的部分
            if (ps.v1_i >= contrastContent.length) {
                ps.v2_new_value += '<i>' + editContent.substr(ps.v2_i).replace(/</g, '<').replace('>', '>') + '</i>';
                break;
            }
            // 值1删除的部分
            // if (ps.v2_i >= editContent.length) {
            //     ps.v1_new_value += "<span style='" + contrastContent_style + "'>" + contrastContent.substr(ps.v1_i).replace(/</g,"<").replace(">",">") + "</span>";
            //     break;
            // }
        } else {
            ps.v1_index = ps.v1_i + 1;
            ps.v1_eq_length = 0;
            ps.v1_eq_max = 0;
            ps.v1_start = ps.v1_i + 1;
            while (ps.v1_index < contrastContent.length) {
                if (contrastContent[ps.v1_index] == editContent[ps.v2_i + ps.v1_eq_length]) ps.v1_eq_length += 1;
                else if (ps.v1_eq_length > 0) {
                    if (ps.v1_eq_max < ps.v1_eq_length) {
                        ps.v1_eq_max = ps.v1_eq_length;
                        ps.v1_start = ps.v1_index - ps.v1_eq_length;
                    }
                    ps.v1_eq_length = 0;
                    break;// 只寻找最近的
                }
                ps.v1_index += 1;
            }
            if (ps.v1_eq_max < ps.v1_eq_length) {
                ps.v1_eq_max = ps.v1_eq_length;
                ps.v1_start = ps.v1_index - ps.v1_eq_length;
            }

            ps.v2_index = ps.v2_i + 1;
            ps.v2_eq_length = 0;
            ps.v2_eq_max = 0;
            ps.v2_start = ps.v2_i + 1;
            while (ps.v2_index < editContent.length) {
                if (editContent[ps.v2_index] == contrastContent[ps.v1_i + ps.v2_eq_length]) ps.v2_eq_length += 1;
                else if (ps.v2_eq_length > 0) {
                    if (ps.v2_eq_max < ps.v2_eq_length) {
                        ps.v2_eq_max = ps.v2_eq_length;
                        ps.v2_start = ps.v2_index - ps.v2_eq_length;
                    }
                    ps.v1_eq_length = 0;
                    break;// 只寻找最近的
                }
                ps.v2_index += 1;
            }
            if (ps.v2_eq_max < ps.v2_eq_length) {
                ps.v2_eq_max = ps.v2_eq_length;
                ps.v2_start = ps.v2_index - ps.v2_eq_length;
            }
            if (ps.v1_eq_max < _eqMin && ps.v1_start - ps.v1_i > _eqIndex) ps.v1_eq_max = 0;

            if (ps.v2_eq_max < _eqMin && ps.v2_start - ps.v2_i > _eqIndex) ps.v2_eq_max = 0;

            if ((ps.v1_eq_max == 0 && ps.v2_eq_max == 0)) {
                // 两个值的字不同
                // ps.v1_new_value += "<span style='" + contrastContent_style + "'>" + contrastContent[ps.v1_i].replace(/</g,"<").replace(">",">") + "</span>";
                ps.v2_new_value += '<i>' + editContent[ps.v2_i].replace(/</g, '<').replace('>', '>') + '</i>';
                ps.v1_i += 1;
                ps.v2_i += 1;
                // 值2增加的部分
                if (ps.v1_i >= contrastContent.length) {
                    ps.v2_new_value += '<i>' + editContent.substr(ps.v2_i).replace(/</g, '<').replace('>', '>') + '</i>';
                    break;
                }
                // 值1删除的部分
                if (ps.v2_i >= editContent.length) {
                    // ps.v1_new_value += "<span style='" + contrastContent_style + "'>" + contrastContent.substr(ps.v1_i).replace(/</g,"<").replace(">",">") + "</span>";
                    break;
                }
                // 值1删除的
            } else if (ps.v1_eq_max > ps.v2_eq_max) {
                // ps.v1_new_value += "<span style='" + contrastContent_style + "'>" + contrastContent.substr(ps.v1_i, ps.v1_start - ps.v1_i).replace(/</g,"<").replace(">",">") + "</span>";
                ps.v1_i = ps.v1_start;
            } else {
                // 值2增加的
                ps.v2_new_value += '<i>' + editContent.substr(ps.v2_i, ps.v2_start - ps.v2_i).replace(/</g, '<').replace('>', '>') + '</i>';
                ps.v2_i = ps.v2_start;
            }
        }
    }
    return ps.v2_new_value;
}
