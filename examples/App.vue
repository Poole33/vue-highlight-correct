<template>
  <div id="app">
    <button @click="click_btn">hook</button>
    <br>
    <button @click="position_word">position</button>
    <br>
    <button @click="replace_word">replace</button>
    <br>
    <br>
    <PtHighlightPlus
        v-model="contentHighlightData.content"
        :highLightInfo="contentHighlightData"
        :errorWordsArrs="errorWordsArrs"
        height=""
        formatType="book"
        backgroundColor="#F7F4ED"
        ref="ref-hl">
    </PtHighlightPlus>
  </div>
</template>

<script>
import PtHighlightPlus from '../components/pt-highlight-plus/index.vue';

export default {
    name: 'App',
    components: {
        PtHighlightPlus
    },
    data() {
        return {
            contentHighlightData: {},
            errorWordsArrs: []
        };
    },
    created() {
        this.init_data();
    },
    methods: {
        click_btn() {
            console.log('this.contentHighlightData.content', this.contentHighlightData.content);
        },
        position_word() {
            this.$refs['ref-hl'].position_correct_word_by_outside(this.errorWordsArrs[0]);
        },
        replace_word() {
            this.$refs['ref-hl'].replace_correct_words_by_outside([this.errorWordsArrs[0]]);
        },
        init_data() {
            this.contentHighlightData.content = `<p>测试数据测试数据加测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据测试数据</p>`;

            this.contentHighlightData.sensitiveWords = '测试'; // 敏感词
            this.contentHighlightData.dangerWords = ''; // 高危词
            this.contentHighlightData.banWords = ''; // 禁词
            this.errorWordsArrs = [
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
            ];
        }
    }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* margin-top: 60px; */
}
</style>
