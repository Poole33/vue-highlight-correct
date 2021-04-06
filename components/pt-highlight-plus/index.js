import PtHighlightPlus from './index.vue';

// 为组件添加 install 方法，用于按需引入
PtHighlightPlus.install = function(Vue) {
    Vue.component(PtHighlightPlus.name, PtHighlightPlus);
};

export default PtHighlightPlus;
