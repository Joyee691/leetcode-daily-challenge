// gitbook 插件
const plugins = [
	// 显示右上角 github logo
	'github-buttons',
	// 左侧大纲折叠
	'chapter-fold',
	// 代码右上角复制 icon
	'code',
	// 代码块高亮（需要配合自己制定的语言），使用的同时需要禁用默认的 highlight
	'prism',
	'-highlight',
	// 支持中英文搜索，需要禁用 search 与 lunr 插件
	'search-plus',
	// 默认搜索插件的后端
	'-lunr',
	// 默认搜索插件的前端
	'-search',
	// 数学公式
	'latex-codecogs',
	// 默认分享
	'-sharing',
	// 给 md 加点颜色
	'theme-comscore',
	// 自由调节左侧大纲宽度
	'splitter',
	// toc 与回到顶部按钮
	'anchor-navigation-ex',
	// 默认热更新插件（在 build 的时候不用）
	'-livereload',
];
// gitbok插件的配置
const pluginsConfig = {
	'github-buttons': {
		buttons: [
			{
				user: 'Joyee691',
				repo: 'leetcode-daily-challenge',
				type: 'star',
				size: 'small',
			},
		],
	},
	'anchor-navigation-ex': {
		showLevel: false,
		associatedWithSummary: false,
		printLog: false,
		multipleH1: false,
		showGoTop: true,
	},
	prism: {
		lang: {
			'c++': 'cpp',
		},
		css: ['prismjs/themes/prism-tomorrow.css'],
	},
};

// 专门给开发模式的配置
if (process.env.NODE_ENV === 'dev') {
	// 添加热更新
	plugins.push('livereload');
	// 打印其他插件的报错 log
	pluginsConfig['anchor-navigation-ex'].printLog = true;
}

module.exports = {
	title: 'LeetCode Daily Challenge',
	author: 'Joyee691',
	description: '一个记录 LeetCode 每日一题的仓库',
	language: 'zh-hans',
	gitbook: '3.2.3',
	plugins,
	pluginsConfig,
};
